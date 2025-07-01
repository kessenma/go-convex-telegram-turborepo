#!/bin/bash

# iOS Setup Script (System Ruby) for React Native Mobile App
# This script uses system Ruby and bypasses Gemfile version requirements

set -e

echo "🍎 Setting up iOS dependencies (using system Ruby)..."

# Check if we're in the correct directory
if [ ! -d "ios" ]; then
    echo "❌ Error: ios directory not found. Please run this script from the mobile app root directory."
    exit 1
fi

# Check if CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo "📦 Installing CocoaPods and dependencies..."
    sudo gem install bigdecimal
    sudo gem install cocoapods
else
    echo "📦 Ensuring bigdecimal is installed for Ruby 3.4.2 compatibility..."
    gem install bigdecimal || sudo gem install bigdecimal
fi

# Navigate to iOS directory and install pods
echo "🔧 Installing CocoaPods dependencies..."
cd ios

# Clean pods if they exist
if [ -d "Pods" ]; then
    echo "🧹 Cleaning existing Pods..."
    rm -rf Pods Podfile.lock
fi

# Install pods directly without bundle
echo "📱 Running pod install..."
pod install --verbose

echo "✅ iOS setup completed successfully!"
echo "💡 You can now run: pnpm ios or pnpm mobile:ios from the monorepo root"
echo "🔧 If you encounter permission issues, you may need to run: sudo gem install cocoapods"