# Quick Fix for Coolify Deployment

## The Problem
Your Convex backend is starting successfully but failing the health check, causing other services to not start.

## The Solution

### 1. Update Your Environment Variables in Coolify

Add these environment variables to your Coolify project:

```bash
# Health check and timeout settings
CONVEX_BOOTSTRAP_TIMEOUT_MS=120000
CONVEX_HEALTH_CHECK_TIMEOUT_MS=60000

# RAM allocation (adjust based on your server)
NEXT_PUBLIC_CONVEX_BACKEND_RAM=2G
NEXT_PUBLIC_CONVEX_BACKEND_RAM_RESERVATION=1G
CONVEX_MAX_RAM_MB=2048

# Other required variables
TELEGRAM_TOKEN=your_actual_token
CONVEX_INSTANCE_SECRET=your_secure_64_char_secret
```

### 2. The Key Changes Made

1. **Fixed health check syntax**: Changed from `CMD` to `CMD-SHELL` format
2. **Increased timeouts**: Health check now waits 60 seconds before starting
3. **Simplified health check**: Uses TCP connection test instead of HTTP request
4. **Added timeout environment variables**: Gives Convex more time to bootstrap

### 3. Deploy and Test

1. **Update your environment variables** in Coolify with the values above
2. **Redeploy** your application
3. **Monitor the logs** - the backend should now pass health checks
4. **Test the health check** manually if it still fails:
   ```bash
   # SSH into your server and run:
   docker ps | grep convex-backend
   docker logs <convex-backend-container-id>
   ```

### 4. If It Still Fails

The issue might be that your 8GB server doesn't have enough available RAM. Try these RAM allocations for an 8GB server:

```bash
# Reduced RAM allocation for 8GB server
NEXT_PUBLIC_CONVEX_BACKEND_RAM=1.5G
NEXT_PUBLIC_CONVEX_BACKEND_RAM_RESERVATION=750M
NEXT_PUBLIC_VECTOR_CONVERT_LLM_RAM=1.5G
NEXT_PUBLIC_LIGHTWEIGHT_LLM_RAM=3G
NEXT_PUBLIC_WEB_DASHBOARD_RAM=512M
CONVEX_MAX_RAM_MB=1536
```

### 5. Expected Behavior

After the fix:
- Convex backend should start and become healthy within 60 seconds
- Other services will then start automatically
- You should see all containers running in `docker ps`
- The web dashboard should be accessible

### 6. Monitoring

Check these URLs after deployment:
- Health check: `http://your-server:3210/version`
- Web dashboard: `http://your-server:3000`
- Convex dashboard: `http://your-server:6791`

The key insight is that your Convex backend was actually working fine - it was just the health check command that was malformed, causing Docker to think the service was unhealthy.