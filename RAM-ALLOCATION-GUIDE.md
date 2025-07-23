# RAM Allocation Management Guide

This guide explains how the dynamic RAM allocation system works in this Docker Compose project.

## Overview

The system calculates total RAM allocation dynamically from individual service configurations in the `.env` file, rather than hardcoding values. This provides better flexibility for deployment across different environments.

## How It Works

### 1. Individual Service RAM Configuration

RAM allocations for each service are defined in the `.env` file using `NEXT_PUBLIC_*_RAM` variables:

```bash
# Individual service RAM allocations (used for calculation)
# These values should match the memory limits in docker-compose.yaml
NEXT_PUBLIC_CONVEX_BACKEND_RAM=2G
NEXT_PUBLIC_CONVEX_DASHBOARD_RAM=256M
NEXT_PUBLIC_TELEGRAM_BOT_RAM=128M
NEXT_PUBLIC_VECTOR_CONVERT_LLM_RAM=2G
NEXT_PUBLIC_LIGHTWEIGHT_LLM_RAM=6G
NEXT_PUBLIC_WEB_DASHBOARD_RAM=1G

# Total RAM available on the host machine (for display in UI)
NEXT_PUBLIC_RAM_AVAILABLE=8G
```

### 2. Dynamic Calculation Script

The `calculate-ram.sh` script:
- Reads individual service RAM allocations from `.env`
- Calculates the total RAM allocation
- Exports `NEXT_PUBLIC_TOTAL_RAM_ALLOCATED` as an environment variable
- Makes the calculated value available to Docker Compose

### 3. Docker Compose Integration

The `docker-compose.yaml` uses the dynamically calculated value:

```yaml
environment:
  - NEXT_PUBLIC_TOTAL_RAM_ALLOCATED=${NEXT_PUBLIC_TOTAL_RAM_ALLOCATED}
  - NEXT_PUBLIC_RAM_AVAILABLE=${NEXT_PUBLIC_RAM_AVAILABLE:-8G}
```

## Usage

### Method 1: Using npm scripts (Recommended)

```bash
# Start services with dynamic RAM calculation
npm run docker:up

# Build and start services with dynamic RAM calculation
npm run docker:build
```

### Method 2: Manual execution

```bash
# Calculate RAM and start services
source ./calculate-ram.sh && docker-compose up -d

# Calculate RAM and build services
source ./calculate-ram.sh && docker-compose up -d --build
```

### Method 3: Check calculation only

```bash
# Just run the calculation to see the result
source ./calculate-ram.sh
echo "Total RAM: $NEXT_PUBLIC_TOTAL_RAM_ALLOCATED"
```

## Configuration

### Adjusting Service RAM Allocations

1. **Edit `.env` file**: Update the `NEXT_PUBLIC_*_RAM` variables to match your requirements
2. **Update `docker-compose.yaml`**: Ensure the memory limits in docker-compose.yaml match your .env values
3. **Set available RAM**: Update `NEXT_PUBLIC_RAM_AVAILABLE` to match your host machine's total RAM

### Example Configuration for Different Environments

#### Development Environment (8GB RAM)
```bash
NEXT_PUBLIC_CONVEX_BACKEND_RAM=1G
NEXT_PUBLIC_CONVEX_DASHBOARD_RAM=128M
NEXT_PUBLIC_TELEGRAM_BOT_RAM=64M
NEXT_PUBLIC_VECTOR_CONVERT_LLM_RAM=1G
NEXT_PUBLIC_LIGHTWEIGHT_LLM_RAM=3G
NEXT_PUBLIC_WEB_DASHBOARD_RAM=512M
NEXT_PUBLIC_RAM_AVAILABLE=8G
```

#### Production Environment (16GB RAM)
```bash
NEXT_PUBLIC_CONVEX_BACKEND_RAM=4G
NEXT_PUBLIC_CONVEX_DASHBOARD_RAM=512M
NEXT_PUBLIC_TELEGRAM_BOT_RAM=256M
NEXT_PUBLIC_VECTOR_CONVERT_LLM_RAM=4G
NEXT_PUBLIC_LIGHTWEIGHT_LLM_RAM=6G
NEXT_PUBLIC_WEB_DASHBOARD_RAM=2G
NEXT_PUBLIC_RAM_AVAILABLE=16G
```

## Web Dashboard Integration

The web dashboard displays:
- **RAM Allocated**: Total calculated RAM allocation
- **RAM Available**: Host machine's total RAM
- **RAM Usage**: Percentage calculation with color coding:
  - 🟢 Green: ≤80% usage
  - 🟡 Yellow: >80% and ≤100% usage
  - 🔴 Red: >100% usage (overcommit)

## Benefits

1. **No Hardcoding**: RAM values are not hardcoded in docker-compose.yaml
2. **Environment Flexibility**: Easy to adjust for different deployment environments
3. **Client-Side Visibility**: All values are `NEXT_PUBLIC_*` variables, making them available in the web UI
4. **Automatic Calculation**: Total RAM is calculated automatically from individual services
5. **Deployment Safety**: Prevents deploying with outdated hardcoded values

## Troubleshooting

### Script Fails to Run
- Ensure the script is executable: `chmod +x calculate-ram.sh`
- Check that `bc` calculator is installed: `brew install bc`
- Verify `.env` file exists and contains the required variables

### Incorrect RAM Calculation
- Verify that `.env` values match `docker-compose.yaml` memory limits
- Check that all `NEXT_PUBLIC_*_RAM` variables are properly set
- Ensure memory values use correct units (G, M, K)

### Docker Compose Issues
- Make sure to use `source ./calculate-ram.sh` before `docker-compose`
- Verify that `NEXT_PUBLIC_TOTAL_RAM_ALLOCATED` is exported in your shell
- Check docker-compose.yaml syntax for environment variables

## Script Details

The `calculate-ram.sh` script:
- Supports memory units: G/GB, M/MB, K/KB, bytes
- Converts all values to bytes for accurate calculation
- Converts final result back to human-readable format
- Provides colored output for better visibility
- Exports the result for use by docker-compose

## Best Practices

1. **Keep .env and docker-compose.yaml in sync**: Ensure memory limits match between files
2. **Test before deployment**: Run the calculation script to verify total allocation
3. **Monitor resource usage**: Use the web dashboard to track actual vs allocated RAM
4. **Document changes**: Update this guide when modifying the RAM allocation system
5. **Environment-specific configs**: Use different .env files for different environments