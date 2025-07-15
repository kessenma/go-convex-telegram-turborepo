#!/usr/bin/env bash
set -euo pipefail

# 1) cd into the docker-convex folder
cd "$(dirname "$0")"

# 2) Wait for the Convex backend container to be healthy
echo "⏳ Waiting for Convex backend to be healthy…"
# Replace “backend-…” with the actual Coolify container name, or use label filtering
until docker exec backend-rsg8k0ok44sg04k84okgk4g0 curl -sf http://127.0.0.1:3210/version > /dev/null; do
  printf '.'
  sleep 1
done
echo " ✅ Backend is up!"

# 3) Extract the admin key directly out of the container
ADMIN_KEY=$(
  docker exec backend-rsg8k0ok44sg04k84okgk4g0 \
    ./generate_admin_key.sh | awk '{print $NF}'
)
echo "🔑 Fetched Admin Key: ${ADMIN_KEY:0:8}…${ADMIN_KEY: -8}"

# 4) Install dependencies
echo "📦 Installing Convex CLI…"
npm install convex@latest --no-save

# 5) Deploy your functions/schema
echo "🚀 Deploying Convex functions…"
npx convex deploy ./convex \
  --url ${CONVEX_URL:-http://127.0.0.1:3210} \
  --admin-key "$ADMIN_KEY" \
  --yes

echo "🎉 Deployment complete!"