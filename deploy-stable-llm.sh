#!/bin/bash

echo "🚀 Deploying Stable Vector Convert LLM Service..."

# Stop existing services
echo "⏹️  Stopping existing services..."
docker-compose down vector-convert-llm

# Remove old images to force rebuild
echo "🗑️  Removing old vector-convert-llm image..."
docker rmi telegram-bot-vector-convert-llm 2>/dev/null || true

# Build and start the vector service
echo "🔨 Building and starting vector-convert-llm service..."
docker-compose up --build -d vector-convert-llm

# Wait for service to be healthy
echo "⏳ Waiting for vector-convert-llm to be healthy..."
timeout=120
counter=0
while [ $counter -lt $timeout ]; do
    if docker-compose ps vector-convert-llm | grep -q "healthy"; then
        echo "✅ Vector Convert LLM service is healthy!"
        break
    fi
    echo "⏳ Waiting... ($counter/$timeout seconds)"
    sleep 5
    counter=$((counter + 5))
done

if [ $counter -ge $timeout ]; then
    echo "❌ Service failed to become healthy within $timeout seconds"
    echo "📋 Checking logs..."
    docker-compose logs --tail=20 vector-convert-llm
    exit 1
fi

# Test the service
echo "🧪 Testing vector-convert-llm service..."
curl -f http://localhost:8081/health || {
    echo "❌ Health check failed"
    echo "📋 Service logs:"
    docker-compose logs --tail=20 vector-convert-llm
    exit 1
}

echo "✅ Vector Convert LLM service deployed successfully!"
echo "🌐 Service available at: http://localhost:8081"
echo "📊 Health check: http://localhost:8081/health"

# Restart dependent services
echo "🔄 Restarting dependent services..."
docker-compose restart telegram-bot
docker-compose restart web-dashboard

echo "🎉 Deployment complete!"
echo ""
echo "📋 Service Status:"
docker-compose ps
