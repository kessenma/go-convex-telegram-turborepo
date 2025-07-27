#!/bin/bash

# deploy-convex-api.sh
# Automated Convex admin key generation and API deployment script
# This script generates an admin key, then generates TypeScript API definitions
# from a running Convex backend and deploys them to both web and mobile applications

set -e

echo "🚀 Starting Convex API generation and deployment..."

# Configuration
WEB_APP_DIR="apps/web"
MOBILE_APP_DIR="apps/mobile"
DOCKER_CONVEX_DIR="apps/docker-convex"
GENERATED_API_FILE="generated-convex.ts"
TEMP_API_FILE="temp-convex-api"

# Parse command line arguments
DEPLOY_WEB=true
DEPLOY_MOBILE=true

while [[ $# -gt 0 ]]; do
  case $1 in
    --web-only)
      DEPLOY_MOBILE=false
      shift
      ;;
    --mobile-only)
      DEPLOY_WEB=false
      shift
      ;;
    --help)
      echo "Usage: $0 [--web-only] [--mobile-only] [--help]"
      echo "  --web-only    Deploy API only to web app"
      echo "  --mobile-only Deploy API only to mobile app"
      echo "  --help        Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "$DOCKER_CONVEX_DIR" ]; then
    echo "❌ Error: This script must be run from the project root directory"
    echo "   Expected to find: package.json, $DOCKER_CONVEX_DIR/"
    exit 1
fi

# Check if target directories exist
if [ "$DEPLOY_WEB" = true ] && [ ! -d "$WEB_APP_DIR" ]; then
    echo "❌ Error: Web app directory not found: $WEB_APP_DIR"
    exit 1
fi

if [ "$DEPLOY_MOBILE" = true ] && [ ! -d "$MOBILE_APP_DIR" ]; then
    echo "❌ Error: Mobile app directory not found: $MOBILE_APP_DIR"
    exit 1
fi

# Generate admin key first
echo "🔑 Generating Convex admin key..."
if ! docker compose exec convex-backend ./generate_admin_key.sh > /dev/null 2>&1; then
    echo "❌ Error: Failed to generate admin key"
    echo "   Make sure the convex-backend container is running"
    echo "   You can start it with: docker compose up convex-backend -d"
    exit 1
fi
echo "✅ Admin key generated successfully"

# Check if convex-helpers is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not available. Please install Node.js and npm."
    exit 1
fi

# Navigate to docker-convex directory
echo "📁 Navigating to docker-convex directory..."
cd "$DOCKER_CONVEX_DIR"

# Check if convex-helpers is installed locally or globally
if ! npm list convex-helpers &> /dev/null && ! npm list -g convex-helpers &> /dev/null; then
    echo "📦 Installing convex-helpers..."
    npm install convex-helpers
fi

# Generate the API specification
echo "🔧 Generating Convex API specification..."
if ! npx convex-helpers ts-api-spec --output-file "$TEMP_API_FILE"; then
    echo "❌ Error: Failed to generate Convex API specification"
    echo "   Make sure your Convex backend is running and accessible"
    exit 1
fi

# Check if the generated file exists (convex-helpers adds .ts extension)
if [ ! -f "$TEMP_API_FILE.ts" ]; then
    echo "❌ Error: Generated API file not found at $TEMP_API_FILE.ts"
    exit 1
fi

echo "✅ API specification generated successfully"

# Navigate back to project root
cd ../..

# Deploy to web app if requested
if [ "$DEPLOY_WEB" = true ]; then
    echo "📋 Copying generated API to web application..."
    cp "$DOCKER_CONVEX_DIR/$TEMP_API_FILE.ts" "$WEB_APP_DIR/$GENERATED_API_FILE"
    
    # Verify the file was copied successfully
    if [ ! -f "$WEB_APP_DIR/$GENERATED_API_FILE" ]; then
        echo "❌ Error: Failed to copy API file to web application"
        exit 1
    fi
    
    echo "✅ API file successfully deployed to $WEB_APP_DIR/$GENERATED_API_FILE"
fi

# Deploy to mobile app if requested
if [ "$DEPLOY_MOBILE" = true ]; then
    echo "📋 Copying generated API to mobile application..."
    cp "$DOCKER_CONVEX_DIR/$TEMP_API_FILE.ts" "$MOBILE_APP_DIR/$GENERATED_API_FILE"
    
    # Verify the file was copied successfully
    if [ ! -f "$MOBILE_APP_DIR/$GENERATED_API_FILE" ]; then
        echo "❌ Error: Failed to copy API file to mobile application"
        exit 1
    fi
    
    echo "✅ API file successfully deployed to $MOBILE_APP_DIR/$GENERATED_API_FILE"
fi

# Clean up temporary file
rm "$DOCKER_CONVEX_DIR/$TEMP_API_FILE.ts"

# Display file information
echo ""
echo "📊 Generated API file statistics:"

if [ "$DEPLOY_WEB" = true ]; then
    API_FILE_SIZE=$(wc -c < "$WEB_APP_DIR/$GENERATED_API_FILE")
    API_LINE_COUNT=$(wc -l < "$WEB_APP_DIR/$GENERATED_API_FILE")
    echo "   📄 Web: $WEB_APP_DIR/$GENERATED_API_FILE"
    echo "   📏 Size: $API_FILE_SIZE bytes"
    echo "   📝 Lines: $API_LINE_COUNT"
fi

if [ "$DEPLOY_MOBILE" = true ]; then
    API_FILE_SIZE=$(wc -c < "$MOBILE_APP_DIR/$GENERATED_API_FILE")
    API_LINE_COUNT=$(wc -l < "$MOBILE_APP_DIR/$GENERATED_API_FILE")
    echo "   📄 Mobile: $MOBILE_APP_DIR/$GENERATED_API_FILE"
    echo "   📏 Size: $API_FILE_SIZE bytes"
    echo "   📝 Lines: $API_LINE_COUNT"
fi

echo ""
echo "🎉 Convex admin key generation and API deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Admin key has been generated and saved to the convex-backend container"
if [ "$DEPLOY_WEB" = true ]; then
    echo "   2. Web: Update imports to use: import { api } from './$GENERATED_API_FILE'"
fi
if [ "$DEPLOY_MOBILE" = true ]; then
    echo "   3. Mobile: Update imports to use: import { api } from './$GENERATED_API_FILE'"
fi
echo "   4. Test your applications to ensure all API calls work correctly"
echo ""
echo "💡 Tip: You can now delete old API files once you've updated all imports"