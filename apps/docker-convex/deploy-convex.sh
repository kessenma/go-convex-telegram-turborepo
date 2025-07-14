#!/bin/bash
set -e

echo "🚀 Starting Convex function deployment..."

# Wait for backend to be ready
echo "⏳ Waiting for Convex backend to be ready..."
until curl -f http://convex-backend:3210/version > /dev/null 2>&1; do
  echo "Waiting for backend..."
  sleep 2
done

echo "✅ Backend is ready, deploying functions..."

# Create convex.json configuration for self-hosted deployment
echo "📝 Creating Convex configuration..."
cat > convex.json << EOF
{
  "functions": "convex/",
  "generateCommonJSApi": false,
  "node": {
    "externalPackages": []
  }
}
EOF

# Set environment variables for Convex CLI
export CONVEX_DEPLOYMENT=${CONVEX_URL}
export CONVEX_DEPLOY_KEY=${CONVEX_INSTANCE_SECRET}

# Deploy functions with proper configuration
echo "🚀 Deploying functions to self-hosted backend..."
npx convex deploy --url ${CONVEX_URL} --admin-key ${CONVEX_INSTANCE_SECRET} --yes

echo "📁 Copying generated files to shared volume..."
# Copy generated files to shared volume
cp -r convex/_generated/* /app/convex/_generated/ 2>/dev/null || true

echo "🔑 Generating admin key for Convex dashboard..."
# Generate admin key by calling the backend directly
ADMIN_KEY=$(curl -s -X POST http://convex-backend:3210/api/generate_admin_key 2>/dev/null || echo "")

if [ -n "$ADMIN_KEY" ]; then
    echo ""
    echo "🎉 =================================="
    echo "🔐 CONVEX ADMIN KEY GENERATED:"
    echo "🔐 $ADMIN_KEY"
    echo "🎉 =================================="
    echo ""
    echo "📋 Use this key to access the Convex Dashboard at:"
    echo "📋 http://your-server-ip:6791"
    echo ""
else
    echo "⚠️  Could not generate admin key automatically."
    echo "💡 You can generate it manually with:"
    echo "💡 docker exec -it <convex-backend-container> ./generate_admin_key.sh"
fi

echo "✅ Convex deployment complete!"
