#!/bin/bash

# Reset Web Container Only
# This script resets only the web container while keeping the bot and convex services running

echo "🔄 Resetting web container only..."

# Stop and remove only the web container
echo "📦 Stopping web container..."
docker compose stop web

echo "🗑️ Removing web container..."
docker compose rm -f web

# Remove web image to force rebuild
echo "🖼️ Removing web image..."
docker rmi go-convex-telegram-turborepo-web 2>/dev/null || echo "Web image not found, skipping..."

# Rebuild and start web container
echo "🔨 Rebuilding and starting web container..."
docker compose up web -d --build

echo "✅ Web container reset complete!"
echo "🔍 Checking container status..."
docker compose ps

echo ""
echo "📝 Note: Bot and Convex services remain running"
echo "🌐 Web app should be available at http://localhost:3000"