#!/bin/bash
set -e

echo "🔄 Starting complete Convex database reset..."

# Get the project root directory (go up one level from helper-scripts)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "📁 Project root: $PROJECT_ROOT"

# Stop all running containers
echo "🛑 Stopping all containers..."
docker compose down

# Remove the convex_data volume completely
echo "🗑️  Removing convex_data volume..."
docker volume rm telegram-bot_convex_data 2>/dev/null || true

# Also remove any dangling volumes
echo "🧹 Cleaning up dangling volumes..."
docker volume prune -f

# Optional: Remove images to force fresh pulls
echo "🔄 Removing Convex images for fresh download..."
docker rmi ghcr.io/get-convex/convex-backend:c1a7ac393888d743e704de56cf569a154b4526d4 2>/dev/null || true
docker rmi ghcr.io/get-convex/convex-dashboard:c1a7ac393888d743e704de56cf569a154b4526d4 2>/dev/null || true

echo "✅ Database reset complete!"
echo "🚀 Starting fresh deployment..."

# Start the services back up
echo "⬆️  Starting services..."
docker compose up -d convex-backend convex-dashboard

# Wait for backend to be healthy
echo "⏳ Waiting for Convex backend to be healthy..."
sleep 10

# Check if backend is ready
until curl -f http://localhost:3210/version > /dev/null 2>&1; do
  echo "Waiting for backend to be ready..."
  sleep 5
done

echo "✅ Backend is ready!"

# Deploy Convex functions
echo "🚀 Deploying Convex functions..."
cd "$PROJECT_ROOT/apps/docker-convex"
CONVEX_URL=http://localhost:3210 npx convex dev --once

echo "🎉 Database reset and deployment complete!"
echo "📋 You can now access:"
echo "   - Convex Backend: http://localhost:3210"
echo "   - Convex Dashboard: http://localhost:6791"