#!/usr/bin/env node

const fetch = require('node-fetch');

async function testWebRAG() {
  console.log('🌐 Testing Web RAG Interface...\n');

  const docId = 'j97dw637safb3qwqk99sq3e51h7m0g9m';
  const queries = [
    'what is step 4?',
    'what is step 5?', 
    'what is step 7?',
    'how many steps are there?'
  ];

  for (const query of queries) {
    console.log(`\n📝 Query: "${query}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/RAG/simple-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          documentIds: [docId]
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Response:', result.response?.substring(0, 150) + '...');
        console.log('   Sources:', result.sources?.length || 0);
        if (result.sources && result.sources.length > 0) {
          console.log('   Top source score:', (result.sources[0].score * 100).toFixed(1) + '%');
          console.log('   Snippet:', result.sources[0].snippet?.substring(0, 100) + '...');
        }
      } else {
        const errorText = await response.text();
        console.log('❌ Failed:', response.status);
        console.log('   Error:', errorText.substring(0, 200));
      }
      
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

testWebRAG().catch(console.error);