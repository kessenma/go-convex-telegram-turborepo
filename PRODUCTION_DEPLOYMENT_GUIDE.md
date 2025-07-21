# Production Deployment Guide

This guide explains how to deploy your Convex functions to a self-hosted production environment.

## Prerequisites

1. Docker and Docker Compose installed on your server
2. Your application running via `docker-compose.yaml`
3. All containers healthy and running

## Deployment Steps

### 1. Start Your Docker Services

First, make sure all your services are running:

```bash
docker-compose up -d
```

Verify all containers are healthy:

```bash
docker-compose ps
```

### 2. Clone Repository on Server

Clone your repository to the server:

```bash
git clone <your-repo-url>
cd go-convex-telegram-turborepo
```

### 3. Configure Environment

The deployment script will automatically create `.env.docker` from the example if it doesn't exist. You can also create it manually:

```bash
cd apps/docker-convex
cp .env.docker.example .env.docker
```

Edit `.env.docker` with your specific configuration:

```bash
nano .env.docker
```

Key settings to verify:
- `CONVEX_URL=http://localhost:3210`
- `CONVEX_SELF_HOSTED_URL=http://localhost:3210`
- `INSTANCE_SECRET` (should match your docker-compose.yaml)

### 4. Run Deployment Script

There are two deployment scripts available:

**Option A: From project root (recommended)**
```bash
./deploy-convex-prod.sh
```

**Option B: From docker-convex directory**
```bash
cd apps/docker-convex
./deploy-convex-prod.sh
```

Both scripts will:
- Find your Convex backend container automatically
- Detect the correct server IP and port mappings
- Wait for the container to be healthy
- Install Convex CLI if needed
- Update .env.docker with correct server configuration
- Deploy your functions using the self-hosted configuration

## Troubleshooting

### Container Not Found

If you get "Could not find convex-backend container":

1. Check if containers are running: `docker ps`
2. Verify container names: `docker ps --format "table {{.Names}}\t{{.Status}}"`
3. Make sure your docker-compose.yaml uses `convex-backend` as the service name

### HTTP Actions Not Enabled Error / 404 on /api/prepare_schema

If you see errors like:
```
Error fetching POST `http://157.180.80.201:3211/api/prepare_schema` 404 Not Found
This Convex deployment does not have HTTP actions enabled.
```

This occurs when:
1. The deployment script is trying to connect to the wrong URL/port
2. Using cloud deployment methods with self-hosted Convex
3. Environment variables are not properly configured

**Solution:**
- Use the updated deployment scripts that automatically detect server IP and ports
- Ensure you're using port 3210 (backend) not 3211 (site proxy) for deployment
- The scripts now dynamically update .env.docker with correct configuration

### Permission Denied

Make sure the script is executable:

```bash
chmod +x deploy-convex-prod.sh
```

### Environment File Missing

If `.env.docker` doesn't exist, the script will create it from the example and exit. Edit the file with your configuration and run again.

## Key Differences from Local Development

- **Local**: Uses `./deploy-convex.sh` with `convex dev`
- **Production**: Uses `./deploy-convex-prod.sh` with `convex deploy` and self-hosted configuration
- **Environment**: Production uses `.env.docker` instead of `.env.local`
- **URL**: Production connects to `http://localhost:3210` (the exposed port from docker-compose)

## Verification

After successful deployment, you can verify:

1. Check Convex dashboard: `http://your-server:6791`
2. Test API endpoints: `http://your-server:3210/version`
3. Check container logs: `docker-compose logs convex-backend`

## Notes

- The script automatically detects container names (works with Coolify and other deployment platforms)
- No need to manually extract admin keys - the script uses the proper self-hosted deployment method
- The deployment is idempotent - you can run it multiple times safely