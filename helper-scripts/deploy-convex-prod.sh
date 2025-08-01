#!/bin/bash
set -e

# Get root of project so the script works from anywhere
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

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
  npm install convex@latest --no-save --legacy-peer-deps
fi

# Determine if we're in production by checking hostname
if [[ $(hostname) == *"rag-ubuntu"* ]]; then
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

if [ -z "$NEXT_PUBLIC_CONVEX_PORT" ]; then
  echo "❌ Could not determine Convex backend port mapping"
  exit 1
fi

# Set environment variables for self-hosted deployment
export CONVEX_SELF_HOSTED_URL=http://$SERVER_IP:$NEXT_PUBLIC_CONVEX_PORT
export CONVEX_URL=http://$SERVER_IP:$NEXT_PUBLIC_CONVEX_PORT

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

# Try to deploy, capture output and exit code
DEPLOY_OUTPUT=$(npx convex deploy --yes --env-file .env.docker 2>&1) || DEPLOY_EXIT_CODE=$?

if [ ${DEPLOY_EXIT_CODE:-0} -ne 0 ]; then
  echo "⚠️  Initial deployment failed, checking if migrations are needed..."
  echo "$DEPLOY_OUTPUT"
  
  # Check if the error is related to schema validation
  if echo "$DEPLOY_OUTPUT" | grep -q "Schema validation failed"; then
    echo "🔧 Schema validation failed - running migrations..."
    
    # Run the migration for missing conversation fields
    echo "📝 Running migration: addMissingConversationFields..."
    npx convex run migrations:addMissingConversationFields --env-file .env.docker
    
    # Also run the hasEmbedding migration in case it's needed
    echo "📝 Running migration: addHasEmbeddingField..."
    npx convex run migrations:addHasEmbeddingField --env-file .env.docker
    
    echo "🔄 Retrying deployment after migrations..."
    npx convex deploy --yes --env-file .env.docker
  else
    echo "❌ Deployment failed for reasons other than schema validation"
    echo "$DEPLOY_OUTPUT"
    exit ${DEPLOY_EXIT_CODE}
  fi
else
  echo "$DEPLOY_OUTPUT"
fi

echo "✅ Convex production deployment complete!"