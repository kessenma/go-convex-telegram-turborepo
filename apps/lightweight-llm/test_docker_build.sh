#!/bin/bash

# Test Docker Build Script
# ========================

set -e  # Exit on any error

echo "🐳 Testing Lightweight LLM Docker Build..."
echo "=" * 50

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t lightweight-llm-test:latest .

echo "✅ Docker image built successfully!"

# Test basic container startup (without full model loading)
echo "🧪 Testing container startup..."
docker run --rm -d \
  --name lightweight-llm-test-container \
  -p 8083:8082 \
  -e INSTALL_LANGEXTRACT=false \
  lightweight-llm-test:latest

echo "⏳ Waiting for container to start..."
sleep 10

# Check if container is running
if docker ps | grep -q lightweight-llm-test-container; then
    echo "✅ Container is running!"
    
    # Try to get logs
    echo "📋 Container logs:"
    docker logs lightweight-llm-test-container | tail -20
    
    # Clean up
    echo "🧹 Cleaning up test container..."
    docker stop lightweight-llm-test-container
    
    echo "🎉 Docker build test completed successfully!"
else
    echo "❌ Container failed to start"
    echo "📋 Container logs:"
    docker logs lightweight-llm-test-container || echo "No logs available"
    
    # Clean up
    docker rm -f lightweight-llm-test-container 2>/dev/null || true
    
    echo "💥 Docker build test failed!"
    exit 1
fi

echo ""
echo "🚀 To run the container manually:"
echo "docker run -p 8082:8082 lightweight-llm-test:latest"
echo ""
echo "🔧 To run with LangExtract:"
echo "docker run -p 8082:8082 -e INSTALL_LANGEXTRACT=true lightweight-llm-test:latest"