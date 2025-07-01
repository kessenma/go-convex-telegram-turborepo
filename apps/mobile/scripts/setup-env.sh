#!/bin/bash

# Mobile App Environment Setup Script
# This script creates a .env file from .env.example for the mobile app

set -e  # Exit on any error

echo "📱 Mobile App Environment Setup"
echo "================================"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"

# Check if .env.example exists
if [ ! -f "$MOBILE_DIR/.env.example" ]; then
    echo "❌ .env.example file not found in $MOBILE_DIR"
    echo "   Please ensure .env.example exists before running this script."
    exit 1
fi

# Check if .env file already exists
if [ -f "$MOBILE_DIR/.env" ]; then
    echo "⚠️  .env file already exists in mobile app directory"
    read -p "Do you want to overwrite it? (y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Existing .env file preserved."
        exit 1
    fi
fi

# Copy .env.example to .env
echo "📝 Creating .env file from .env.example..."
cp "$MOBILE_DIR/.env.example" "$MOBILE_DIR/.env"

echo "✅ Mobile app .env file created successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit apps/mobile/.env to configure your environment variables"
echo "   2. Ensure your Convex backend is running (pnpm setup-init from root)"
echo "   3. Run iOS setup: pnpm mobile:setup-ios"
echo "   4. Start the mobile app: pnpm mobile:ios"
echo ""
echo "🔍 Current mobile .env location: $MOBILE_DIR/.env"
echo "📖 For more information, see: apps/mobile/README.md"