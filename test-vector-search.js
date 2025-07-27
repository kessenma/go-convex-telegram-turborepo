#!/usr/bin/env node

const fetch = require('node-fetch');

const CONVEX_URL = 'http://localhost:3211';
const VECTOR_SERVICE_URL = 'http://localhost:7999';

async function testVectorSearch() {
  console.log('🔍 Testing Vector Search Pipeline...\n');

  // Step 1: Test embedding generation
  console.log('1. Testing embedding generation...');
  const query = "what is step 4?";
  
  const embedResponse = await fetch(`${VECTOR_SERVICE_URL}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: query })
  });
  
  if (!embedResponse.ok) {
    console.log('❌ Embedding generation failed');
    return;
  }
  
  const embedResult = await embedResponse.json();
  console.log('✅ Query embedding generated:', embedResult.dimension, 'dimensions');
  
  // Step 2: Check document embeddings
  console.log('\n2. Checking document embeddings...');
  const docId = 'j97dw637safb3qwqk99sq3e51h7m0g9m';
  
  try {
    const embeddingsResponse = await fetch(`${CONVEX_URL}/http/api/embeddings/document/${docId}`);
    if (embeddingsResponse.ok) {
      const embeddings = await embeddingsResponse.json();
      console.log('✅ Found', embeddings.length, 'embeddings for document');
      
      if (embeddings.length > 0) {
        const embedding = embeddings[0];
        console.log('   - Dimension:', embedding.embeddingDimensions);
        console.log('   - Model:', embedding.embeddingModel);
        console.log('   - Has chunk:', !!embedding.chunkText);
      }
    } else {
      console.log('❌ Failed to fetch document embeddings:', embeddingsResponse.status);
    }
  } catch (error) {
    console.log('❌ Error fetching embeddings:', error.message);
  }
  
  // Step 3: Test direct vector search via Convex HTTP
  console.log('\n3. Testing direct vector search...');
  try {
    const searchResponse = await fetch(`${CONVEX_URL}/http/api/embeddings/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryText: query,
        limit: 5,
        documentIds: [docId]
      })
    });
    
    if (searchResponse.ok) {
      const searchResults = await searchResponse.json();
      console.log('✅ Vector search returned', searchResults.length, 'results');
      
      if (searchResults.length > 0) {
        const result = searchResults[0];
        console.log('   - Score:', result._score?.toFixed(3));
        console.log('   - Document:', result.document?.title);
        console.log('   - Snippet:', result.chunkText?.substring(0, 100) || 'No chunk text');
      }
    } else {
      const errorText = await searchResponse.text();
      console.log('❌ Vector search failed:', searchResponse.status);
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Vector search error:', error.message);
  }
  
  // Step 4: Test via Web API
  console.log('\n4. Testing via Web API...');
  try {
    const webResponse = await fetch('http://localhost:3000/api/RAG/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        documentIds: [docId],
        conversationHistory: []
      })
    });
    
    if (webResponse.ok) {
      const webResult = await webResponse.json();
      console.log('✅ Web API response received');
      console.log('   - Response:', webResult.response?.substring(0, 100) + '...');
      console.log('   - Sources:', webResult.sources?.length || 0);
      
      if (webResult.sources && webResult.sources.length > 0) {
        const source = webResult.sources[0];
        console.log('   - Top source score:', (source.score * 100).toFixed(1) + '%');
        console.log('   - Is chunk result:', source.isChunkResult || false);
      }
    } else {
      console.log('❌ Web API failed:', webResponse.status);
    }
  } catch (error) {
    console.log('❌ Web API error:', error.message);
  }
}

testVectorSearch().catch(console.error);