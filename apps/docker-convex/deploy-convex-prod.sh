#!/bin/bash
set -e

echo "🚀 Deploying Convex functions (production)..."

# Make sure backend is up
docker compose up -d convex-backend

# Deploy Convex functions to the running backend
cd apps/docker-convex
CONVEX_URL=http://convex-backend:3211 npx convex deploy --prod
cd ../../

echo "✅ Convex production deployment complete!"