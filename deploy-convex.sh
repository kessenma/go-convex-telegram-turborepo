#!/bin/bash

# Deploy Convex functions and sync generated files
# This script ensures that all apps have the latest Convex generated files

set -e

echo "🚀 Deploying Convex functions..."

# Deploy functions from docker-convex
cd apps/docker-convex
pnpm run deploy-functions

echo "📁 Syncing generated files to web app..."

# Ensure web app convex directory exists
mkdir -p ../web/convex/_generated

# Copy generated files to web app
cp convex/_generated/* ../web/convex/_generated/ || true

echo "📁 Syncing generated files to mobile app..."

# Ensure mobile app convex directory exists  
mkdir -p ../mobile/convex/_generated

# Copy generated files to mobile app
cp convex/_generated/* ../mobile/convex/_generated/ || true

cd ../..

echo "✅ Convex deployment complete!"
echo "📦 Generated files synced to:"
echo "   - apps/web/convex/_generated/"
echo "   - apps/mobile/convex/_generated/"
echo ""
echo "🔄 Restart your web and mobile apps to pick up the changes."
