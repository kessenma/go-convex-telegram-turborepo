#!/bin/bash

# Mobile App Environment Setup Script
# This script automates the setup process for the mobile app environment.

set -e # Exit on any error

echo "🚀 Starting Mobile App Environment Setup"
echo "======================================="

# Check if mobile .env already exists
if [ -f "apps/mobile/.env" ]; then
    echo "✅ Mobile app environment already configured"
    echo "💡 You can edit apps/mobile/.env to customize mobile app settings"
else
    # Check if .env.example exists
    if [ ! -f "apps/mobile/.env.example" ]; then
        echo "❌ .env.example not found in mobile app directory"
        echo "   Skipping mobile environment setup"
    else
        echo "Mobile app environment not configured."
        echo "This will create a .env file for the mobile app from .env.example"
        read -p "Setup mobile environment? (y/n): " -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "📱 Setting up mobile app environment..."
            cd apps/mobile
            cp .env.example .env
            echo "✅ Mobile app .env file created from .env.example"
            echo "📝 Mobile environment configured with default settings"
            echo "💡 You can edit apps/mobile/.env to customize mobile app settings"
            cd ../..
        else
            echo "⏭️  Skipping mobile environment setup"
            echo "💡 You can set it up later with: pnpm mobile:setup-env"
        fi
    fi
fi

echo "✅ Mobile App Environment Setup Complete!"