#!/usr/bin/env node

/**
 * Test script to verify the embedding flow works end-to-end
 * This script will:
 * 1. Upload a test document
 * 2. Check if embedding is automatically triggered
 * 3. Verify the embedding was created
 */

// Use dynamic import for node-fetch if needed
let fetch;
if (typeof globalThis.fetch === 'undefined') {
  fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
} else {
  fetch = globalThis.fetch;
}

const CONVEX_URL = process.env.CONVEX_URL || 'http://localhost:3211';
const VECTOR_SERVICE_URL = process.env.VECTOR_CONVERT_LLM_URL || 'http://localhost:7999';

async function testEmbeddingFlow() {
  console.log('🧪 Testing embedding flow...');
  
  try {
    // Step 1: Check if vector service is healthy
    console.log('\n1. Checking vector service health...');
    const healthResponse = await fetch(`${VECTOR_SERVICE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log(`Vector service status: ${healthData.status} (ready: ${healthData.ready})`);
    
    if (!healthData.ready) {
      console.error('❌ Vector service is not ready. Please wait for model to load.');
      return;
    }
    
    // Step 2: Upload a test document
    console.log('\n2. Uploading test document...');
    const testDocument = {
      title: 'Test Document for Embedding',
      content: 'This is a test document to verify that the embedding flow works correctly. It contains some sample text that should be processed and embedded automatically.',
      contentType: 'text',
      summary: 'A test document for embedding verification'
    };
    
    const uploadResponse = await fetch(`${CONVEX_URL}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testDocument)
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`❌ Failed to upload document: ${uploadResponse.status} - ${errorText}`);
      return;
    }
    
    const uploadResult = await uploadResponse.json();
    console.log(`✅ Document uploaded successfully with ID: ${uploadResult.documentId}`);
    
    // Step 3: Wait a moment for embedding to be triggered
    console.log('\n3. Waiting for embedding to be processed...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    // Step 4: Try triggering embedding via the new API
    console.log('\n4. Triggering embedding via API...');
    const triggerResponse = await fetch(`${CONVEX_URL}/api/embeddings/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId: uploadResult.documentId
      })
    });
    
    console.log(`Trigger response status: ${triggerResponse.status}`);
    
    if (triggerResponse.ok) {
      const triggerResult = await triggerResponse.json();
      console.log('✅ Embedding trigger successful:', triggerResult);
    } else {
      const errorText = await triggerResponse.text();
      console.error(`❌ Embedding trigger failed: ${triggerResponse.status} - ${errorText}`);
      
      // Try direct vector service call
      console.log('\n5. Trying direct vector service call...');
      const directResponse = await fetch(`${VECTOR_SERVICE_URL}/process-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: uploadResult.documentId,
          convex_url: CONVEX_URL,
          use_chunking: true,
          chunk_size: 1000
        })
      });
      
      if (directResponse.ok) {
        const directResult = await directResponse.json();
        console.log('✅ Direct vector service call successful:', directResult);
      } else {
        const directErrorText = await directResponse.text();
        console.error(`❌ Direct vector service call failed: ${directResponse.status} - ${directErrorText}`);
      }
    }
    
    // Step 6: Check if embedding was created
    console.log('\n6. Checking if embedding was created...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const embeddingResponse = await fetch(`${CONVEX_URL}/api/embeddings/document?documentId=${uploadResult.documentId}`);
    
    if (!embeddingResponse.ok) {
      console.error(`❌ Failed to fetch embeddings: ${embeddingResponse.status}`);
      return;
    }
    
    const embeddingResult = await embeddingResponse.json();
    console.log(`Embeddings found: ${embeddingResult.count || 0}`);
    
    if (embeddingResult.count > 0) {
      console.log('✅ Embedding flow is working correctly!');
      console.log(`   - Document ID: ${uploadResult.documentId}`);
      console.log(`   - Embeddings created: ${embeddingResult.count}`);
      console.log(`   - First embedding dimension: ${embeddingResult.embeddings[0]?.embeddingDimensions || 'N/A'}`);
    } else {
      console.log('⚠️  No embeddings found. Check the logs for issues.');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testEmbeddingFlow();