#!/bin/bash

# Test script for conversation title generation and persistence
# This script tests if conversation titles are being generated and saved to the Convex backend

# Set variables
CONVEX_URL=${CONVEX_URL:-"http://localhost:3211"}
LLM_URL=${LLM_URL:-"http://localhost:8082"}
CONVERSATION_ID="test_conversation_$(date +%s)"

echo "=== Testing Conversation Title Generation and Persistence ==="
echo "CONVEX_URL: $CONVEX_URL"
echo "LLM_URL: $LLM_URL"
echo "Test conversation ID: $CONVERSATION_ID"

# Step 1: Create a test conversation in Convex
echo -e "\n1. Creating test conversation in Convex..."
CREATE_RESPONSE=$(curl -s -X POST "$CONVEX_URL/api/general-chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"test_session_$(date +%s)\",
    \"message\": \"What is the capital of France?\",
    \"userId\": \"test_user\",
    \"userAgent\": \"test-script\",
    \"ipAddress\": \"127.0.0.1\",
    \"llmModel\": \"llama-3.2\"
  }")

# Extract conversation ID from response
ACTUAL_CONVERSATION_ID=$(echo $CREATE_RESPONSE | grep -o '"conversationId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACTUAL_CONVERSATION_ID" ]; then
  echo "Failed to create conversation. Response: $CREATE_RESPONSE"
  exit 1
fi

echo "Created conversation with ID: $ACTUAL_CONVERSATION_ID"

# Step 2: Send a request to the LLM service to generate a title
echo -e "\n2. Sending request to LLM service to generate title..."
LLM_RESPONSE=$(curl -s -X POST "$LLM_URL/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What is the capital of France?\",
    \"conversation_history\": [],
    \"is_new_conversation\": true,
    \"conversation_id\": \"$ACTUAL_CONVERSATION_ID\"
  }")

# Extract generated title from response
GENERATED_TITLE=$(echo $LLM_RESPONSE | grep -o '"generated_title":"[^"]*"' | cut -d'"' -f4)

if [ -z "$GENERATED_TITLE" ]; then
  echo "No title generated. Response: $LLM_RESPONSE"
  exit 1
fi

echo "Generated title: $GENERATED_TITLE"

# Step 3: Wait a moment for the title to be saved
echo -e "\n3. Waiting for title to be saved to Convex..."
sleep 2

# Step 4: Check if the title was saved to Convex
echo -e "\n4. Checking if title was saved to Convex..."
CONVERSATION_RESPONSE=$(curl -s -X GET "$CONVEX_URL/api/conversations/recent?type=general&limit=10")

# Extract the title for our conversation ID
SAVED_TITLE=$(echo $CONVERSATION_RESPONSE | grep -o "\"_id\":\"$ACTUAL_CONVERSATION_ID\"[^}]*\"title\":\"[^\"]*\"" | grep -o "\"title\":\"[^\"]*\"" | cut -d'"' -f4)

if [ -z "$SAVED_TITLE" ]; then
  echo "Title not found in Convex. Response excerpt:"
  echo $CONVERSATION_RESPONSE | grep -o "\"_id\":\"$ACTUAL_CONVERSATION_ID\"[^}]*"
  echo -e "\nFAILED: Title was not saved to Convex."
  exit 1
fi

echo "Saved title in Convex: $SAVED_TITLE"

# Step 5: Compare the generated title with the saved title
echo -e "\n5. Comparing generated title with saved title..."
if [ "$GENERATED_TITLE" == "$SAVED_TITLE" ]; then
  echo -e "\nSUCCESS: Title was correctly generated and saved to Convex!"
else
  echo -e "\nWARNING: Titles don't match exactly, but a title was saved."
  echo "Generated: $GENERATED_TITLE"
  echo "Saved: $SAVED_TITLE"
fi

echo -e "\nTest completed."
