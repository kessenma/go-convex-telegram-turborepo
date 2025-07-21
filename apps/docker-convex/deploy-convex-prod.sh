#!/bin/bash
set -e

# Get root of project so the script works from anywhere
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "⏳ Waiting for Convex backend to be healthy…"

# Find Convex backend container dynamically (Coolify prefixes names)
BACKEND_CONTAINER=$(docker ps --filter "name=convex-backend" --format "{{.Names}}" | head -n 1)

if [ -z "$BACKEND_CONTAINER" ]; then
  echo "❌ Could not find convex-backend container. Is it running?"
  exit 1
fi

# Wait for health check to pass
until [ "$(docker inspect --format='{{.State.Health.Status}}' "$BACKEND_CONTAINER" 2>/dev/null)" = "healthy" ]; do
  echo -n "."
  sleep 3
done

echo -e "\n🚀 Deploying Convex functions to $BACKEND_CONTAINER…"

# Go to docker-convex directory no matter where we are
cd "$PROJECT_ROOT/apps/docker-convex"

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

# Explicitly tell Convex CLI to use the self-hosted backend, not Convex Cloud
export CONVEX_SELF_HOSTED_URL=http://$SERVER_IP:$CONVEX_PORT
export CONVEX_URL=http://$SERVER_IP:$CONVEX_PORT

echo "🔗 Using Convex URL: $CONVEX_URL"

# Update .env.docker with the correct server configuration if it exists
if [ -f ".env.docker" ]; then
  echo "📝 Updating .env.docker with server configuration..."
  sed -i.bak "s|CONVEX_URL=.*|CONVEX_URL=$CONVEX_URL|g" .env.docker
  sed -i.bak "s|CONVEX_SELF_HOSTED_URL=.*|CONVEX_SELF_HOSTED_URL=$CONVEX_URL|g" .env.docker
  sed -i.bak "s|CONVEX_CLOUD_ORIGIN=.*|CONVEX_CLOUD_ORIGIN=$CONVEX_URL|g" .env.docker
  sed -i.bak "s|NEXT_PUBLIC_DEPLOYMENT_URL=.*|NEXT_PUBLIC_DEPLOYMENT_URL=$CONVEX_URL|g" .env.docker
  rm -f .env.docker.bak
fi

# Deploy using the self-hosted target (skips the cloud login prompt)
npx convex deploy -y --env-file .env.docker

# Generate and deploy the API
cd "$PROJECT_ROOT"
./helper-scripts/deploy-convex-api.sh

echo "✅ Convex production deployment complete!"