# deploy-convex-prod.sh
#!/bin/bash

# Deploy Convex functions and sync generated files to production
# This script ensures that all apps have the latest Convex generated files

set -e

echo "🚀 Deploying Convex functions to production..."

# Deploy functions from docker-convex
cd apps/docker-convex

# Determine if we're in production by checking hostname
if echo "$(hostname)" | grep -q "rag-ubuntu"; then
  # Production environment - use actual server IP
  SERVER_IP="157.180.80.201"
  echo "🌎 Using production server IP: $SERVER_IP"
else
  # Local environment - use localhost
  SERVER_IP="localhost"
  echo "💻 Using localhost for local deployment"
fi

# Set standard ports
NEXT_PUBLIC_CONVEX_PORT=3210
CONVEX_SITE_PORT=3211

# Set environment variables for self-hosted deployment
export CONVEX_URL=http://$SERVER_IP:$NEXT_PUBLIC_CONVEX_PORT
# Don't set CONVEX_SELF_HOSTED_URL when CONVEX_DEPLOYMENT is set
# export CONVEX_SELF_HOSTED_URL=http://$SERVER_IP:$NEXT_PUBLIC_CONVEX_PORT

echo "🔗 Using Convex URL: $CONVEX_URL"

# Update .env.docker with the correct server configuration
echo "📝 Updating .env.docker with server configuration..."
sed -i.bak "s|CONVEX_URL=.*|CONVEX_URL=$CONVEX_URL|g" .env.docker
# Don't set CONVEX_SELF_HOSTED_URL when CONVEX_DEPLOYMENT is set
# sed -i.bak "s|CONVEX_SELF_HOSTED_URL=.*|CONVEX_SELF_HOSTED_URL=$CONVEX_URL|g" .env.docker
sed -i.bak "s|CONVEX_CLOUD_ORIGIN=.*|CONVEX_CLOUD_ORIGIN=$CONVEX_URL|g" .env.docker
sed -i.bak "s|NEXT_PUBLIC_DEPLOYMENT_URL=.*|NEXT_PUBLIC_DEPLOYMENT_URL=$CONVEX_URL|g" .env.docker
rm -f .env.docker.bak

pnpm run deploy-functions
pnpm build

echo "📁 Syncing generated files to web app..."

# Ensure web app convex directory exists
mkdir -p ../web/convex/_generated

# Copy generated files to web app
rsync -a convex/_generated/ ../web/convex/_generated/ --delete
rsync -a convex/_generated/ ../mobile/convex/_generated/ --delete

echo "📁 Syncing generated files to mobile app..."

# Ensure mobile app convex directory exists  
mkdir -p ../mobile/convex/_generated

# Copy generated files to mobile app
cp convex/_generated/* ../mobile/convex/_generated/ || true

cd ../..

echo "✅ Convex production deployment complete!"
echo "📦 Generated files synced to:"
echo "   - apps/web/convex/_generated/"
echo "   - apps/mobile/convex/_generated/"
echo ""
echo "🔄 Restart your web and mobile apps to pick up the changes."