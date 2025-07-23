#!/bin/bash

# Development script to quickly restart the web container without full rebuild
# This helps avoid the tedious rebuild process during development

echo "🔄 Stopping web-dashboard container..."
docker-compose stop web-dashboard

echo "🏗️  Rebuilding web-dashboard with updated code..."
docker-compose build web-dashboard

echo "🚀 Starting web-dashboard..."
docker-compose up -d web-dashboard

echo "✅ Web dashboard restarted! Available at http://localhost:3000"
echo "📊 Check container status with: docker ps"
echo "📋 View logs with: docker-compose logs -f web-dashboard"