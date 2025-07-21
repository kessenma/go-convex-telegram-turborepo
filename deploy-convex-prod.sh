#!/bin/bash
set -e

# Get root of project so the script works from anywhere
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "⏳ Waiting for Convex backend to be healthy…"

# Find Convex backend container dynamically (works with any container naming)
BACKEND_CONTAINER=$(docker ps --filter "name=convex-backend" --format "{{.Names}}" | head -n 1)

if [ -z "$BACKEND_CONTAINER" ]; then
  echo "❌ Could not find convex-backend container. Is it running?"
  echo "Available containers:"
  docker ps --format "table {{.Names}}\t{{.Status}}"
  exit 1
fi

echo "📦 Found backend container: $BACKEND_CONTAINER"

# Wait for health check to pass
echo "⏳ Waiting for backend health check..."
until [ "$(docker inspect --format='{{.State.Health.Status}}' "$BACKEND_CONTAINER" 2>/dev/null)" = "healthy" ]; do
  echo -n "."
  sleep 3
done

echo -e "\n🚀 Deploying Convex functions to $BACKEND_CONTAINER…"

# Go to docker-convex directory
cd "$PROJECT_ROOT/apps/docker-convex"

# Check if .env.docker exists, if not create from example
if [ ! -f ".env.docker" ]; then
  echo "📝 Creating .env.docker from example..."
  cp .env.docker.example .env.docker
fi

# Install Convex CLI if not present
if ! command -v convex &> /dev/null; then
  echo "📦 Installing Convex CLI…"
  npm install convex@latest --no-save
fi

# Get the actual server IP and port for self-hosted deployment
# Force IPv4 to avoid IPv6 URL issues with Convex CLI
SERVER_IP=$(curl -4 -s ifconfig.me 2>/dev/null || curl -s ipv4.icanhazip.com 2>/dev/null || echo "localhost")
CONVEX_PORT=$(docker port "$BACKEND_CONTAINER" 3210 | cut -d: -f2)
CONVEX_SITE_PORT=$(docker port "$BACKEND_CONTAINER" 3211 | cut -d: -f2)

# Validate that we got an IPv4 address
if [[ ! $SERVER_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
  echo "⚠️  Could not get valid IPv4 address, using localhost"
  SERVER_IP="localhost"
fi

if [ -z "$CONVEX_PORT" ]; then
  echo "❌ Could not determine Convex backend port mapping"
  exit 1
fi

# Set environment variables for self-hosted deployment
export CONVEX_SELF_HOSTED_URL=http://$SERVER_IP:$CONVEX_PORT
export CONVEX_URL=http://$SERVER_IP:$CONVEX_PORT

echo "🔗 Using Convex URL: $CONVEX_URL"

# Update .env.docker with the correct server configuration
echo "📝 Updating .env.docker with server configuration..."
sed -i.bak "s|CONVEX_URL=.*|CONVEX_URL=$CONVEX_URL|g" .env.docker
sed -i.bak "s|CONVEX_SELF_HOSTED_URL=.*|CONVEX_SELF_HOSTED_URL=$CONVEX_URL|g" .env.docker
sed -i.bak "s|CONVEX_CLOUD_ORIGIN=.*|CONVEX_CLOUD_ORIGIN=$CONVEX_URL|g" .env.docker
sed -i.bak "s|NEXT_PUBLIC_DEPLOYMENT_URL=.*|NEXT_PUBLIC_DEPLOYMENT_URL=$CONVEX_URL|g" .env.docker
rm -f .env.docker.bak

# Deploy using the self-hosted configuration
echo "🚀 Deploying Convex functions..."
npx convex deploy --yes --env-file .env.docker

echo "✅ Convex production deployment complete!"