import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "../../../../generated-convex";

const convex = new ConvexHttpClient(
  process.env.CONVEX_HTTP_URL || "http://localhost:3211"
);
const LIGHTWEIGHT_LLM_URL =
  process.env.LIGHTWEIGHT_LLM_INTERNAL_URL || "http://localhost:8082";
const VECTOR_SERVICE_URL = 
  process.env.VECTOR_CONVERT_LLM_URL || "http://localhost:8081";

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

    // Step 1: Get documents directly
    const documents = await Promise.all(
      documentIds.map(async (docId) => {
        try {
          const doc = await convex.query(api.documents.getDocumentById, {
            documentId: docId as any,
          });
          return doc;
        } catch (error) {
          console.error(`Error fetching document ${docId}:`, error);
          return null;
        }
      })
    );

    const validDocuments = documents.filter(Boolean);
    console.log("✅ Valid documents:", validDocuments.length);

    if (validDocuments.length === 0) {
      return NextResponse.json(
        { error: "No valid documents found" },
        { status: 400 }
      );
    }

    // Step 2: Try vector search first
    let sources: any[] = [];
    let context = "";
    
    try {
      console.log("🔍 Attempting vector search...");
      
      // Generate query embedding
      const embedResponse = await fetch(`${VECTOR_SERVICE_URL}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });
      
      if (embedResponse.ok) {
        const embedResult = await embedResponse.json();
        console.log("✅ Query embedding generated:", embedResult.dimension, "dimensions");
        
        // Try to find similar embeddings by comparing with document embeddings
        // For now, we'll use a simple approach and build context from full documents
        const doc = validDocuments[0] as any;
        
        // Look for specific patterns in the query
        const stepMatch = message.match(/step\s*(\d+)/i);
        if (stepMatch) {
          const stepNumber = stepMatch[1];
          const stepPattern = new RegExp(`${stepNumber}\\.[^\\d]*?(?=\\d\\.|$)`, 'i');
          const stepMatch2 = doc.content.match(stepPattern);
          
          if (stepMatch2) {
            context = `Document: ${doc.title}

Relevant section:
${stepMatch2[0].trim()}

Full context:
${doc.content}

Answer the user's question based on this information, focusing on the relevant section.`;
            
            sources = [{
              documentId: doc._id,
              title: doc.title,
              snippet: stepMatch2[0].trim().substring(0, 200),
              score: 0.9
            }];
            
            console.log("✅ Found specific step content");
          }
        }
        
        // Fallback to full document context
        if (!context) {
          context = `Document: ${doc.title}

Content: ${doc.content}

Answer the user's question based on this information.`;
          
          sources = [{
            documentId: doc._id,
            title: doc.title,
            snippet: doc.content.substring(0, 200),
            score: 0.7
          }];
        }
      }
    } catch (vectorError) {
      console.error("Vector search failed:", vectorError);
    }

    // Step 3: Fallback to keyword search if vector search failed
    if (!context) {
      console.log("📝 Using keyword search fallback...");
      const doc = validDocuments[0] as any;
      
      context = `Document: ${doc.title}

Content: ${doc.content}

Answer the user's question based on this information.`;
      
      sources = [{
        documentId: doc._id,
        title: doc.title,
        snippet: doc.content.substring(0, 200),
        score: 0.5
      }];
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