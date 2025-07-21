#!/usr/bin/env node

/**
 * Test script to verify RAG embeddings are working properly
 * This script will test the entire RAG pipeline from embedding generation to search
 */

const fetch = require('node-fetch');

// Configuration
const CONVEX_URL = process.env.CONVEX_URL || 'http://localhost:3211';
const VECTOR_SERVICE_URL = process.env.VECTOR_CONVERT_LLM_URL || 'http://localhost:8081';
const WEB_API_URL = process.env.WEB_API_URL || 'http://localhost:3000';

// Test queries
const TEST_QUERIES = [
  "what are the steps in the document?",
  "what is step 4?",
  "how do I install Docker?",
  "what about Coolify installation?",
  "deployment process"
];

async function testVectorService() {
  console.log('\n🔧 Testing Vector Service...');
  
  try {
    // Test health
    const healthResponse = await fetch(`${VECTOR_SERVICE_URL}/health`);
    const health = await healthResponse.json();
    console.log('✅ Vector service health:', health.status);
    console.log('   Model loaded:', health.model_loaded);
    console.log('   Memory usage:', health.memory_usage?.process_memory_mb + 'MB');
    
    // Test embedding generation
    const embedResponse = await fetch(`${VECTOR_SERVICE_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'test embedding generation' })
    });
    
    if (embedResponse.ok) {
      const embedResult = await embedResponse.json();
      console.log('✅ Embedding generation working');
      console.log('   Dimension:', embedResult.dimension);
      console.log('   Processing time:', embedResult.processing_time_ms + 'ms');
    } else {
      console.log('❌ Embedding generation failed:', embedResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Vector service error:', error.message);
  }
}

async function testConvexDocuments() {
  console.log('\n📄 Testing Convex Documents...');
  
  try {
    const response = await fetch(`${CONVEX_URL}/api/documents?limit=5`);
    if (response.ok) {
      const documents = await response.json();
      console.log('✅ Found', documents.page?.length || 0, 'documents');
      
      if (documents.page && documents.page.length > 0) {
        const doc = documents.page[0];
        console.log('   Sample document:', doc.title);
        console.log('   Has embedding:', doc.hasEmbedding);
        console.log('   Content length:', doc.content?.length || 0);
        
        return documents.page;
      }
    } else {
      console.log('❌ Failed to fetch documents:', response.status);
    }
  } catch (error) {
    console.log('❌ Document fetch error:', error.message);
  }
  
  return [];
}

async function testEmbeddingSearch(documents) {
  console.log('\n🔍 Testing Embedding Search...');
  
  if (!documents || documents.length === 0) {
    console.log('❌ No documents to test with');
    return;
  }
  
  const testDoc = documents[0];
  console.log('Testing with document:', testDoc.title);
  
  try {
    // Test vector search directly
    const searchResponse = await fetch(`${CONVEX_URL}/http/api/embeddings/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryText: 'installation steps',
        limit: 3,
        documentIds: [testDoc._id]
      })
    });
    
    if (searchResponse.ok) {
      const searchResults = await searchResponse.json();
      console.log('✅ Vector search working');
      console.log('   Results found:', searchResults.length);
      
      if (searchResults.length > 0) {
        const result = searchResults[0];
        console.log('   Top result score:', result._score?.toFixed(3));
        console.log('   Is chunk result:', result.isChunkResult);
        console.log('   Snippet:', result.chunkText?.substring(0, 100) + '...');
      }
    } else {
      console.log('❌ Vector search failed:', searchResponse.status);
      const errorText = await searchResponse.text();
      console.log('   Error:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Vector search error:', error.message);
  }
}

async function testRAGChat(documents) {
  console.log('\n💬 Testing RAG Chat...');
  
  if (!documents || documents.length === 0) {
    console.log('❌ No documents to test with');
    return;
  }
  
  const testDoc = documents[0];
  console.log('Testing chat with document:', testDoc.title);
  
  for (const query of TEST_QUERIES.slice(0, 2)) { // Test first 2 queries
    console.log(`\n   Query: "${query}"`);
    
    try {
      const chatResponse = await fetch(`${WEB_API_URL}/api/RAG/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          documentIds: [testDoc._id],
          conversationHistory: []
        })
      });
      
      if (chatResponse.ok) {
        const chatResult = await chatResponse.json();
        console.log('   ✅ Response:', chatResult.response?.substring(0, 150) + '...');
        console.log('   Sources found:', chatResult.sources?.length || 0);
        console.log('   Processing time:', chatResult.processingTimeMs + 'ms');
        
        if (chatResult.sources && chatResult.sources.length > 0) {
          const source = chatResult.sources[0];
          console.log('   Top source score:', (source.score * 100).toFixed(1) + '%');
          console.log('   Source snippet:', source.snippet?.substring(0, 100) + '...');
        }
      } else {
        console.log('   ❌ Chat failed:', chatResponse.status);
        const errorText = await chatResponse.text();
        console.log('   Error:', errorText.substring(0, 200));
      }
      
    } catch (error) {
      console.log('   ❌ Chat error:', error.message);
    }
  }
}

async function testDocumentEmbeddings(documents) {
  console.log('\n🧮 Testing Document Embeddings...');
  
  if (!documents || documents.length === 0) {
    console.log('❌ No documents to test with');
    return;
  }
  
  const testDoc = documents.find(doc => doc.hasEmbedding) || documents[0];
  console.log('Testing embeddings for:', testDoc.title);
  
  try {
    const embeddingsResponse = await fetch(`${CONVEX_URL}/api/documents/${testDoc._id}/embeddings`);
    
    if (embeddingsResponse.ok) {
      const embeddings = await embeddingsResponse.json();
      console.log('✅ Found', embeddings.length, 'embeddings');
      
      if (embeddings.length > 0) {
        const embedding = embeddings[0];
        console.log('   Embedding dimension:', embedding.embeddingDimensions);
        console.log('   Model:', embedding.embeddingModel);
        console.log('   Has chunk text:', !!embedding.chunkText);
        console.log('   Chunk index:', embedding.chunkIndex);
        
        if (embedding.chunkText) {
          console.log('   Chunk preview:', embedding.chunkText.substring(0, 100) + '...');
        }
      }
    } else {
      console.log('❌ Failed to fetch embeddings:', embeddingsResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Embeddings fetch error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting RAG Embeddings Test Suite');
  console.log('=====================================');
  
  // Test vector service
  await testVectorService();
  
  // Test document fetching
  const documents = await testConvexDocuments();
  
  // Test document embeddings
  await testDocumentEmbeddings(documents);
  
  // Test embedding search
  await testEmbeddingSearch(documents);
  
  // Test RAG chat
  await testRAGChat(documents);
  
  console.log('\n✨ Test suite completed!');
  console.log('\nIf you see mostly ✅ marks, your RAG system is working with embeddings.');
  console.log('If you see ❌ marks, check the error messages above.');
}

// Run the tests
runTests().catch(console.error);