#!/bin/bash

# Docker Network Troubleshooting Script
echo "🔍 Docker Network Troubleshooting"
echo "================================="

# Check Docker daemon status
echo "\n📋 Checking Docker daemon status..."
docker info > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Docker daemon is running"
else
    echo "❌ Docker daemon is not running. Please start Docker Desktop."
    exit 1
fi

# Check network connectivity
echo "\n🌐 Testing network connectivity..."
ping -c 3 8.8.8.8 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Internet connectivity is working"
else
    echo "❌ No internet connectivity detected"
fi

# Test Docker registry connectivity
echo "\n🐳 Testing Docker registry connectivity..."
curl -s --connect-timeout 10 https://registry-1.docker.io/v2/ > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Docker registry is accessible"
else
    echo "❌ Cannot reach Docker registry"
    echo "💡 Try the following solutions:"
    echo "   1. Check your internet connection"
    echo "   2. Restart Docker Desktop"
    echo "   3. Clear Docker cache: docker system prune -a"
    echo "   4. Try using a VPN if behind corporate firewall"
fi

# Check Docker disk space
echo "\n💾 Checking Docker disk usage..."
docker system df

echo "\n🔧 Quick fixes to try:"
echo "1. Restart Docker Desktop"
echo "2. Clear Docker cache: docker system prune -a"
echo "3. Try building again: docker compose build vector-convert-llm"
echo "4. If behind corporate firewall, configure Docker proxy settings"