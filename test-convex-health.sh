#!/bin/bash

# Test Convex Health Check Script
# This script helps debug Convex backend health check issues

echo "🔍 Convex Backend Health Check Troubleshooter"
echo "=============================================="
echo ""

# Get the container ID
CONTAINER_ID=$(docker ps --filter "name=convex-backend" --format "{{.ID}}" | head -1)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ No convex-backend container found running"
    echo "   Check if the container is running with: docker ps"
    exit 1
fi

echo "📦 Found convex-backend container: $CONTAINER_ID"
echo ""

# Check container status
echo "📊 Container Status:"
docker ps --filter "id=$CONTAINER_ID" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Test internal health check
echo "🏥 Testing internal health check..."
echo "Command: curl -f http://localhost:3210/version"
docker exec "$CONTAINER_ID" curl -f http://localhost:3210/version 2>/dev/null
HEALTH_EXIT_CODE=$?

if [ $HEALTH_EXIT_CODE -eq 0 ]; then
    echo "✅ Internal health check PASSED"
else
    echo "❌ Internal health check FAILED (exit code: $HEALTH_EXIT_CODE)"
fi
echo ""

# Test external connectivity
echo "🌐 Testing external connectivity..."
echo "Command: curl -f http://localhost:3210/version"
curl -f http://localhost:3210/version 2>/dev/null
EXTERNAL_EXIT_CODE=$?

if [ $EXTERNAL_EXIT_CODE -eq 0 ]; then
    echo "✅ External connectivity PASSED"
else
    echo "❌ External connectivity FAILED (exit code: $EXTERNAL_EXIT_CODE)"
fi
echo ""

# Check logs for errors
echo "📋 Recent container logs (last 20 lines):"
echo "=========================================="
docker logs "$CONTAINER_ID" --tail 20
echo ""

# Check if curl is available in container
echo "🔧 Checking if curl is available in container..."
docker exec "$CONTAINER_ID" which curl >/dev/null 2>&1
CURL_EXIT_CODE=$?

if [ $CURL_EXIT_CODE -eq 0 ]; then
    echo "✅ curl is available in container"
else
    echo "❌ curl is NOT available in container"
    echo "   This might be the issue! The health check needs curl."
fi
echo ""

# Summary
echo "📋 Summary:"
echo "==========="
if [ $HEALTH_EXIT_CODE -eq 0 ] && [ $EXTERNAL_EXIT_CODE -eq 0 ] && [ $CURL_EXIT_CODE -eq 0 ]; then
    echo "✅ All checks passed! The health check should work."
    echo "   If it's still failing, check Docker Compose health check syntax."
else
    echo "❌ Issues found:"
    [ $HEALTH_EXIT_CODE -ne 0 ] && echo "   - Internal health check failed"
    [ $EXTERNAL_EXIT_CODE -ne 0 ] && echo "   - External connectivity failed"
    [ $CURL_EXIT_CODE -ne 0 ] && echo "   - curl not available in container"
fi
echo ""

echo "💡 Troubleshooting Tips:"
echo "======================="
echo "1. If curl is missing, the Convex image might not include it"
echo "2. If internal check fails, the service might not be ready yet"
echo "3. If external check fails, check port mapping and firewall"
echo "4. Check the full logs with: docker logs $CONTAINER_ID"
echo "5. Try restarting the container: docker restart $CONTAINER_ID"
echo ""