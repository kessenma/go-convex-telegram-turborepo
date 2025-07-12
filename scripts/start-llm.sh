#!/bin/bash

# Start Lightweight LLM Service
# This script builds and starts the lightweight LLM service for document chat

set -e

echo "🚀 Starting Lightweight LLM Service..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start the lightweight LLM service
echo "📦 Building lightweight LLM service..."
docker-compose build lightweight-llm

echo "🔄 Starting lightweight LLM service..."
docker-compose up -d lightweight-llm

echo "⏳ Waiting for service to be ready..."
sleep 10

# Check if service is healthy
echo "🔍 Checking service health..."
for i in {1..30}; do
    if curl -f http://localhost:8082/health > /dev/null 2>&1; then
        echo "✅ Lightweight LLM service is ready!"
        echo "📊 Service info:"
        curl -s http://localhost:8082/health | python3 -m json.tool
        echo ""
        echo "🌐 Service available at: http://localhost:8082"
        echo "📚 API docs: http://localhost:8082/docs"
        exit 0
    fi
    echo "⏳ Waiting for service to start... ($i/30)"
    sleep 10
done

echo "❌ Service failed to start within 5 minutes"
echo "📋 Checking logs:"
docker-compose logs lightweight-llm
exit 1