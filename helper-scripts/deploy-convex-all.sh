#!/bin/bash

# deploy-convex-all.sh
# Combined script that runs both deploy-convex.sh and deploy-convex-api.sh
# This script deploys Convex functions and generates TypeScript API definitions in one step

set -e

echo "🚀 Starting complete Convex deployment process..."
echo "Step 1: Deploying Convex functions to backend"

# Run the deploy-convex.sh script first
"$(dirname "$0")/deploy-convex.sh"

echo ""
echo "Step 2: Generating and deploying TypeScript API definitions"

# Run the deploy-convex-api.sh script next
# Pass any command line arguments to the API script
"$(dirname "$0")/deploy-convex-api.sh" "$@"

echo ""
echo "🎉 Complete Convex deployment process finished!"
echo "✅ Backend functions deployed and API definitions generated"
echo "🔄 Your web and mobile apps are now ready to use the updated API"