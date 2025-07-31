#!/usr/bin/env node

const fetch = require('node-fetch');

async function testVectorSearch() {
  console.log('🔍 Testing Vector Search API...');
  
  try {
    // Test 1: GET request
    console.log('\n1. Testing GET request...');
    const getResponse = await fetch('http://localhost:3000/api/RAG/search?q=test&limit=5');
    const getData = await getResponse.text();
    console.log('GET Response Status:', getResponse.status);
    console.log('GET Response:', getData.substring(0, 500));
    
    // Test 2: POST request
    console.log('\n2. Testing POST request...');
    const postResponse = await fetch('http://localhost:3000/api/RAG/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'test document',
        limit: 5
      })
    });
    
    const postData = await postResponse.text();
    console.log('POST Response Status:', postResponse.status);
    console.log('POST Response:', postData.substring(0, 500));
    
    // Test 3: Check Convex backend directly
    console.log('\n3. Testing Convex backend connection...');
    const convexResponse = await fetch('http://localhost:3211/api/embeddings/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queryText: 'test',
        limit: 5
      })
    });
    
    const convexData = await convexResponse.text();
    console.log('Convex Response Status:', convexResponse.status);
    console.log('Convex Response:', convexData.substring(0, 500));
    
  } catch (error) {
    console.error('❌ Error testing vector search:', error.message);
  }
}

testVectorSearch();