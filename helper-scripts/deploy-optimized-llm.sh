#!/bin/bash

# Deploy Optimized Vector Convert LLM Service
# This script helps deploy the memory-optimized version of the vector-convert-llm service

set -e

echo "🚀 Deploying Optimized Vector Convert LLM Service..."

# Stop existing services
echo "📦 Stopping existing vector-convert-llm service..."
docker-compose stop vector-convert-llm || true
docker-compose rm -f vector-convert-llm || true

# Remove old images to free up space
echo "🧹 Cleaning up old images..."
docker image prune -f
docker system prune -f

# Build and start the optimized service
echo "🔨 Building optimized vector-convert-llm service..."
docker-compose build vector-convert-llm

echo "🚀 Starting optimized vector-convert-llm service..."
docker-compose up -d vector-convert-llm

# Wait for service to be healthy
echo "⏳ Waiting for service to become healthy..."
timeout=300  # 5 minutes
elapsed=0
interval=10

while [ $elapsed -lt $timeout ]; do
    if docker-compose ps vector-convert-llm | grep -q "healthy"; then
        echo "✅ Service is healthy!"
        break
    elif docker-compose ps vector-convert-llm | grep -q "unhealthy"; then
        echo "❌ Service is unhealthy. Checking logs..."
        docker-compose logs --tail=50 vector-convert-llm
        exit 1
    else
        echo "⏳ Still starting... (${elapsed}s elapsed)"
        sleep $interval
        elapsed=$((elapsed + interval))
    fi
done

if [ $elapsed -ge $timeout ]; then
    echo "❌ Service failed to become healthy within ${timeout} seconds"
    echo "📋 Recent logs:"
    docker-compose logs --tail=50 vector-convert-llm
    exit 1
fi

# Test the service
echo "🧪 Testing service endpoints..."

# Test health endpoint
echo "Testing /health endpoint..."
if curl -f http://localhost:8081/health > /dev/null 2>&1; then
    echo "✅ Health endpoint working"
else
    echo "❌ Health endpoint failed"
    exit 1
fi

# Test embed endpoint
echo "Testing /embed endpoint..."
if curl -f -X POST http://localhost:8081/embed \
    -H "Content-Type: application/json" \
    -d '{"text": "test sentence"}' > /dev/null 2>&1; then
    echo "✅ Embed endpoint working"
else
    echo "❌ Embed endpoint failed"
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
docker-compose ps vector-convert-llm

echo ""
echo "💾 Memory Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep vector-convert-llm || echo "Container not found in stats"

echo ""
echo "📋 Recent Logs:"
docker-compose logs --tail=20 vector-convert-llm

echo ""
echo "🔗 Service URLs:"
echo "  Health Check: http://localhost:8081/health"
echo "  Embed API: http://localhost:8081/embed"
echo "  Process Document: http://localhost:8081/process-document"
