#!/bin/bash

# Reset Web Container Only - Complete Clean Rebuild
# This script completely resets the web container while keeping the bot and convex services running

echo "🔄 Resetting web container with complete clean rebuild..."

# Stop and remove only the web container
echo "📦 Stopping web container..."
docker compose stop web-dashboard

echo "🗑️ Removing web container..."
docker compose rm -f web-dashboard

# Remove ALL web-related images to force complete rebuild
echo "🖼️ Removing all web-related images..."
docker rmi go-convex-telegram-turborepo-web-dashboard 2>/dev/null || echo "Web dashboard image not found, skipping..."
docker rmi $(docker images --filter=reference="*web*" -q) 2>/dev/null || echo "No additional web images found"

# Clean up any dangling images and build cache
echo "🧹 Cleaning up Docker build cache..."
docker builder prune -f
docker image prune -f

# Remove node_modules and package-lock to ensure fresh dependencies
echo "📦 Cleaning web app dependencies..."
rm -rf apps/web/node_modules
rm -rf apps/web/.next
rm -rf apps/web/package-lock.json
rm -rf apps/web/pnpm-lock.yaml

# Clean up any cached layers
echo "🗑️ Removing Docker build cache for web app..."
docker buildx prune -f

# Remove any existing build cache specifically for this project
echo "🧹 Removing project-specific build cache..."
docker builder prune --filter type=exec.cachemount -f
docker builder prune --filter type=regular -f

# Remove all build cache and system prune
echo "🧽 Complete Docker system cleanup..."
docker system prune -af --volumes

# Rebuild and start web container with no cache
echo "🔨 Rebuilding web container from scratch (no cache)..."
DOCKER_BUILDKIT=1 docker compose build --no-cache --pull web-dashboard

echo "🚀 Starting web container..."
docker compose up web-dashboard -d

# Wait a moment for container to start
echo "⏳ Waiting for container to start..."
sleep 5

echo "✅ Web container complete reset finished!"
echo "🔍 Checking container status..."
docker compose ps

echo ""
echo "📝 Note: Bot and Convex services remain running"
echo "🌐 Web app should be available at http://localhost:3000"
echo "🔧 This was a complete clean rebuild - all caches cleared"

# Test the connection
echo "🧪 Testing web app connection..."
sleep 3
if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ Web app is responding!"
else
    echo "⚠️  Web app may still be starting up. Check logs with: docker compose logs web-dashboard"
fi
