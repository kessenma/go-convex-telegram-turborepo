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
  echo "⚠️  Please edit .env.docker with your configuration before running again."
  exit 1
fi

# Install Convex CLI if not present
if ! command -v convex &> /dev/null; then
  echo "📦 Installing Convex CLI…"
  npm install convex@latest --no-save
fi

# Set environment variables for self-hosted deployment
export CONVEX_SELF_HOSTED_URL=http://localhost:3210
export CONVEX_URL=http://localhost:3210

# Deploy using the self-hosted configuration
echo "🚀 Deploying Convex functions..."
npx convex deploy --yes --env-file .env.docker

echo "✅ Convex production deployment complete!"