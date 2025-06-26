#!/bin/bash

# Telegram Bot + Convex Backend Setup Script
# This script automates the setup process described in SETUP.md

set -e  # Exit on any error

echo "🚀 Starting Telegram Bot + Convex Backend Setup"
echo "================================================"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created from template"
else
    echo "✅ .env file already exists"
fi

# Check if TELEGRAM_TOKEN is set
source .env
if [ -z "$TELEGRAM_TOKEN" ] || [ "$TELEGRAM_TOKEN" = "your_telegram_bot_token_here" ]; then
    echo ""
    echo "🤖 Telegram Bot Token Setup"
    echo "============================"
    echo "You need a Telegram bot token to continue."
    echo "Get one from @BotFather on Telegram: https://t.me/botfather"
    echo ""
    read -p "Do you want to enter your Telegram bot token now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        read -p "Enter your Telegram bot token: " TELEGRAM_TOKEN_INPUT
        
        if [ -z "$TELEGRAM_TOKEN_INPUT" ]; then
            echo "❌ No token provided. Exiting..."
            exit 1
        fi
        
        # Update the .env file with the provided token
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/TELEGRAM_TOKEN=.*/TELEGRAM_TOKEN=$TELEGRAM_TOKEN_INPUT/" .env
        else
            # Linux
            sed -i "s/TELEGRAM_TOKEN=.*/TELEGRAM_TOKEN=$TELEGRAM_TOKEN_INPUT/" .env
        fi
        
        echo "✅ Telegram token saved to .env file"
        
        # Re-source the .env file to get the updated token
        source .env
    else
        echo "❌ Telegram token is required to continue."
        echo "   Please edit .env file and add your TELEGRAM_TOKEN, then run the script again."
        exit 1
    fi
fi

echo "✅ TELEGRAM_TOKEN is configured"

# Start Convex backend first
echo "🔧 Starting Convex backend..."
docker compose up convex-backend -d

# Wait for backend to be healthy
echo "⏳ Waiting for Convex backend to be healthy..."
sleep 15

# Check if backend is healthy
if ! curl -f http://localhost:3210/version > /dev/null 2>&1; then
    echo "❌ Convex backend is not responding. Check logs with: docker compose logs convex-backend"
    exit 1
fi

echo "✅ Convex backend is healthy"

# Generate admin key and configure Convex
echo "🔑 Generating Convex admin key..."
ADMIN_KEY=$(docker compose exec convex-backend ./generate_admin_key.sh | grep -E '^[^|]+\|[a-f0-9]+$' | tail -1)
echo "✅ Admin key generated: ${ADMIN_KEY}"

# Deploy Convex functions
echo "📦 Deploying Convex functions..."
cd apps/docker-convex

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Convex dependencies..."
    pnpm install
fi

# Configure .env.local for self-hosted Convex
echo "⚙️ Configuring Convex environment..."
cp .env.local.example .env.local
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s#CONVEX_SELF_HOSTED_ADMIN_KEY=#CONVEX_SELF_HOSTED_ADMIN_KEY=${ADMIN_KEY}#" .env.local
else
    # Linux
    sed -i "s#CONVEX_SELF_HOSTED_ADMIN_KEY=#CONVEX_SELF_HOSTED_ADMIN_KEY=${ADMIN_KEY}#" .env.local
fi

# Deploy functions
echo "🚀 Deploying Convex functions..."
pnpm convex dev --once

cd ../..

echo "✅ Convex functions deployed"

# Start all services
echo "🚀 Starting all services..."
docker compose up -d

# Wait a moment for services to start
sleep 5

# Check service status
echo "📊 Service Status:"
docker compose ps

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📱 Your Telegram bot is now connected to Convex!"
echo "🌐 Convex Dashboard: http://localhost:6791"
echo "🔍 API Health Check: http://localhost:3210/api/health"
echo "📨 Messages API: http://localhost:3210/api/telegram/messages"
echo ""
echo "💬 Send a message to your Telegram bot to test the integration!"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker compose logs -f"
echo "   Stop services: docker compose down"
echo "   Restart bot: docker compose restart telegram-bot"
echo ""
echo "🔍 Test the API:"
echo "   curl http://localhost:3210/api/health"
echo "   curl http://localhost:3210/api/telegram/messages"