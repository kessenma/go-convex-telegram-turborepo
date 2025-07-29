#!/usr/bin/env node

// Test script to debug vector search functionality
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testVectorSearchPipeline() {
  console.log('🔍 Testing Vector Search Pipeline...\n');

  try {
    // Step 1: Get available documents
    console.log('1. Fetching available documents...');
    const docsResponse = await fetch(`${BASE_URL}/api/documents`);
    
    if (!docsResponse.ok) {
      console.error('❌ Failed to fetch documents:', docsResponse.status, docsResponse.statusText);
      return;
    }
    
    const docsData = await docsResponse.json();
    console.log('✅ Raw API response keys:', Object.keys(docsData));
    
    // Handle paginated response structure
    let documents = docsData.page || docsData.documents || [];
    console.log('✅ Documents found:', documents.length);
    
    if (!Array.isArray(documents) || documents.length === 0) {
      console.log('⚠️ No documents found. Upload some documents first.');
      console.log('Response structure:', JSON.stringify(docsData, null, 2));
      return;
    }
    
    // Show document details
     documents.forEach((doc, i) => {
       console.log(`  ${i + 1}. ${doc.title} (${doc._id}) - hasEmbedding: ${doc.hasEmbedding}`);
     });
     
     const documentIds = documents.slice(0, 2).map(doc => doc._id);
    console.log('📄 Using document IDs:', documentIds);
    
    // Step 2: Test RAG debug endpoint
    console.log('\n2. Testing RAG debug endpoint...');
    const debugResponse = await fetch(`${BASE_URL}/api/RAG/debug`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'test query for vector search',
        documentIds: documentIds
      })
    });
    
    if (!debugResponse.ok) {
      console.error('❌ RAG debug failed:', debugResponse.status, debugResponse.statusText);
      const errorText = await debugResponse.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const debugData = await debugResponse.json();
    console.log('✅ RAG Debug Results:');
    console.log(JSON.stringify(debugData, null, 2));
    
    // Step 3: Test vector search endpoint directly
    console.log('\n3. Testing vector search endpoint...');
    const searchResponse = await fetch(`${BASE_URL}/api/RAG/search?q=test%20query&limit=3`);
    
    if (!searchResponse.ok) {
      console.error('❌ Vector search failed:', searchResponse.status, searchResponse.statusText);
      const errorText = await searchResponse.text();
      console.error('Error details:', errorText);
    } else {
      const searchData = await searchResponse.json();
      console.log('✅ Vector Search Results:');
      console.log(JSON.stringify(searchData, null, 2));
    }
    
    // Step 4: Test document chat with vector search
    console.log('\n4. Testing document chat...');
    const chatResponse = await fetch(`${BASE_URL}/api/RAG/document-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What is this document about?',
        documentIds: documentIds
      })
    });
    
    if (!chatResponse.ok) {
      console.error('❌ Document chat failed:', chatResponse.status, chatResponse.statusText);
      const errorText = await chatResponse.text();
      console.error('Error details:', errorText);
    } else {
      const chatData = await chatResponse.json();
      console.log('✅ Document Chat Results:');
      console.log('Response:', chatData.response);
      console.log('Sources:', chatData.sources);
      console.log('Method used:', chatData.method);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testVectorSearchPipeline().catch(console.error);