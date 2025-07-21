#!/bin/bash
set -e

echo "⏳ Waiting for Convex backend to be healthy…"

# Find the actual convex-backend container (Coolify prefixes names)
BACKEND_CONTAINER=$(docker ps --filter "name=convex-backend" --format "{{.Names}}" | head -n 1)

if [ -z "$BACKEND_CONTAINER" ]; then
  echo "❌ Could not find convex-backend container. Is it running?"
  exit 1
fi

# Wait for health status (if the image supports it)
until [ "$(docker inspect --format='{{.State.Health.Status}}' "$BACKEND_CONTAINER" 2>/dev/null)" = "healthy" ]; do
  echo -n "."
  sleep 3
done

echo -e "\n🚀 Deploying Convex functions to $BACKEND_CONTAINER…"

cd apps/docker-convex
# Run convex deployment against the backend’s internal URL
CONVEX_URL=http://convex-backend:3211 npx convex deploy --prod
cd ../../

echo "✅ Convex production deployment complete!"