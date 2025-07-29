# Coolify Deployment Guide

This guide explains how to deploy your RAG chatbot system using Coolify.

## Quick Start

1. **Generate Environment Variables**:
   ```bash
   ./generate-coolify-env.sh
   ```
   This will calculate optimal RAM allocations and generate the environment variables you need.

2. **Copy Variables to Coolify**:
   - Go to your Coolify project
   - Navigate to Environment Variables
   - Copy and paste the generated variables

3. **Add Required Secrets**:
   ```bash
   TELEGRAM_TOKEN=your_actual_bot_token
   TELEGRAM_BOT_USERNAME=your_bot_username
   CONVEX_INSTANCE_SECRET=your_secure_64_char_secret
   ```

4. **Deploy**:
   Coolify will automatically use your docker-compose.yaml with the configured RAM allocations.

## Environment Variables Explained

### RAM Allocation Variables
These control how much memory each service gets:

```bash
# Total allocation
NEXT_PUBLIC_TOTAL_RAM_ALLOCATED=8G
NEXT_PUBLIC_RAM_AVAILABLE=8G

# Service limits (automatically calculated)
NEXT_PUBLIC_LIGHTWEIGHT_LLM_RAM=4.0G      # 50% - Main AI model
NEXT_PUBLIC_CONVEX_BACKEND_RAM=2.0G       # 25% - Database
NEXT_PUBLIC_VECTOR_CONVERT_LLM_RAM=1.2G   # 15% - Embeddings
NEXT_PUBLIC_WEB_DASHBOARD_RAM=400M        # 5% - Web UI
NEXT_PUBLIC_CONVEX_DASHBOARD_RAM=240M     # 3% - Admin UI
NEXT_PUBLIC_TELEGRAM_BOT_RAM=160M         # 2% - Bot service

# Reservations (guaranteed minimum)
NEXT_PUBLIC_LIGHTWEIGHT_LLM_RAM_RESERVATION=2.0G
NEXT_PUBLIC_CONVEX_BACKEND_RAM_RESERVATION=1.0G
# ... (50% of each limit)

# Convex internal limit
CONVEX_MAX_RAM_MB=2048
```

### Required Configuration
```bash
# Bot credentials
TELEGRAM_TOKEN=your_bot_token_from_botfather
TELEGRAM_BOT_USERNAME=your_bot_username_bot

# Security
CONVEX_INSTANCE_SECRET=your_64_character_secret

# Ports (use defaults unless you have conflicts)
NEXT_PUBLIC_CONVEX_PORT=3210
NEXT_PUBLIC_CONVEX_SITE_PROXY_PORT=3211
WEB_DASHBOARD_PORT=3000
LIGHTWEIGHT_LLM_PORT=8082
VECTOR_CONVERT_PORT=7999
CONVEX_DASHBOARD_PORT=6791
```

## Troubleshooting

### Convex Backend Health Check Failing

The most common issue is the Convex backend failing its health check. This is usually due to:

1. **Insufficient RAM**: Make sure your server has enough RAM for the allocated amounts
2. **Slow startup**: The health check now waits 60 seconds before starting checks
3. **Missing tools**: The container might not have curl/wget available
4. **Network issues**: Ensure internal Docker networking is working

**Solutions**:

1. **Check the logs** in Coolify:
   ```bash
   docker logs <convex-backend-container-id>
   ```

2. **Test the health check manually**:
   ```bash
   # Run the troubleshooting script
   chmod +x test-convex-health.sh
   ./test-convex-health.sh
   ```

3. **Verify the service is actually running**:
   ```bash
   # Check if the port is listening
   docker exec <container-id> netstat -ln | grep 3210
   ```

4. **Increase timeout values** in Coolify environment:
   ```bash
   CONVEX_BOOTSTRAP_TIMEOUT_MS=120000
   CONVEX_HEALTH_CHECK_TIMEOUT_MS=60000
   ```

### RAM Allocation Issues

If services are getting killed due to memory limits:

1. **Increase total allocation**: Run `./generate-coolify-env.sh` with a higher value
2. **Check server capacity**: Ensure your server has enough physical RAM
3. **Monitor usage**: Use Coolify's monitoring to see actual RAM usage

### Service Dependencies

Services start in this order:
1. `convex-backend` (must be healthy first)
2. `convex-dashboard`, `vector-convert-llm`, `lightweight-llm`
3. `web-dashboard`, `telegram-bot`

If a service fails to start, check that its dependencies are healthy.

## Recommended Server Specs

### Minimum (Testing)
- **RAM**: 4GB
- **CPU**: 2 cores
- **Storage**: 10GB

### Recommended (Production)
- **RAM**: 8GB+
- **CPU**: 4+ cores
- **Storage**: 20GB+

### High Performance
- **RAM**: 16GB+
- **CPU**: 8+ cores
- **Storage**: 50GB+

## Monitoring

After deployment, monitor these URLs:

- **Web Dashboard**: `https://your-domain.com`
- **Convex Dashboard**: `https://your-domain.com:6791`
- **API Health**: `https://your-domain.com:3211/api/health`
- **Vector API**: `https://your-domain.com:7999/health`
- **LLM API**: `https://your-domain.com:8082/health`

## Security Notes

1. **Change the default secret**: Never use the default `CONVEX_INSTANCE_SECRET`
2. **Use HTTPS**: Configure SSL/TLS in Coolify
3. **Firewall**: Only expose necessary ports
4. **Updates**: Keep your Docker images updated

## Support

If you encounter issues:

1. Check Coolify logs for each service
2. Verify environment variables are set correctly
3. Ensure your server meets the minimum requirements
4. Check that all required ports are available