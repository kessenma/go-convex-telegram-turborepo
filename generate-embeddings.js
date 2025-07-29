#!/usr/bin/env node

// Script to generate embeddings for existing documents
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function generateEmbeddingsForDocuments() {
  console.log('🔄 Generating embeddings for existing documents...\n');

  try {
    // Step 1: Get all documents
    console.log('1. Fetching documents...');
    const docsResponse = await fetch(`${BASE_URL}/api/documents`);
    
    if (!docsResponse.ok) {
      console.error('❌ Failed to fetch documents:', docsResponse.status);
      return;
    }
    
    const docsData = await docsResponse.json();
    const documents = docsData.page || [];
    
    console.log(`✅ Found ${documents.length} documents`);
    
    if (documents.length === 0) {
      console.log('⚠️ No documents found to process.');
      return;
    }
    
    // Step 2: Process each document that doesn't have embeddings
    const documentsToProcess = documents.filter(doc => !doc.hasEmbedding);
    console.log(`📝 ${documentsToProcess.length} documents need embeddings`);
    
    if (documentsToProcess.length === 0) {
      console.log('✅ All documents already have embeddings!');
      return;
    }
    
    // Step 3: Generate embeddings for each document
    for (const doc of documentsToProcess) {
      console.log(`\n🔄 Processing: ${doc.title} (${doc._id})`);
      
      try {
        // Call the embedding generation endpoint
        const embeddingResponse = await fetch(`${BASE_URL}/api/documents/${doc._id}/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            useChunking: true,
            maxChunkSize: 1000
          })
        });
        
        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text();
          console.error(`❌ Failed to generate embeddings for ${doc.title}:`, embeddingResponse.status, errorText);
          continue;
        }
        
        const result = await embeddingResponse.json();
        console.log(`✅ Generated embeddings for ${doc.title}:`, result);
        
        // Wait a bit between requests to avoid overwhelming the service
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing ${doc.title}:`, error.message);
      }
    }
    
    console.log('\n🎉 Embedding generation complete!');
    
    // Step 4: Test vector search after generating embeddings
    console.log('\n🔍 Testing vector search with new embeddings...');
    
    const testSearchResponse = await fetch(`${BASE_URL}/api/RAG/search?q=mental%20health&limit=3`);
    
    if (testSearchResponse.ok) {
      const searchResult = await testSearchResponse.json();
      console.log('✅ Vector search test results:');
      console.log(JSON.stringify(searchResult, null, 2));
    } else {
      console.error('❌ Vector search test failed:', testSearchResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

// Run the script
generateEmbeddingsForDocuments().catch(console.error);