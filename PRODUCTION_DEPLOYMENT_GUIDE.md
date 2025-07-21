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

From the project root, run:

```bash
./deploy-convex-prod.sh
```

The script will:
- Find your Convex backend container automatically
- Wait for it to be healthy
- Install Convex CLI if needed
- Deploy your functions using the self-hosted configuration

## Troubleshooting

### Container Not Found

If you get "Could not find convex-backend container":

1. Check if containers are running: `docker ps`
2. Verify container names: `docker ps --format "table {{.Names}}\t{{.Status}}"`
3. Make sure your docker-compose.yaml uses `convex-backend` as the service name

### HTTP Actions Not Enabled Error

This error occurs when trying to use cloud deployment methods with self-hosted Convex. The fixed script uses the proper self-hosted deployment approach.

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