import { type NextRequest, NextResponse } from "next/server";
const LIGHTWEIGHT_LLM_URL = process.env.LIGHTWEIGHT_LLM_URL || 
                           process.env.LIGHTWEIGHT_LLM_INTERNAL_URL || 
                           "http://localhost:8082";

interface SimpleChatRequest {
  message: string;
  documentIds: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: SimpleChatRequest = await request.json();
    const { message, documentIds } = body;

    if (!message || !documentIds || documentIds.length === 0) {
      return NextResponse.json(
        { error: "Message and document IDs are required" },
        { status: 400 }
      );
    }

    console.log("🚀 Simple RAG Chat - Starting...");
    console.log("Message:", message);
    console.log("Document IDs:", documentIds);

    // Step 1: Get documents using HTTP endpoint (compatible with Python services)
    console.log("📋 Fetching documents with IDs:", documentIds);
    
    const documents = await Promise.all(
      documentIds.map(async (docId) => {
        try {
          console.log(`🔍 Fetching document: ${docId}`);
          const response = await fetch(`${process.env.CONVEX_HTTP_URL || "http://localhost:3211"}/api/documents/by-id?documentId=${docId}`);
          if (!response.ok) {
            console.error(`❌ Failed to fetch document ${docId}: ${response.status}`);
            return null;
          }
          const doc = await response.json();
          console.log(`✅ Document fetched:`, doc ? `${doc.title} (${doc._id})` : 'null');
          return doc;
        } catch (error) {
          console.error(`❌ Error fetching document ${docId}:`, error);
          return null;
        }
      })
    );

    const validDocuments = documents.filter(Boolean);
    console.log("✅ Valid documents found:", validDocuments.length);
    console.log("📄 Document titles:", validDocuments.map((doc: { title: string }) => doc?.title));

    if (validDocuments.length === 0) {
      console.error("❌ No valid documents found. Original IDs:", documentIds);
      return NextResponse.json(
        { 
          error: "No valid documents found",
          debug: {
            providedIds: documentIds,
            fetchResults: documents.map((doc, i) => ({ id: documentIds[i], found: !!doc }))
          }
        },
        { status: 400 }
      );
    }

    // Step 2: Use proper vector search with dynamic scoring
    let sources: Array<{
      documentId: string;
      title: string;
      snippet: string;
      score: number;
    }> = [];
    let context = "";
    
    try {
      console.log("🔍 Performing vector search with dynamic scoring...");
      
      // Use the fixed vector search API
      const vectorSearchResponse = await fetch(`http://localhost:3000/api/RAG/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: message,
          limit: 3,
          documentIds
        })
      });
      
      if (vectorSearchResponse.ok) {
        const vectorResult = await vectorSearchResponse.json();
        console.log("✅ Vector search completed:", vectorResult.results?.length || 0, "results found");
        
        if (vectorResult.success && vectorResult.results && vectorResult.results.length > 0) {
          const results = vectorResult.results;
          
          console.log("✅ Found relevant results with dynamic scores:", 
            results.map((r: { title: string; _score: number }) => `${r.title}: ${(r._score * 100).toFixed(1)}%`));
          
          // Build context from the most relevant results
          const contextParts = results.slice(0, 2).map((result: { title: string; content?: string; snippet?: string }) => {
            return `Document: ${result.title}\n\nRelevant content:\n${result.content || result.snippet || 'No content available'}\n`;
          });
          
          context = contextParts.join('\n---\n\n') + '\nAnswer the user\'s question based on this information.';
          
          // Create sources with real similarity scores
          sources = results.slice(0, 3).map((result: { _id: string; title: string; content?: string; snippet?: string; _score: number }) => ({
            documentId: result._id,
            title: result.title,
            snippet: (result.content || result.snippet || '').substring(0, 200),
            score: result._score // Use the real similarity score from vector search
          }));
        }
      } else {
        console.warn("Vector search API returned error:", vectorSearchResponse.status);
        const errorText = await vectorSearchResponse.text();
        console.warn("Error details:", errorText);
      }
    } catch (vectorError) {
      console.error("Vector search failed:", vectorError);
    }

    // Step 3: Fallback to document content if vector search failed or no results
    if (!context || sources.length === 0) {
      console.log("📝 Using document content fallback for all selected documents...");
      
      // Process ALL valid documents, not just the first one
      const contextParts: string[] = [];
      const fallbackSources: Array<{
        documentId: string;
        title: string;
        snippet: string;
        score: number;
      }> = [];
      
      // Look for specific patterns in the query for better relevance
      const stepMatch = message.match(/step\s*(\d+)/i);
      const queryWords = message.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      
      validDocuments.forEach((doc: { _id: string; title: string; content: string }) => {
        let relevanceScore = 0.3; // Base fallback score
        let snippet = doc.content.substring(0, 200);
        
        // Check for step-specific content
        if (stepMatch) {
          const stepNumber = stepMatch[1];
          const stepPattern = new RegExp(`${stepNumber}\\.[^\\d]*?(?=\\d\\.|$)`, 'i');
          const stepMatch2 = doc.content.match(stepPattern);
          
          if (stepMatch2) {
            snippet = stepMatch2[0].trim().substring(0, 200);
            relevanceScore = 0.8; // Higher score for specific step matches
            console.log(`✅ Found specific step content in ${doc.title}, using higher relevance score`);
          }
        }
        
        // Check for keyword matches to adjust relevance
        const contentLower = doc.content.toLowerCase();
        const matchedWords = queryWords.filter(word => contentLower.includes(word));
        
        if (matchedWords.length > 0) {
          relevanceScore = Math.min(0.6, 0.3 + (matchedWords.length / queryWords.length) * 0.3);
          console.log(`✅ Found ${matchedWords.length}/${queryWords.length} keyword matches in ${doc.title}, relevance: ${(relevanceScore * 100).toFixed(1)}%`);
        }
        
        // Add document content to context
        contextParts.push(`Document: ${doc.title}\n\nContent: ${doc.content}`);
        
        // Add to sources
        fallbackSources.push({
          documentId: doc._id,
          title: doc.title,
          snippet,
          score: relevanceScore
        });
      });
      
      // Combine all document content into a comprehensive context
      context = contextParts.join('\n\n---\n\n') + '\n\nAnswer the user\'s question based on the information from all these documents.';
      sources = fallbackSources;
      
      console.log(`✅ Fallback context created from ${validDocuments.length} documents`);
    }

    // Step 4: Call LLM directly
    console.log("🤖 Calling LLM service...");
    const llmResponse = await fetch(`${LIGHTWEIGHT_LLM_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        context,
        conversation_history: [],
        max_length: 200,
        temperature: 0.7,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error("LLM service error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate response from LLM service" },
        { status: 500 }
      );
    }

    const llmResult = await llmResponse.json();
    console.log("✅ LLM response generated");

    return NextResponse.json({
      response: llmResult.response,
      sources,
      model: llmResult.model_info,
      usage: llmResult.usage,
      method: "simple-rag"
    });

  } catch (error) {
    console.error("Simple RAG Chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Simple RAG Chat API is running",
    description: "A simplified RAG chat that bypasses session management",
  });
}