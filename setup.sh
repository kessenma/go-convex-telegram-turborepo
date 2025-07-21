#!/bin/bash

# Telegram Bot + Convex Backend Setup Script
# This script automates the setup process described in SETUP.md
# For detailed manual setup instructions, see: https://github.com/your-repo/SETUP.md

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

# Check if TELEGRAM_BOT_USERNAME is set
source .env
if [ -z "$TELEGRAM_BOT_USERNAME" ] || [ "$TELEGRAM_BOT_USERNAME" = "your_bot_username_here" ]; then
    echo ""
    echo "🤖 Telegram Bot Username Setup"
    echo "=============================="
    echo "You need your bot's username to generate the bot URL."
    echo "This is the username you chose when creating the bot with @BotFather."
    echo "Note: Bot usernames always end with '_bot' (e.g., rust_telegram_bot_example_bot)"
    echo ""
    read -p "Do you want to enter your Telegram bot username now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        read -p "Enter your Telegram bot username (including _bot suffix): " TELEGRAM_BOT_USERNAME_INPUT
        
        if [ -z "$TELEGRAM_BOT_USERNAME_INPUT" ]; then
            echo "❌ No username provided. Exiting..."
            exit 1
        fi
        
        # Update the .env file with the provided username
        if grep -q "^TELEGRAM_BOT_USERNAME=" .env; then
            # Update existing line
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s/TELEGRAM_BOT_USERNAME=.*/TELEGRAM_BOT_USERNAME=$TELEGRAM_BOT_USERNAME_INPUT/" .env
            else
                # Linux
                sed -i "s/TELEGRAM_BOT_USERNAME=.*/TELEGRAM_BOT_USERNAME=$TELEGRAM_BOT_USERNAME_INPUT/" .env
            fi
        else
            # Add new line if it doesn't exist
            echo "TELEGRAM_BOT_USERNAME=$TELEGRAM_BOT_USERNAME_INPUT" >> .env
        fi
        
        echo "✅ Telegram bot username saved to .env file"
        
        # Re-source the .env file to get the updated username
        source .env
    else
        echo "❌ Bot username is optional but recommended for easy bot access."
        echo "   You can add it later by editing the .env file."
        TELEGRAM_BOT_USERNAME=""
    fi
fi

echo "✅ TELEGRAM_BOT_USERNAME is configured"

# Check if WEB_DASHBOARD_PORT is set
source .env
if [ -z "$WEB_DASHBOARD_PORT" ]; then
    echo "📝 Setting default web dashboard port to 3000..."
    if grep -q "^WEB_DASHBOARD_PORT=" .env; then
        # Update existing line
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/WEB_DASHBOARD_PORT=.*/WEB_DASHBOARD_PORT=3000/" .env
        else
            # Linux
            sed -i "s/WEB_DASHBOARD_PORT=.*/WEB_DASHBOARD_PORT=3000/" .env
        fi
    else
        # Add new line if it doesn't exist
        echo "WEB_DASHBOARD_PORT=3000" >> .env
    fi
    # Re-source the .env file
    source .env
fi

echo "✅ WEB_DASHBOARD_PORT is configured (${WEB_DASHBOARD_PORT})"

# Start Convex backend first
echo "🔧 Starting Convex backend..."
docker compose up convex-backend -d

# Wait for backend to be healthy
echo "⏳ Waiting for Convex backend to be healthy..."
echo "(you can increase + decrease this amount as needed)"
for i in {5..1}; do
    echo -ne "\r⏳ $i seconds remaining...";
    sleep 1;
done
echo -e "\r✨ Done waiting!                  "

# Check if backend is healthy
if ! curl -f http://localhost:3210/version > /dev/null 2>&1; then
    echo "❌ Convex backend is not responding. Check logs with: docker compose logs convex-backend"
    exit 1
fi

echo "✅ Convex backend is healthy"

# Generate admin key and configure Convex
echo "🔑 Generating Convex admin key..."
ADMIN_KEY=$(docker compose exec convex-backend ./generate_admin_key.sh | grep -E '^[^|]+\|[a-f0-9]+$' | tail -1)
echo "✅ Admin key generated and saved"

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

# Run docker:deploy-convex to sync generated files
echo "📁 Syncing Convex generated files to all apps..."
pnpm run docker:deploy-convex
echo "✅ Convex generated files synced"

# Ensure web app has the latest generated files
echo "🔄 Ensuring web app has latest Convex generated files..."
if [ -d "apps/docker-convex/convex/_generated" ]; then
    mkdir -p apps/web/convex/_generated
    cp -r apps/docker-convex/convex/_generated/* apps/web/convex/_generated/ 2>/dev/null || true
    echo "✅ Generated files copied to web app"
else
    echo "⚠️  Warning: No generated files found in docker-convex. They will be created during deployment."
fi

# Build Next.js web dashboard
echo "🌐 Building Next.js web dashboard..."
cd apps/web

# Check if pnpm is installed (already checked above, but being safe)
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing web dashboard dependencies..."
    pnpm install
fi

# Configure .env.local for web app (for local development with pnpm run dev)
echo "⚙️ Configuring web app environment for local development..."
cp .env.local.example .env.local

# Update Convex URLs for local development
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s#NEXT_PUBLIC_CONVEX_URL=.*#NEXT_PUBLIC_CONVEX_URL=http://localhost:3210#" .env.local
    sed -i '' "s#CONVEX_HTTP_URL=.*#CONVEX_HTTP_URL=http://localhost:3211#" .env.local
    sed -i '' "s#CONVEX_URL=.*#CONVEX_URL=http://localhost:3210#" .env.local
    sed -i '' "s#TELEGRAM_BOT_TOKEN=.*#TELEGRAM_BOT_TOKEN=${TELEGRAM_TOKEN}#" .env.local
    sed -i '' "s#VECTOR_CONVERT_LLM_URL=.*#VECTOR_CONVERT_LLM_URL=http://localhost:8081#" .env.local
    sed -i '' "s#NEXT_PUBLIC_VECTOR_CONVERT_MODEL=.*#NEXT_PUBLIC_VECTOR_CONVERT_MODEL=all-MiniLM-L6-v2#" .env.local
    sed -i '' "s#NEXT_PUBLIC_VECTOR_CONVERT_MODEL_HUGGINGFACE_URL=.*#NEXT_PUBLIC_VECTOR_CONVERT_MODEL_HUGGINGFACE_URL=https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2#" .env.local
    sed -i '' "s#NEXT_PUBLIC_LLM_MODEL=.*#NEXT_PUBLIC_LLM_MODEL=Meta Llama 3.2#" .env.local
    sed -i '' "s#NEXT_PUBLIC_LLM_MODEL_HUGGINGFACE_URL=.*#NEXT_PUBLIC_LLM_MODEL_HUGGINGFACE_URL=https://huggingface.co/meta-llama/Llama-2-7b-chat-hf#" .env.local
    if [ ! -z "$TELEGRAM_BOT_USERNAME" ]; then
        sed -i '' "s#NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=.*#NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=${TELEGRAM_BOT_USERNAME}#" .env.local
    fi
else
    # Linux
    sed -i "s#NEXT_PUBLIC_CONVEX_URL=.*#NEXT_PUBLIC_CONVEX_URL=http://localhost:3210#" .env.local
    sed -i "s#CONVEX_HTTP_URL=.*#CONVEX_HTTP_URL=http://localhost:3211#" .env.local
    sed -i "s#CONVEX_URL=.*#CONVEX_URL=http://localhost:3210#" .env.local
    sed -i "s#TELEGRAM_BOT_TOKEN=.*#TELEGRAM_BOT_TOKEN=${TELEGRAM_TOKEN}#" .env.local
    sed -i "s#VECTOR_CONVERT_LLM_URL=.*#VECTOR_CONVERT_LLM_URL=http://localhost:8081#" .env.local
    sed -i "s#NEXT_PUBLIC_VECTOR_CONVERT_MODEL=.*#NEXT_PUBLIC_VECTOR_CONVERT_MODEL=all-MiniLM-L6-v2#" .env.local
    sed -i "s#NEXT_PUBLIC_VECTOR_CONVERT_MODEL_HUGGINGFACE_URL=.*#NEXT_PUBLIC_VECTOR_CONVERT_MODEL_HUGGINGFACE_URL=https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2#" .env.local
    sed -i "s#NEXT_PUBLIC_LLM_MODEL=.*#NEXT_PUBLIC_LLM_MODEL=Meta Llama 3.2#" .env.local
    sed -i "s#NEXT_PUBLIC_LLM_MODEL_HUGGINGFACE_URL=.*#NEXT_PUBLIC_LLM_MODEL_HUGGINGFACE_URL=https://huggingface.co/meta-llama/Llama-2-7b-chat-hf#" .env.local
    if [ ! -z "$TELEGRAM_BOT_USERNAME" ]; then
        sed -i "s#NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=.*#NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=${TELEGRAM_BOT_USERNAME}#" .env.local
    fi
fi

echo "✅ Web app .env.local configured with your bot credentials for local development"
echo "💡 You can now run 'cd apps/web && pnpm run dev' for local development with hot reloading"

cd ../..

echo "✅ Web dashboard prepared"

# Call mobile app setup script
echo ""
echo "📱 Mobile App Environment Setup"
echo "==============================="
./setup-mobile.sh

# Vector Convert LLM Service Setup
echo ""
echo "🧠 Vector Convert LLM Service Setup"
echo "==================================="

echo "📦 Vector Convert LLM service will be built during Docker Compose startup..."
echo "   This service provides sentence embeddings using Hugging Face transformers"
echo "   Model: sentence-transformers/all-distilroberta-v1"

echo "✅ Vector Convert LLM service configured"

echo ""

# Rebuild web-dashboard to ensure it has the latest Convex generated files
echo "🔨 Rebuilding web dashboard with latest Convex files..."
docker compose build web-dashboard

# Start all services
echo "🚀 Starting all services..."
docker compose up -d

# Wait a moment for services to start
sleep 5

# Restart web-dashboard to ensure it picks up the latest environment and generated files
echo "🔄 Restarting web dashboard to apply latest changes..."
docker compose restart web-dashboard

# Wait for restart
sleep 3

# Check service status
echo "📊 Service Status:"
docker compose ps

# Re-source .env to get updated variables for final output
source .env

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📱 Your Telegram bot is now connected to Convex!"
echo "🌐 Convex Dashboard: http://localhost:6791"
echo "🖥️  Web Dashboard: http://localhost:${WEB_DASHBOARD_PORT}"
echo "🔍 API Health Check: http://localhost:3211/api/health"
echo "📨 Messages API: http://localhost:3211/api/telegram/messages"
echo ""

# Display bot URL if username is configured
if [ ! -z "$TELEGRAM_BOT_USERNAME" ] && [ "$TELEGRAM_BOT_USERNAME" != "your_bot_username_here" ]; then
    echo "🤖 Your Telegram Bot URL: https://t.me/${TELEGRAM_BOT_USERNAME}"
    echo "💬 Click the link above or search for @${TELEGRAM_BOT_USERNAME} in Telegram to start chatting!"
else
    echo "💬 Send a message to your Telegram bot to test the integration!"
fi
echo ""

echo "🐳 Docker Desktop Instructions:"
echo "=============================="
echo "1. Open Docker Desktop application on your computer"
echo "2. Navigate to the 'Containers' tab"
echo "3. Look for containers with names like:"
echo "   - telegram-bot-convex-backend-1"
echo "   - telegram-bot-telegram-bot-1"
echo "   - telegram-bot-vector-convert-llm-1"
echo "   - telegram-bot-web-dashboard-1"
echo "4. You can view logs, restart, or stop containers from there"
echo ""

echo "🗄️ Database Management:"
echo "======================="
echo "Access your Convex database web interface to:"
echo "• View and edit data in real-time"
echo "• Import/export data"
echo "• Create backups"
echo "• Manage database schema"
echo "• Monitor performance"
echo ""
echo "🔗 Database Access:"
echo "   Dashboard URL: http://localhost:6791"
echo "   Admin Key: ${ADMIN_KEY}"
echo "   Deployment URL: http://localhost:3210"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker compose logs -f"
echo "   Stop services: docker compose down"
echo "   Restart bot: docker compose restart telegram-bot"
echo "   Restart LLM service: docker compose restart vector-convert-llm"
echo "   Restart dashboard: docker compose restart web-dashboard"
echo "   View dashboard logs: docker compose logs -f web-dashboard"
echo "   View LLM service logs: docker compose logs -f vector-convert-llm"
echo ""
echo "🔍 Test the APIs:"
echo "   Convex API: curl http://localhost:3211/api/health"
echo "   Messages API: curl http://localhost:3211/api/telegram/messages"
echo "   Vector LLM API: curl http://localhost:8081/health"
echo "   Text Embedding: curl -X POST http://localhost:8081/embed -H 'Content-Type: application/json' -d '{\"text\":\"Hello world\"}'"
echo ""
echo "📱 Mobile App Commands:"
echo "======================"
echo "   Setup mobile environment: pnpm mobile:setup-env"
echo "   Setup iOS dependencies: pnpm mobile:setup-ios"
echo "   Run iOS app: pnpm mobile:ios"
echo "   Start Metro bundler: pnpm dev:mobile"
echo "   Mobile app directory: apps/mobile/"
echo "   Mobile README: apps/mobile/README.md"
echo ""
echo "🔧 Local Development Commands:"
echo "=============================="
echo "   Start web app locally: cd apps/web && pnpm run dev"
echo "   Local web app URL: http://localhost:3001 (or next available port)"
echo "   Note: .env.local has been configured with your bot credentials"
echo "   Hot reloading enabled for faster development"