#!/usr/bin/env node

const fetch = require('node-fetch');

async function testSimpleRAG() {
  console.log('🧪 Testing Simple RAG without Session Management...\n');

  const docId = 'j97dw637safb3qwqk99sq3e51h7m0g9m';
  const query = 'what is step 4?';

  // Step 1: Get document content directly
  console.log('1. Fetching document content...');
  try {
    const docResponse = await fetch(`http://localhost:3211/api/documents/${docId}`);
    if (docResponse.ok) {
      const doc = await docResponse.json();
      console.log('✅ Document fetched:', doc.title);
      console.log('   Content length:', doc.content.length);
      console.log('   Has embedding:', doc.hasEmbedding);
      
      // Show relevant part of content
      const content = doc.content;
      const step4Match = content.match(/4\.\s*([^5]*)/);
      if (step4Match) {
        console.log('   Step 4 found:', step4Match[1].trim().substring(0, 100) + '...');
      }
    } else {
      console.log('❌ Failed to fetch document');
      return;
    }
  } catch (error) {
    console.log('❌ Error fetching document:', error.message);
    return;
  }

  // Step 2: Test vector service directly
  console.log('\n2. Testing vector service...');
  try {
    const embedResponse = await fetch('http://localhost:7999/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query })
    });
    
    if (embedResponse.ok) {
      const embedResult = await embedResponse.json();
      console.log('✅ Query embedding generated:', embedResult.dimension, 'dimensions');
    } else {
      console.log('❌ Embedding generation failed');
    }
  } catch (error) {
    console.log('❌ Vector service error:', error.message);
  }

  // Step 3: Test lightweight LLM directly
  console.log('\n3. Testing lightweight LLM directly...');
  try {
    const llmResponse = await fetch('http://localhost:8082/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        context: `Document: MedFlow MVP deployment steps

Content: MedFlow MVP deployment steps: 1. Setup linux server 2. Install coolify + docker on the server 3. Open up the firewall to access the coolify app on port 8000 4. Setup an email as a service provider to connect to coolify (i setup a free account on Brevo with my kyle.essenmacher@fajr.org email, but need a no-reply@fajr.org / other service acct email address from hammad to use as a service account) 5. Connect the fajr-medflow-emr github repo + "main" branch inside coolify

Answer the user's question based on this information.`,
        conversation_history: [],
        max_length: 100,
        temperature: 0.7
      })
    });
    
    if (llmResponse.ok) {
      const llmResult = await llmResponse.json();
      console.log('✅ LLM response received');
      console.log('   Response:', llmResult.response);
      console.log('   Processing time:', llmResult.model_info?.generation_time_s + 's');
    } else {
      const errorText = await llmResponse.text();
      console.log('❌ LLM failed:', llmResponse.status);
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log('❌ LLM error:', error.message);
  }
}

testSimpleRAG().catch(console.error);