#!/bin/bash

# Self-Hosted Llama ML RAG Chatbot Setup Script
# This script automates the setup of a complete RAG (Retrieval-Augmented Generation) system
# For detailed manual setup instructions, see: https://github.com/your-repo/SETUP.md

set -e  # Exit on any error

# =============================================================================
# DOCKER INSTALLATION CHECK
# =============================================================================
echo "🐳 Checking Docker Installation"
echo "=============================="

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed on your system."
    echo ""
    echo "📋 Docker is required to run this self-hosted RAG chatbot."
    echo "   This application uses Docker containers to isolate and manage:"
    echo "   • Llama language models"
    echo "   • Vector databases"
    echo "   • Convex backend services"
    echo "   • Web dashboard and Telegram bot"
    echo ""
    echo "🔗 Please install Docker for your operating system:"
    echo ""
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   macOS: https://docs.docker.com/desktop/install/mac-install/"
        echo "   💡 Tip: Docker Desktop for Mac includes Docker Compose"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "   Linux: https://docs.docker.com/engine/install/"
        echo "   💡 Don't forget to install Docker Compose: https://docs.docker.com/compose/install/"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "   Windows: https://docs.docker.com/desktop/install/windows-install/"
        echo "   💡 Tip: Docker Desktop for Windows includes Docker Compose"
    else
        echo "   General: https://docs.docker.com/get-docker/"
    fi
    echo ""
    echo "⚡ After installing Docker:"
    echo "   1. Start Docker Desktop (or Docker service on Linux)"
    echo "   2. Verify installation with: docker --version"
    echo "   3. Re-run this setup script"
    echo ""
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is installed but not running."
    echo ""
    echo "🚀 Please start Docker and try again:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   • Open Docker Desktop from Applications"
        echo "   • Wait for Docker to start (whale icon in menu bar)"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "   • Start Docker service: sudo systemctl start docker"
        echo "   • Enable auto-start: sudo systemctl enable docker"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "   • Open Docker Desktop from Start Menu"
        echo "   • Wait for Docker to start"
    fi
    echo ""
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null && ! docker-compose --version &> /dev/null; then
    echo "❌ Docker Compose is not available."
    echo ""
    echo "📋 Docker Compose is required to orchestrate multiple containers."
    echo "🔗 Install Docker Compose: https://docs.docker.com/compose/install/"
    echo ""
    echo "💡 Note: Docker Desktop includes Docker Compose automatically."
    echo ""
    exit 1
fi

echo "✅ Docker is installed and running"
echo "✅ Docker Compose is available"
echo ""

echo "🤖 Self-Hosted Llama ML RAG Chatbot Setup"
echo "==========================================="
echo "Welcome to the open-source self-hosted RAG chatbot setup!"
echo ""
echo "🎯 What You're Building:"
echo "This setup creates a complete AI chatbot system that runs entirely on your machine:"
echo "  • 🧠 Llama language model for intelligent responses"
echo "  • 🔍 Vector search for retrieving relevant information"
echo "  • 💬 Telegram bot interface for easy chatting"
echo "  • 🌐 Web dashboard for monitoring and management"
echo "  • 🗄️ Real-time database for conversation storage"
echo ""
echo "🔒 Privacy & Control:"
echo "  • Everything runs locally on your hardware"
echo "  • No data sent to external AI services"
echo "  • Full control over your conversations and data"
echo "  • Open source and customizable"
echo ""
echo "⚡ What This Script Does:"
echo "  • Configures optimal RAM allocation for all services"
echo "  • Sets up Docker containers for each component"
echo "  • Connects your Telegram bot to the AI system"
echo "  • Deploys the web dashboard for easy management"
echo ""
echo "📋 Prerequisites:"
echo "  • Docker and Docker Compose installed"
echo "  • At least 4GB RAM (8GB+ recommended)"
echo "     • optional"
echo "     • Telegram bot token from @BotFather"
echo ""
echo "Let's get started! 🤖"
echo ""

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
    echo "📤 Telegram Bot Token Setup (Optional)"
    echo "======================================"
    echo "💡 You can run this RAG system in two modes:"
    echo "   1. With Telegram integration (requires bot token)"
    echo "   2. Web-only mode (skip Telegram, use web dashboard only)"
    echo ""
    echo "🔑 To get a Telegram bot token:"
    echo "   • Message @BotFather on Telegram: https://t.me/botfather"
    echo "   • Follow the prompts to create a new bot"
    echo "   • Copy the token it provides"
    echo ""
    echo "⚠️ Note: Without a token, Telegram features won't work, but you can still:"
    echo "   • Use the web dashboard at http://localhost:3000"
    echo "   • Test the LLM and vector search APIs"
    echo "   • Add the token later by editing the .env file"
    echo ""
    read -p "Do you want to enter your Telegram bot token now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        read -p "Enter your Telegram bot token: " TELEGRAM_TOKEN_INPUT
        
        if [ -z "$TELEGRAM_TOKEN_INPUT" ]; then
            echo "❌ No token provided. Setting to empty for web-only mode..."
            TELEGRAM_TOKEN_INPUT=""
        fi
        
        # Update the .env file with the provided token
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/TELEGRAM_TOKEN=.*/TELEGRAM_TOKEN=$TELEGRAM_TOKEN_INPUT/" .env
        else
            # Linux
            sed -i "s/TELEGRAM_TOKEN=.*/TELEGRAM_TOKEN=$TELEGRAM_TOKEN_INPUT/" .env
        fi
        
        if [ -n "$TELEGRAM_TOKEN_INPUT" ]; then
            echo "✅ Telegram token saved to .env file"
        else
            echo "✅ Telegram token set to empty (web-only mode)"
        fi
        
        # Re-source the .env file to get the updated token
        source .env
    else
        echo "⏭️ Skipping Telegram token setup. Setting to empty for web-only mode..."
        echo "   You can add your token later by editing the .env file"
        
        # Set empty token for web-only mode
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/TELEGRAM_TOKEN=.*/TELEGRAM_TOKEN=/" .env
        else
            # Linux
            sed -i "s/TELEGRAM_TOKEN=.*/TELEGRAM_TOKEN=/" .env
        fi
        
        # Re-source the .env file
        source .env
        TELEGRAM_TOKEN=""
    fi
fi

if [ -n "$TELEGRAM_TOKEN" ]; then
    echo "✅ TELEGRAM_TOKEN is configured"
else
    echo "✅ TELEGRAM_TOKEN is empty (web-only mode)"
fi

# Check if TELEGRAM_BOT_USERNAME is set
source .env
if [ -z "$TELEGRAM_BOT_USERNAME" ] || [ "$TELEGRAM_BOT_USERNAME" = "your_bot_username_here" ]; then
    echo ""
    echo "🤖 Telegram Bot Username Setup (Optional)"
    echo "==========================================="
    
    # Only prompt for username if we have a token
    if [ -n "$TELEGRAM_TOKEN" ]; then
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
                 echo "❌ No username provided. Setting default placeholder..."
                 TELEGRAM_BOT_USERNAME_INPUT="not-available-enter-in-env-file"
             fi
         else
             echo "⏭️ Skipping bot username setup. Setting default placeholder..."
             TELEGRAM_BOT_USERNAME_INPUT="not-available-enter-in-env-file"
         fi
     else
         echo "⏭️ Skipping bot username setup (no Telegram token provided)"
         echo "   Setting default placeholder value..."
         TELEGRAM_BOT_USERNAME_INPUT="not-available-enter-in-env-file"
    fi
    
    # Update the .env file with the provided username or placeholder
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
    
    if [ "$TELEGRAM_BOT_USERNAME_INPUT" = "not-available-enter-in-env-file" ]; then
         echo "✅ Telegram bot username set to placeholder (can be updated in .env file later)"
     else
         echo "✅ Telegram bot username saved to .env file"
     fi
    
    # Re-source the .env file to get the updated username
    source .env
fi

if [ "$TELEGRAM_BOT_USERNAME" = "not-available-enter-in-env-file" ]; then
     echo "✅ TELEGRAM_BOT_USERNAME is set to placeholder (update in .env file when ready)"
 else
     echo "✅ TELEGRAM_BOT_USERNAME is configured"
 fi

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

# =============================================================================
# SYSTEM RESOURCES CONFIGURATION
# =============================================================================
echo ""
echo "💾 System Resources Configuration"
echo "================================="
echo "🎓 Understanding RAM Allocation for Self-Hosted RAG Systems"
echo "=========================================================="
echo "This self-hosted Llama ML RAG (Retrieval-Augmented Generation) application"
echo "consists of multiple Docker services that work together to provide AI chat capabilities:"
echo ""
echo "🧠 Core AI Services:"
echo "  • Lightweight LLM (50% of RAM) - Main language model for chat responses"
echo "  • Vector Convert LLM (15% of RAM) - Converts text to embeddings for search"
echo ""
echo "🗄️ Backend Services:"
echo "  • Convex Backend (25% of RAM) - Real-time database and API server"
echo "  • Convex Dashboard (4% of RAM) - Database management interface"
echo ""
echo "🌐 Interface Services:"
echo "  • Web Dashboard (8% of RAM) - Web UI for monitoring and chat"
echo "  • Telegram Bot (3% of RAM) - Telegram integration service"
echo ""
echo "📊 RAM Variables Explained:"
echo "  • NEXT_PUBLIC_RAM_AVAILABLE: Total physical RAM on your machine"
echo "  • NEXT_PUBLIC_TOTAL_RAM_ALLOCATED: How much you want to dedicate to this app"
echo "  • Individual service RAM: Automatically calculated from total allocation"
echo ""
echo "💡 Recommended Minimum Requirements:"
echo "  • 4GB RAM: Basic setup (may be slow)"
echo "  • 8GB RAM: Recommended for good performance"
echo "  • 16GB+ RAM: Optimal for production use"
echo ""
echo "⚠️ Important Notes:"
echo "  • The system will warn you if you allocate more RAM than available"
echo "  • You can always adjust these values later in the .env file"
echo "  • LLM services need the most RAM for AI model inference"
echo ""

# Check if NEXT_PUBLIC_TOTAL_RAM_ALLOCATED is already set
source .env
if [ -z "$NEXT_PUBLIC_TOTAL_RAM_ALLOCATED" ] || [ "$NEXT_PUBLIC_TOTAL_RAM_ALLOCATED" = "" ]; then
    echo "🧠 RAG Chatbot RAM Allocation Setup"
    echo "==================================="
    echo "Now let's configure how much RAM to allocate for your self-hosted RAG system."
    echo ""
    echo "💭 How This Works:"
    echo "You specify a total amount, and the system automatically distributes it optimally:"
    echo "  • 50% → LLM services (the 'brain' that generates responses)"
    echo "  • 25% → Convex backend (database that stores your conversations)"
    echo "  • 15% → Vector processing (converts text to searchable embeddings)"
    echo "  • 10% → Interface services (web dashboard, Telegram bot, admin tools)"
    echo ""
    echo "📏 Sizing Guidelines:"
    echo "  • 4: Minimal setup, slower responses, good for testing"
    echo "  • 8: Balanced performance, recommended for personal use"
    echo "  • 16: Fast responses, good for small teams"
    echo "  • 32+: Production-ready, handles multiple concurrent users"
    echo ""
    echo "💡 Pro Tip: You can always change this later by editing the .env file!"
    echo ""
    while true; do
        read -p "Enter total RAM to allocate in GB (e.g., 8 or 4.5): " TOTAL_RAM_INPUT
        
        if [ -z "$TOTAL_RAM_INPUT" ]; then
            echo "❌ No RAM amount provided. Using default 8GB allocation..."
            TOTAL_RAM_INPUT="8"
            break
        elif [[ "$TOTAL_RAM_INPUT" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
            # Valid format: number or decimal number
            break
        else
            echo "❌ Invalid RAM format. Please enter a number (e.g., 8, 4.5, 16)."
            echo "   Examples: 4, 8, 16, 32, 4.5, 12.8"
            continue
        fi
    done
    
    # Convert the number to GB format for internal use
    TOTAL_RAM_INPUT="${TOTAL_RAM_INPUT}G"
    
    echo "✅ Total RAM allocation set to: $TOTAL_RAM_INPUT"
    
    # Update the .env file with the total RAM allocation
    if grep -q "^NEXT_PUBLIC_TOTAL_RAM_ALLOCATED=" .env; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/^NEXT_PUBLIC_TOTAL_RAM_ALLOCATED=.*/NEXT_PUBLIC_TOTAL_RAM_ALLOCATED=$TOTAL_RAM_INPUT/" .env
        else
            sed -i "s/^NEXT_PUBLIC_TOTAL_RAM_ALLOCATED=.*/NEXT_PUBLIC_TOTAL_RAM_ALLOCATED=$TOTAL_RAM_INPUT/" .env
        fi
    else
        echo "NEXT_PUBLIC_TOTAL_RAM_ALLOCATED=$TOTAL_RAM_INPUT" >> .env
    fi
    
    # Re-source to get the updated value
    source .env
    
    echo "🔄 Calculating individual service RAM allocations..."
    # Call the calculate-ram.sh script to distribute RAM
    if [ -f "./calculate-ram.sh" ]; then
        chmod +x ./calculate-ram.sh
        source ./calculate-ram.sh --distribute "$TOTAL_RAM_INPUT"
    else
        echo "⚠️  Warning: calculate-ram.sh not found. Using default allocations."
    fi
else
    echo "✅ Total RAM allocation already configured: $NEXT_PUBLIC_TOTAL_RAM_ALLOCATED"
    echo "💡 Individual service allocations will be calculated from this total."
fi

echo ""
echo "💡 You can modify these values in the .env file after setup."
echo "   Once set, this script will not overwrite your custom values."
echo ""

# Function to set RAM variable if not already configured
set_ram_variable() {
    local var_name="$1"
    local default_value="$2"
    local description="$3"
    
    # Check if variable exists and is not empty
    if ! grep -q "^${var_name}=" .env || [ "$(grep "^${var_name}=" .env | cut -d'=' -f2)" = "" ]; then
        echo "📝 Setting ${description}: ${default_value}"
        if grep -q "^${var_name}=" .env; then
            # Update existing empty line
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/^${var_name}=.*/${var_name}=${default_value}/" .env
            else
                sed -i "s/^${var_name}=.*/${var_name}=${default_value}/" .env
            fi
        else
            # Add new line if it doesn't exist
            echo "${var_name}=${default_value}" >> .env
        fi
    else
        local current_value=$(grep "^${var_name}=" .env | cut -d'=' -f2)
        echo "✅ ${description} already configured: ${current_value}"
    fi
}

# Set RAM allocation variables with defaults
set_ram_variable "NEXT_PUBLIC_RAM_AVAILABLE" "8G" "Total RAM Available"
set_ram_variable "NEXT_PUBLIC_CONVEX_BACKEND_RAM" "1.5G" "Convex Backend RAM"
set_ram_variable "NEXT_PUBLIC_CONVEX_DASHBOARD_RAM" "256M" "Convex Dashboard RAM"
set_ram_variable "NEXT_PUBLIC_TELEGRAM_BOT_RAM" "128M" "Telegram Bot RAM"
set_ram_variable "NEXT_PUBLIC_VECTOR_CONVERT_LLM_RAM" "2G" "Vector Convert LLM RAM"
set_ram_variable "NEXT_PUBLIC_LIGHTWEIGHT_LLM_RAM" "4G" "Lightweight LLM RAM"
set_ram_variable "NEXT_PUBLIC_WEB_DASHBOARD_RAM" "512M" "Web Dashboard RAM"

# Set LLM service ports if not configured
set_ram_variable "LIGHTWEIGHT_LLM_PORT" "8082" "Lightweight LLM Port"
set_ram_variable "VECTOR_CONVERT_PORT" "7999" "Vector Convert Port"

# Set model configuration variables if not configured
set_ram_variable "NEXT_PUBLIC_VECTOR_CONVERT_MODEL" "\"all-MiniLM-L6-v2\"" "Vector Convert Model"
set_ram_variable "NEXT_PUBLIC_VECTOR_CONVERT_MODEL_HUGGINGFACE_URL" "\"https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2\"" "Vector Convert Model URL"
set_ram_variable "NEXT_PUBLIC_LLM_MODEL" "\"Meta Llama 3.2\"" "LLM Model"
set_ram_variable "NEXT_PUBLIC_LLM_MODEL_HUGGINGFACE_URL" "\"https://huggingface.co/meta-llama/Llama-2-7b-chat-hf\"" "LLM Model URL"

# Re-source the .env file to get updated variables
source .env

echo "✅ System resources configuration complete"
echo "💡 Total allocated RAM will be calculated dynamically by calculate-ram.sh"
echo ""

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
echo "🔍 Testing Convex backend health..."
for attempt in {1..10}; do
    if curl -f http://localhost:3210/version > /dev/null 2>&1; then
        echo "✅ Convex backend is healthy (attempt $attempt)"
        break
    else
        echo "⏳ Attempt $attempt failed, retrying in 2 seconds..."
        if [ $attempt -eq 10 ]; then
            echo "❌ Convex backend is not responding after 10 attempts. Check logs with: docker compose logs convex-backend"
            echo "💡 You can continue manually by running the rest of the setup commands"
            exit 1
        fi
        sleep 2
    fi
done

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

# Configure .env.docker for production deployment
echo "⚙️ Configuring Docker environment for production deployment..."
cp .env.docker.example .env.docker
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s#CONVEX_INSTANCE_SECRET=.*#CONVEX_INSTANCE_SECRET=${CONVEX_INSTANCE_SECRET:-0000000000000000000000000000000000000000000000000000000000000000}#" .env.docker
else
    # Linux
    sed -i "s#CONVEX_INSTANCE_SECRET=.*#CONVEX_INSTANCE_SECRET=${CONVEX_INSTANCE_SECRET:-0000000000000000000000000000000000000000000000000000000000000000}#" .env.docker
fi
echo "✅ Docker environment configured for production deployment"

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
    sed -i '' "s#VECTOR_CONVERT_LLM_URL=.*#VECTOR_CONVERT_LLM_URL=http://localhost:7999#" .env.local
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
    sed -i "s#VECTOR_CONVERT_LLM_URL=.*#VECTOR_CONVERT_LLM_URL=http://localhost:7999#" .env.local
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
./helper-scripts/setup-mobile.sh

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
if [ ! -z "$TELEGRAM_TOKEN" ] && [ "$TELEGRAM_TOKEN" != "your_telegram_bot_token_here" ]; then
    echo "📱 Starting all services including Telegram bot..."
    docker compose --profile telegram up -d
else
    echo "📱 Starting services without Telegram bot (no token provided)..."
    docker compose up -d
fi

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
if [ ! -z "$TELEGRAM_TOKEN" ] && [ "$TELEGRAM_TOKEN" != "your_telegram_bot_token_here" ]; then
    echo "📱 Your Telegram bot is now connected to Convex!"
else
    echo "📱 Telegram bot is in standby mode (no token provided)"
    echo "   To enable the bot, add your TELEGRAM_TOKEN to .env and restart with:"
    echo "   docker compose --profile telegram up -d telegram-bot"
fi
echo "🌐 Convex Dashboard: http://localhost:6791"
echo "🖥️  Web Dashboard: http://localhost:${WEB_DASHBOARD_PORT}"
echo "🔍 API Health Check: http://localhost:3211/api/health"
echo "📨 Messages API: http://localhost:3211/api/telegram/messages"
echo ""

# Display bot URL if username is configured and token is provided
if [ ! -z "$TELEGRAM_TOKEN" ] && [ "$TELEGRAM_TOKEN" != "your_telegram_bot_token_here" ]; then
    if [ ! -z "$TELEGRAM_BOT_USERNAME" ] && [ "$TELEGRAM_BOT_USERNAME" != "your_bot_username_here" ]; then
        echo "🤖 Your Telegram Bot URL: https://t.me/${TELEGRAM_BOT_USERNAME}"
        echo "💬 Click the link above or search for @${TELEGRAM_BOT_USERNAME} in Telegram to start chatting!"
    else
        echo "💬 Send a message to your Telegram bot to test the integration!"
    fi
else
    echo "💬 Telegram bot is not running. Add TELEGRAM_TOKEN to .env to enable it."
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
if [ ! -z "$TELEGRAM_TOKEN" ] && [ "$TELEGRAM_TOKEN" != "your_telegram_bot_token_here" ]; then
    echo "   Restart bot: docker compose restart telegram-bot"
else
    echo "   Start bot (if token added): docker compose --profile telegram up -d telegram-bot"
fi
echo "   Restart LLM service: docker compose restart vector-convert-llm"
echo "   Restart dashboard: docker compose restart web-dashboard"
echo "   View dashboard logs: docker compose logs -f web-dashboard"
echo "   View LLM service logs: docker compose logs -f vector-convert-llm"
echo ""
echo "🔍 Test the APIs:"
echo "   Convex API: curl http://localhost:3211/api/health"
echo "   Messages API: curl http://localhost:3211/api/telegram/messages"
echo "   Vector LLM API: curl http://localhost:7999/health"
echo "   Text Embedding: curl -X POST http://localhost:7999/embed -H 'Content-Type: application/json' -d '{\"text\":\"Hello world\"}'"
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