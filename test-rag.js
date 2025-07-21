#!/usr/bin/env node

const fetch = require('node-fetch');

async function testRAG() {
  console.log('Testing RAG Chat System...\n');

  try {
    // Test 1: Check if lightweight LLM is healthy
    console.log('1. Checking Lightweight LLM health...');
    const llmHealth = await fetch('http://localhost:8082/health');
    const llmHealthData = await llmHealth.json();
    console.log('   Status:', llmHealthData.status);
    console.log('   Model loaded:', llmHealthData.model_loaded);
    console.log('   Memory usage:', llmHealthData.memory_usage?.rss_mb + 'MB\n');

    // Test 2: Check if vector service is healthy
    console.log('2. Checking Vector Convert LLM health...');
    const vectorHealth = await fetch('http://localhost:8081/health');
    const vectorHealthData = await vectorHealth.json();
    console.log('   Status:', vectorHealthData.status);
    console.log('   Model loaded:', vectorHealthData.model_loaded);
    console.log('   Memory usage:', vectorHealthData.memory_usage?.process_memory_mb + 'MB\n');

    // Test 3: Check Convex backend
    console.log('3. Checking Convex backend...');
    const convexHealth = await fetch('http://localhost:3211/api/health');
    const convexHealthData = await convexHealth.json();
    console.log('   Status:', convexHealthData.status);
    console.log('   Service:', convexHealthData.service + '\n');

    // Test 4: Get documents
    console.log('4. Fetching documents...');
    const docsResponse = await fetch('http://localhost:3211/api/documents');
    const docsData = await docsResponse.json();
    console.log('   Documents found:', docsData.documents?.length || 0);
    
    if (docsData.documents && docsData.documents.length > 0) {
      const firstDoc = docsData.documents[0];
      console.log('   First document:', firstDoc.title);
      console.log('   Has embedding:', firstDoc.hasEmbedding);
      console.log('   Document ID:', firstDoc._id + '\n');

      // Test 5: Test RAG chat with the first document
      console.log('5. Testing RAG chat...');
      const chatResponse = await fetch('http://localhost:3000/api/RAG/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'What is this document about?',
          documentIds: [firstDoc._id],
          conversationHistory: [],
          sessionId: 'test-session-' + Date.now()
        })
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        console.log('   Chat response:', chatData.response.substring(0, 200) + '...');
        console.log('   Sources found:', chatData.sources?.length || 0);
        console.log('   Processing time:', chatData.processingTimeMs + 'ms');
        console.log('   Model used:', chatData.model?.model_name || 'unknown');
      } else {
        const errorText = await chatResponse.text();
        console.log('   Chat failed:', chatResponse.status, errorText);
      }
    } else {
      console.log('   No documents found to test with');
    }

    console.log('\nRAG system test completed!');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRAG();