#!/bin/bash

# Generate Environment Variables for Coolify Deployment
# This script helps you calculate optimal RAM allocations for your production environment
# Copy the output to your Coolify environment variables

set -e

echo "🚀 Coolify Environment Variable Generator"
echo "========================================="
echo ""

# Check if bc is installed
if ! command -v bc &> /dev/null; then
    echo "❌ Error: 'bc' calculator is required but not installed."
    echo "💡 Install with: brew install bc (macOS) or apt-get install bc (Ubuntu)"
    exit 1
fi

# Function to convert memory values to bytes
convert_to_bytes() {
    local value="$1"
    local number=$(echo "$value" | sed 's/[^0-9.]//g')
    local unit=$(echo "$value" | sed 's/[0-9.]//g' | tr '[:lower:]' '[:upper:]')
    
    case "$unit" in
        "G"|"GB")
            echo "$(echo "$number * 1073741824" | bc)"
            ;;
        "M"|"MB")
            echo "$(echo "$number * 1048576" | bc)"
            ;;
        *)
            echo "Unknown unit: $unit" >&2
            exit 1
            ;;
    esac
}

# Function to convert bytes to optimal unit
bytes_to_optimal_unit() {
    local bytes="$1"
    local gb=$(echo "scale=1; $bytes / 1073741824" | bc)
    local mb=$(echo "scale=0; $bytes / 1048576" | bc)
    
    if (( $(echo "$gb >= 1" | bc -l) )); then
        echo "${gb}G"
    else
        echo "${mb}M"
    fi
}

# Get total RAM input
echo "💾 RAM Allocation for Production Deployment"
echo "==========================================="
echo ""
echo "How much total RAM do you want to allocate for your RAG chatbot system?"
echo "Examples: 4G, 8G, 16G, 32G"
echo ""
read -p "Enter total RAM allocation: " TOTAL_RAM

if [ -z "$TOTAL_RAM" ]; then
    echo "❌ No RAM amount provided. Using default 8G..."
    TOTAL_RAM="8G"
fi

# Validate format
if ! [[ "$TOTAL_RAM" =~ ^[0-9]+(\.[0-9]+)?[GM]$ ]]; then
    echo "❌ Invalid format. Please use format like 8G or 4G"
    exit 1
fi

echo ""
echo "🧮 Calculating optimal RAM distribution..."
echo ""

# Convert to bytes for calculation
total_bytes=$(convert_to_bytes "$TOTAL_RAM")

# Calculate allocations (optimized for RAG workloads)
lightweight_llm_bytes=$(echo "$total_bytes * 0.50" | bc | cut -d'.' -f1)
convex_backend_bytes=$(echo "$total_bytes * 0.25" | bc | cut -d'.' -f1)
vector_convert_bytes=$(echo "$total_bytes * 0.15" | bc | cut -d'.' -f1)
remaining_bytes=$(echo "$total_bytes * 0.10" | bc | cut -d'.' -f1)
web_dashboard_bytes=$(echo "$remaining_bytes * 0.50" | bc | cut -d'.' -f1)
convex_dashboard_bytes=$(echo "$remaining_bytes * 0.30" | bc | cut -d'.' -f1)
telegram_bot_bytes=$(echo "$remaining_bytes * 0.20" | bc | cut -d'.' -f1)

# Convert to human readable
lightweight_llm_ram=$(bytes_to_optimal_unit "$lightweight_llm_bytes")
convex_backend_ram=$(bytes_to_optimal_unit "$convex_backend_bytes")
vector_convert_ram=$(bytes_to_optimal_unit "$vector_convert_bytes")
web_dashboard_ram=$(bytes_to_optimal_unit "$web_dashboard_bytes")
convex_dashboard_ram=$(bytes_to_optimal_unit "$convex_dashboard_bytes")
telegram_bot_ram=$(bytes_to_optimal_unit "$telegram_bot_bytes")

# Calculate reservations (50% of limits)
lightweight_llm_reservation=$(bytes_to_optimal_unit $(echo "$lightweight_llm_bytes * 0.5" | bc | cut -d'.' -f1))
convex_backend_reservation=$(bytes_to_optimal_unit $(echo "$convex_backend_bytes * 0.5" | bc | cut -d'.' -f1))
vector_convert_reservation=$(bytes_to_optimal_unit $(echo "$vector_convert_bytes * 0.5" | bc | cut -d'.' -f1))
web_dashboard_reservation=$(bytes_to_optimal_unit $(echo "$web_dashboard_bytes * 0.5" | bc | cut -d'.' -f1))
convex_dashboard_reservation=$(bytes_to_optimal_unit $(echo "$convex_dashboard_bytes * 0.5" | bc | cut -d'.' -f1))
telegram_bot_reservation=$(bytes_to_optimal_unit $(echo "$telegram_bot_bytes * 0.5" | bc | cut -d'.' -f1))

# Calculate CONVEX_MAX_RAM_MB
convex_max_ram_mb=$(echo "$convex_backend_bytes / 1048576" | bc)

echo "📊 Calculated RAM Distribution:"
echo "==============================="
echo "🧠 Lightweight LLM (50%): $lightweight_llm_ram"
echo "🗄️  Convex Backend (25%): $convex_backend_ram"
echo "🔍 Vector Convert LLM (15%): $vector_convert_ram"
echo "🌐 Web Dashboard (5%): $web_dashboard_ram"
echo "📊 Convex Dashboard (3%): $convex_dashboard_ram"
echo "🤖 Telegram Bot (2%): $telegram_bot_ram"
echo ""

echo "📋 COPY THESE ENVIRONMENT VARIABLES TO COOLIFY:"
echo "==============================================="
echo ""
echo "# RAM Allocation Variables"
echo "NEXT_PUBLIC_TOTAL_RAM_ALLOCATED=$TOTAL_RAM"
echo "NEXT_PUBLIC_RAM_AVAILABLE=$TOTAL_RAM"
echo ""
echo "# Service RAM Limits"
echo "NEXT_PUBLIC_LIGHTWEIGHT_LLM_RAM=$lightweight_llm_ram"
echo "NEXT_PUBLIC_CONVEX_BACKEND_RAM=$convex_backend_ram"
echo "NEXT_PUBLIC_VECTOR_CONVERT_LLM_RAM=$vector_convert_ram"
echo "NEXT_PUBLIC_WEB_DASHBOARD_RAM=$web_dashboard_ram"
echo "NEXT_PUBLIC_CONVEX_DASHBOARD_RAM=$convex_dashboard_ram"
echo "NEXT_PUBLIC_TELEGRAM_BOT_RAM=$telegram_bot_ram"
echo ""
echo "# Service RAM Reservations"
echo "NEXT_PUBLIC_LIGHTWEIGHT_LLM_RAM_RESERVATION=$lightweight_llm_reservation"
echo "NEXT_PUBLIC_CONVEX_BACKEND_RAM_RESERVATION=$convex_backend_reservation"
echo "NEXT_PUBLIC_VECTOR_CONVERT_LLM_RAM_RESERVATION=$vector_convert_reservation"
echo "NEXT_PUBLIC_WEB_DASHBOARD_RAM_RESERVATION=$web_dashboard_reservation"
echo "NEXT_PUBLIC_CONVEX_DASHBOARD_RAM_RESERVATION=$convex_dashboard_reservation"
echo "NEXT_PUBLIC_TELEGRAM_BOT_RAM_RESERVATION=$telegram_bot_reservation"
echo ""
echo "# Convex Configuration"
echo "CONVEX_MAX_RAM_MB=$convex_max_ram_mb"
echo ""

echo "🔧 COOLIFY DEPLOYMENT STEPS:"
echo "============================"
echo "1. Go to your Coolify project environment variables"
echo "2. Copy and paste the variables above"
echo "3. Add your other required variables:"
echo "   - TELEGRAM_TOKEN=your_actual_token"
echo "   - TELEGRAM_BOT_USERNAME=your_bot_username"
echo "   - CONVEX_INSTANCE_SECRET=your_secure_secret"
echo "4. Deploy your application"
echo ""

echo "💡 IMPORTANT NOTES:"
echo "=================="
echo "• Make sure your server has at least $TOTAL_RAM of available RAM"
echo "• The Convex backend health check now has a 30s start period"
echo "• Monitor your deployment logs for any memory-related issues"
echo "• You can adjust these values in Coolify if needed"
echo ""