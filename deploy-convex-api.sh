#!/bin/bash

# deploy-convex-api.sh
# Automated Convex API generation and deployment script
# This script generates TypeScript API definitions from a running Convex backend
# and deploys them to the web application

set -e

echo "🚀 Starting Convex API generation and deployment..."

# Configuration
WEB_APP_DIR="apps/web"
DOCKER_CONVEX_DIR="apps/docker-convex"
GENERATED_API_FILE="generated-convex.ts"
TEMP_API_FILE="temp-convex-api"

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "$WEB_APP_DIR" ] || [ ! -d "$DOCKER_CONVEX_DIR" ]; then
    echo "❌ Error: This script must be run from the project root directory"
    echo "   Expected to find: package.json, $WEB_APP_DIR/, $DOCKER_CONVEX_DIR/"
    exit 1
fi

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

# Copy the generated file to the web app
echo "📋 Copying generated API to web application..."
cp "$DOCKER_CONVEX_DIR/$TEMP_API_FILE.ts" "$WEB_APP_DIR/$GENERATED_API_FILE"

# Clean up temporary file
rm "$DOCKER_CONVEX_DIR/$TEMP_API_FILE.ts"

# Verify the file was copied successfully
if [ ! -f "$WEB_APP_DIR/$GENERATED_API_FILE" ]; then
    echo "❌ Error: Failed to copy API file to web application"
    exit 1
fi

echo "✅ API file successfully deployed to $WEB_APP_DIR/$GENERATED_API_FILE"

# Display file information
API_FILE_SIZE=$(wc -c < "$WEB_APP_DIR/$GENERATED_API_FILE")
API_LINE_COUNT=$(wc -l < "$WEB_APP_DIR/$GENERATED_API_FILE")

echo ""
echo "📊 Generated API file statistics:"
echo "   📄 File: $WEB_APP_DIR/$GENERATED_API_FILE"
echo "   📏 Size: $API_FILE_SIZE bytes"
echo "   📝 Lines: $API_LINE_COUNT"
echo ""
echo "🎉 Convex API deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Update your imports to use: import { api } from '../$GENERATED_API_FILE'"
echo "   2. Replace references to 'convexApi1752607591403' with '$GENERATED_API_FILE'"
echo "   3. Test your application to ensure all API calls work correctly"
echo ""
echo "💡 Tip: You can now delete the old convexApi1752607591403.ts file once you've updated all imports"