#!/bin/bash

echo "🔍 Docker Container Network Debugging"
echo "====================================="

echo "1. Container network information:"
echo "   Hostname: $(hostname)"
echo "   IP Address: $(hostname -i)"
echo ""

echo "2. DNS resolution test:"
echo "   Resolving convex-backend..."
nslookup convex-backend || echo "   ❌ DNS resolution failed"
echo ""

echo "3. Network connectivity test:"
echo "   Testing connection to convex-backend:3211..."
nc -zv convex-backend 3211 2>&1 || echo "   ❌ Connection failed"
echo ""

echo "4. HTTP connectivity test:"
echo "   Testing HTTP connection..."
curl -v --connect-timeout 5 http://convex-backend:3211/api/health 2>&1 || echo "   ❌ HTTP connection failed"
echo ""

echo "5. Environment variables:"
echo "   CONVEX_URL: $CONVEX_URL"
echo "   PORT: $PORT"
echo ""

echo "6. Python connection test:"
python3 test_connection.py