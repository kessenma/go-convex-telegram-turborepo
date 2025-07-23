#!/bin/bash

# Script to calculate total RAM allocation from individual service RAM allocations in .env
# This script reads NEXT_PUBLIC_*_RAM variables and exports NEXT_PUBLIC_TOTAL_RAM_ALLOCATED

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