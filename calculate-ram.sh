#!/bin/bash

# Script to calculate total RAM allocation from individual service RAM allocations in .env
# This script reads NEXT_PUBLIC_*_RAM variables and exports NEXT_PUBLIC_TOTAL_RAM_ALLOCATED
# It also supports distributing a total RAM amount across services with --distribute flag

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
        "K"|"KB")
            echo "$(echo "$number * 1024" | bc)"
            ;;
        "")
            echo "$number"
            ;;
        *)
            echo "Unknown unit: $unit" >&2
            exit 1
            ;;
    esac
}

# Function to convert bytes back to human readable format
bytes_to_human() {
    local bytes="$1"
    local gb=$(echo "scale=3; $bytes / 1073741824" | bc)
    echo "${gb}G"
}

# Function to convert bytes to appropriate unit (M or G)
bytes_to_optimal_unit() {
    local bytes="$1"
    local gb=$(echo "scale=1; $bytes / 1073741824" | bc)
    local mb=$(echo "scale=0; $bytes / 1048576" | bc)
    
    # If >= 1GB, use GB, otherwise use MB
    if (( $(echo "$gb >= 1" | bc -l) )); then
        echo "${gb}G"
    else
        echo "${mb}M"
    fi
}

# Function to update .env variable
update_env_variable() {
    local var_name="$1"
    local value="$2"
    
    if grep -q "^${var_name}=" .env; then
        # Update existing line
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/^${var_name}=.*/${var_name}=${value}/" .env
        else
            sed -i "s/^${var_name}=.*/${var_name}=${value}/" .env
        fi
    else
        # Add new line if it doesn't exist
        echo "${var_name}=${value}" >> .env
    fi
}

# Function to distribute total RAM across services
distribute_ram() {
    local total_ram="$1"
    local total_bytes=$(convert_to_bytes "$total_ram")
    
    echo -e "${GREEN}🔄 Distributing ${total_ram} across services...${NC}"
    
    # RAM allocation percentages (optimized for RAG chatbot)
    # 50% for LLM services (main AI processing)
    # 25% for Convex backend (database and API)
    # 15% for Vector processing (embeddings)
    # 10% for other services (dashboard, bot, web)
    
    local lightweight_llm_bytes=$(echo "$total_bytes * 0.50" | bc | cut -d'.' -f1)
    local convex_backend_bytes=$(echo "$total_bytes * 0.25" | bc | cut -d'.' -f1)
    local vector_convert_bytes=$(echo "$total_bytes * 0.15" | bc | cut -d'.' -f1)
    
    # Remaining 10% split between other services
    local remaining_bytes=$(echo "$total_bytes * 0.10" | bc | cut -d'.' -f1)
    local web_dashboard_bytes=$(echo "$remaining_bytes * 0.50" | bc | cut -d'.' -f1)
    local convex_dashboard_bytes=$(echo "$remaining_bytes * 0.30" | bc | cut -d'.' -f1)
    local telegram_bot_bytes=$(echo "$remaining_bytes * 0.20" | bc | cut -d'.' -f1)
    
    # Convert to human readable format
    local lightweight_llm_ram=$(bytes_to_optimal_unit "$lightweight_llm_bytes")
    local convex_backend_ram=$(bytes_to_optimal_unit "$convex_backend_bytes")
    local vector_convert_ram=$(bytes_to_optimal_unit "$vector_convert_bytes")
    local web_dashboard_ram=$(bytes_to_optimal_unit "$web_dashboard_bytes")
    local convex_dashboard_ram=$(bytes_to_optimal_unit "$convex_dashboard_bytes")
    local telegram_bot_ram=$(bytes_to_optimal_unit "$telegram_bot_bytes")
    
    echo -e "${YELLOW}📊 Calculated RAM allocations:${NC}"
    echo -e "  🧠 Lightweight LLM (50%): ${lightweight_llm_ram}"
    echo -e "  🗄️  Convex Backend (25%): ${convex_backend_ram}"
    echo -e "  🔍 Vector Convert LLM (15%): ${vector_convert_ram}"
    echo -e "  🌐 Web Dashboard (5%): ${web_dashboard_ram}"
    echo -e "  📊 Convex Dashboard (3%): ${convex_dashboard_ram}"
    echo -e "  🤖 Telegram Bot (2%): ${telegram_bot_ram}"
    
    # Calculate reservation values (50% of limits)
    local lightweight_llm_reservation=$(bytes_to_optimal_unit $(echo "$lightweight_llm_bytes * 0.5" | bc | cut -d'.' -f1))
    local convex_backend_reservation=$(bytes_to_optimal_unit $(echo "$convex_backend_bytes * 0.5" | bc | cut -d'.' -f1))
    local vector_convert_reservation=$(bytes_to_optimal_unit $(echo "$vector_convert_bytes * 0.5" | bc | cut -d'.' -f1))
    local web_dashboard_reservation=$(bytes_to_optimal_unit $(echo "$web_dashboard_bytes * 0.5" | bc | cut -d'.' -f1))
    local convex_dashboard_reservation=$(bytes_to_optimal_unit $(echo "$convex_dashboard_bytes * 0.5" | bc | cut -d'.' -f1))
    local telegram_bot_reservation=$(bytes_to_optimal_unit $(echo "$telegram_bot_bytes * 0.5" | bc | cut -d'.' -f1))
    
    # Calculate CONVEX_MAX_RAM_MB (convert convex backend RAM to MB)
    local convex_max_ram_mb=$(echo "$convex_backend_bytes / 1048576" | bc)
    
    # Update .env file with calculated values
    echo -e "${YELLOW}📝 Updating .env file with calculated allocations...${NC}"
    update_env_variable "NEXT_PUBLIC_TOTAL_RAM_ALLOCATED" "$total_ram"
    update_env_variable "NEXT_PUBLIC_LIGHTWEIGHT_LLM_RAM" "$lightweight_llm_ram"
    update_env_variable "NEXT_PUBLIC_CONVEX_BACKEND_RAM" "$convex_backend_ram"
    update_env_variable "NEXT_PUBLIC_VECTOR_CONVERT_LLM_RAM" "$vector_convert_ram"
    update_env_variable "NEXT_PUBLIC_WEB_DASHBOARD_RAM" "$web_dashboard_ram"
    update_env_variable "NEXT_PUBLIC_CONVEX_DASHBOARD_RAM" "$convex_dashboard_ram"
    update_env_variable "NEXT_PUBLIC_TELEGRAM_BOT_RAM" "$telegram_bot_ram"
    
    # Set reservation values
    update_env_variable "NEXT_PUBLIC_LIGHTWEIGHT_LLM_RAM_RESERVATION" "$lightweight_llm_reservation"
    update_env_variable "NEXT_PUBLIC_CONVEX_BACKEND_RAM_RESERVATION" "$convex_backend_reservation"
    update_env_variable "NEXT_PUBLIC_VECTOR_CONVERT_LLM_RAM_RESERVATION" "$vector_convert_reservation"
    update_env_variable "NEXT_PUBLIC_WEB_DASHBOARD_RAM_RESERVATION" "$web_dashboard_reservation"
    update_env_variable "NEXT_PUBLIC_CONVEX_DASHBOARD_RAM_RESERVATION" "$convex_dashboard_reservation"
    update_env_variable "NEXT_PUBLIC_TELEGRAM_BOT_RAM_RESERVATION" "$telegram_bot_reservation"
    
    # Set Convex max RAM in MB
    update_env_variable "CONVEX_MAX_RAM_MB" "$convex_max_ram_mb"
    
    echo -e "${GREEN}✅ RAM distribution complete!${NC}"
    return 0
}

# Check for --distribute flag
if [ "$1" = "--distribute" ] && [ -n "$2" ]; then
    echo -e "${GREEN}🔄 RAM Distribution Mode${NC}"
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        echo -e "${RED}❌ Error: .env file not found!${NC}"
        exit 1
    fi
    
    # Check if bc is installed (for calculations)
    if ! command -v bc &> /dev/null; then
        echo -e "${RED}❌ Error: 'bc' calculator is required but not installed.${NC}"
        echo -e "${YELLOW}💡 Install with: brew install bc${NC}"
        exit 1
    fi
    
    # Distribute RAM and exit
    distribute_ram "$2"
    
    # Export the total for docker-compose
    export NEXT_PUBLIC_TOTAL_RAM_ALLOCATED="$2"
    echo -e "${YELLOW}📝 Exported NEXT_PUBLIC_TOTAL_RAM_ALLOCATED=${2}${NC}"
    exit 0
fi

echo -e "${GREEN}🔍 Calculating RAM allocation from .env variables...${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    exit 1
fi

# Check if bc is installed (for calculations)
if ! command -v bc &> /dev/null; then
    echo -e "${RED}❌ Error: 'bc' calculator is required but not installed.${NC}"
    echo -e "${YELLOW}💡 Install with: brew install bc${NC}"
    exit 1
fi

# Load .env variables (parse manually to avoid execution issues)
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ $key =~ ^#.*$ ]] && continue
    [[ -z $key ]] && continue
    # Remove quotes if present
    value=$(echo "$value" | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/")
    # Export the variable
    export "$key"="$value"
done < .env

# Extract RAM allocations from NEXT_PUBLIC_*_RAM variables
echo -e "${YELLOW}📊 Reading RAM allocations from .env variables...${NC}"

total_bytes=0
service_count=0

# List of RAM allocation variables to sum
ram_vars=(
    "NEXT_PUBLIC_CONVEX_BACKEND_RAM"
    "NEXT_PUBLIC_CONVEX_DASHBOARD_RAM"
    "NEXT_PUBLIC_TELEGRAM_BOT_RAM"
    "NEXT_PUBLIC_VECTOR_CONVERT_LLM_RAM"
    "NEXT_PUBLIC_LIGHTWEIGHT_LLM_RAM"
    "NEXT_PUBLIC_WEB_DASHBOARD_RAM"
)

# Calculate total from individual service allocations
for var_name in "${ram_vars[@]}"; do
    # Use eval to get the value of the variable
    memory_value=$(eval echo \$${var_name})
    if [ -n "$memory_value" ]; then
        service_bytes=$(convert_to_bytes "$memory_value")
        total_bytes=$(echo "$total_bytes + $service_bytes" | bc)
        service_count=$((service_count + 1))
        echo -e "  📦 ${var_name}: ${memory_value}"
    fi
done

if [ "$service_count" -eq 0 ]; then
    echo -e "${RED}❌ No memory limits found in docker-compose.yaml${NC}"
    exit 1
fi

# Convert total back to human readable
total_ram=$(bytes_to_human "$total_bytes")

echo -e "${GREEN}✅ Total RAM allocated: ${total_ram} (from ${service_count} services)${NC}"

# Export the calculated value for current session (used by docker-compose)
echo -e "${YELLOW}📝 Exporting NEXT_PUBLIC_TOTAL_RAM_ALLOCATED=${total_ram}${NC}"
export NEXT_PUBLIC_TOTAL_RAM_ALLOCATED="$total_ram"

echo -e "${GREEN}🎉 RAM calculation complete!${NC}"
echo -e "${YELLOW}💡 NEXT_PUBLIC_TOTAL_RAM_ALLOCATED is now available for docker-compose.${NC}"
echo -e "${YELLOW}💡 To use: source ./calculate-ram.sh && docker-compose up${NC}"