#!/bin/bash

echo "🚀 Starting Vector Convert LLM Service"
echo "======================================"

# Wait for convex-backend to be ready
echo "⏳ Waiting for convex-backend to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "   Attempt $attempt/$max_attempts: Testing connection to convex-backend:3211..."
    
    if nc -z convex-backend 3211; then
        echo "   ✅ convex-backend is ready!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "   ❌ convex-backend is not ready after $max_attempts attempts"
        echo "   🔍 Running connectivity debug..."
        ./debug_connectivity.sh
        echo "   ⚠️  Starting service anyway..."
        break
    fi
    
    echo "   ⏳ Waiting 2 seconds before retry..."
    sleep 2
    attempt=$((attempt + 1))
done

echo ""
echo "🐍 Starting Python application..."
exec python main.py