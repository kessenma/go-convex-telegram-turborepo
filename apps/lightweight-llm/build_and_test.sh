#!/bin/bash

# Build and Test Script for Lightweight LLM
# ==========================================

set -e  # Exit on any error

echo "Building Lightweight LLM Docker image..."

# Build the Docker image
docker build -t lightweight-llm:latest .

echo "Docker image built successfully!"

echo "Testing the container..."

# Run a quick test container
docker run --rm -d \
  --name lightweight-llm-test \
  -p 8083:8082 \
  -e INSTALL_LANGEXTRACT=false \
  lightweight-llm:latest

echo "Container started. Waiting for it to be ready..."

# Wait for the service to be ready
for i in {1..30}; do
  if curl -f http://localhost:8083/health > /dev/null 2>&1; then
    echo "Service is ready!"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 2
done

# Test the health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:8083/health | jq .

# Test the model-info endpoint
echo "Testing model-info endpoint..."
curl -s http://localhost:8083/model-info | jq .

# Test query classification
echo "Testing query classification..."
curl -s -X POST http://localhost:8083/classify-query \
  -H "Content-Type: application/json" \
  -d '{"query": "How much did we spend on marketing?"}' | jq .

# Clean up
echo "Cleaning up test container..."
docker stop lightweight-llm-test

echo "All tests completed successfully!"
echo ""
echo "To run with LangExtract enabled:"
echo "docker run -p 8082:8082 -e INSTALL_LANGEXTRACT=true lightweight-llm:latest"