#!/bin/bash

# Test Lightweight LLM Integration
# This script tests the integration between the RAG system and the lightweight LLM

set -e

echo "🧪 Testing Lightweight LLM Integration..."

# Test 1: Health Check
echo "1️⃣ Testing health endpoint..."
if curl -f http://localhost:8082/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed - service may not be running"
    echo "💡 Try running: ./scripts/start-llm.sh"
    exit 1
fi

# Test 2: Model Info
echo "2️⃣ Testing model info endpoint..."
if curl -f http://localhost:8082/model-info > /dev/null 2>&1; then
    echo "✅ Model info endpoint working"
    echo "📊 Model details:"
    curl -s http://localhost:8082/model-info | python3 -m json.tool
else
    echo "❌ Model info endpoint failed"
    exit 1
fi

# Test 3: Chat Endpoint
echo "3️⃣ Testing chat endpoint..."
CHAT_RESPONSE=$(curl -s -X POST http://localhost:8082/chat \
    -H "Content-Type: application/json" \
    -d '{
        "message": "What is artificial intelligence?",
        "context": "Artificial intelligence (AI) is a branch of computer science that aims to create intelligent machines that can perform tasks that typically require human intelligence.",
        "conversation_history": [],
        "max_length": 100,
        "temperature": 0.7
    }')

if echo "$CHAT_RESPONSE" | grep -q "response"; then
    echo "✅ Chat endpoint working"
    echo "💬 Sample response:"
    echo "$CHAT_RESPONSE" | python3 -m json.tool
else
    echo "❌ Chat endpoint failed"
    echo "📋 Response: $CHAT_RESPONSE"
    exit 1
fi

# Test 4: RAG Integration
echo "4️⃣ Testing RAG integration..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Web dashboard is accessible"
else
    echo "⚠️  Web dashboard not accessible - this is optional for LLM testing"
fi

# Test 5: Vector Service Integration
echo "5️⃣ Testing vector service integration..."
if curl -f http://localhost:7999/health > /dev/null 2>&1; then
    echo "✅ Vector service is running"
else
    echo "⚠️  Vector service not accessible - needed for full RAG functionality"
fi

echo ""
echo "🎉 Lightweight LLM integration tests completed!"
echo "📝 Summary:"
echo "   - LLM Service: ✅ Running on port 8082"
echo "   - Health Check: ✅ Passed"
echo "   - Chat API: ✅ Working"
echo ""
echo "🚀 Ready for document chat!"
echo "💡 Access the web interface at: http://localhost:3000/RAG-chat"