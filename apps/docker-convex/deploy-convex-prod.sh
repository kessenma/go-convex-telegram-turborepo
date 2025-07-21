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

# Explicitly tell Convex CLI to use the self-hosted backend, not Convex Cloud
export CONVEX_SELF_HOSTED_URL=http://convex-backend:3211

# Optional: also export CONVEX_URL so other parts of your app still work
export CONVEX_URL=http://convex-backend:3211

# Deploy using the self-hosted target (skips the cloud login prompt)
npx convex deploy -y --env-file "$PROJECT_ROOT/.env"

echo "✅ Convex production deployment complete!"