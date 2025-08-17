#!/usr/bin/env node

/**
 * Test script to verify unified chat persistence functionality
 * This script tests both general and RAG chat message saving
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
const CONVEX_URL = process.env.CONVEX_HTTP_URL || 'http://localhost:3211';

// Test data
const testDocumentId = 'jx7cdv7yma1846r08gzgy59s657ng3q3'; // Kyle_Contract_FAJR from your example
const testMessage = 'What are the key terms in this contract?';

async function testGeneralChatPersistence() {
  console.log('\n🧪 Testing General Chat Persistence...');
  
  try {
    // Send a general chat message
    const response = await fetch(`${BASE_URL}/api/general-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            id: 'test-user-msg-' + Date.now(),
            role: 'user',
            content: 'Hello, this is a test message for general chat.',
          }
        ],
        conversation_id: null,
        is_new_conversation: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`General chat API failed: ${response.status}`);
    }

    const result = await response.text();
    console.log('✅ General chat response received');
    console.log('Response preview:', result.substring(0, 200) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ General chat test failed:', error.message);
    return false;
  }
}

async function testRAGChatPersistence() {
  console.log('\n🧪 Testing RAG Chat Persistence...');
  
  try {
    // Send a RAG chat message
    const response = await fetch(`${BASE_URL}/api/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            id: 'test-user-msg-' + Date.now(),
            role: 'user',
            content: testMessage,
          }
        ],
        documentIds: [testDocumentId],
        conversation_id: null,
        is_new_conversation: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`RAG chat API failed: ${response.status}`);
    }

    const result = await response.text();
    console.log('✅ RAG chat response received');
    console.log('Response preview:', result.substring(0, 200) + '...');
    
    // Try to parse as JSON to check for sources
    try {
      const jsonResult = JSON.parse(result);
      if (jsonResult.sources && jsonResult.sources.length > 0) {
        console.log(`✅ Found ${jsonResult.sources.length} sources in response`);
      } else {
        console.log('⚠️  No sources found in response');
      }
    } catch (e) {
      console.log('ℹ️  Response is not JSON format');
    }
    
    return true;
  } catch (error) {
    console.error('❌ RAG chat test failed:', error.message);
    return false;
  }
}

async function testConversationRetrieval() {
  console.log('\n🧪 Testing Conversation Retrieval...');
  
  try {
    // Get recent conversations
    const response = await fetch(`${CONVEX_URL}/api/conversations/recent?limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Conversation retrieval failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Recent conversations retrieved');
    console.log(`Found ${result.conversations?.length || 0} conversations`);
    
    if (result.conversations && result.conversations.length > 0) {
      const latestConversation = result.conversations[0];
      console.log('Latest conversation:', {
        id: latestConversation._id,
        type: latestConversation.type,
        title: latestConversation.title,
        messageCount: latestConversation.messageCount,
        documentCount: latestConversation.documentIds?.length || 0
      });
      
      // Test message retrieval for this conversation
      return await testMessageRetrieval(latestConversation._id);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Conversation retrieval test failed:', error.message);
    return false;
  }
}

async function testMessageRetrieval(conversationId) {
  console.log(`\n🧪 Testing Message Retrieval for conversation ${conversationId}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/unified-chat/messages?conversationId=${conversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Message retrieval failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Messages retrieved');
    console.log(`Found ${result.messages?.length || 0} messages`);
    
    if (result.messages && result.messages.length > 0) {
      result.messages.forEach((msg, index) => {
        console.log(`  Message ${index + 1}: ${msg.role} - "${msg.content.substring(0, 50)}..."`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Message retrieval test failed:', error.message);
    return false;
  }
}

async function testDocumentRetrieval() {
  console.log('\n🧪 Testing Document Retrieval...');
  
  try {
    const response = await fetch(`${CONVEX_URL}/api/documents/by-id?documentId=${testDocumentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Document retrieval failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Document retrieved');
    console.log('Document info:', {
      id: result._id,
      title: result.title,
      contentLength: result.content?.length || 0,
      hasEmbedding: result.hasEmbedding
    });
    
    return true;
  } catch (error) {
    console.error('❌ Document retrieval test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Unified Chat Persistence Tests');
  console.log('Base URL:', BASE_URL);
  console.log('Convex URL:', CONVEX_URL);
  
  const results = [];
  
  // Test document retrieval first
  results.push(await testDocumentRetrieval());
  
  // Test general chat
  results.push(await testGeneralChatPersistence());
  
  // Test RAG chat
  results.push(await testRAGChatPersistence());
  
  // Wait a bit for messages to be saved
  console.log('\n⏳ Waiting 3 seconds for messages to be saved...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test conversation and message retrieval
  results.push(await testConversationRetrieval());
  
  // Summary
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed. Check the logs above.');
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});