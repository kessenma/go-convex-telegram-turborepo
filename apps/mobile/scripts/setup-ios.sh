#!/bin/bash

# iOS Setup Script for React Native Mobile App
# This script installs CocoaPods dependencies required for iOS development

set -e

echo "🍎 Setting up iOS dependencies..."

# Check if we're in the correct directory
if [ ! -d "ios" ]; then
    echo "❌ Error: ios directory not found. Please run this script from the mobile app root directory."
    exit 1
fi

# Check Ruby version
echo "🔍 Checking Ruby version..."
RUBY_VERSION=$(ruby -v | cut -d' ' -f2 | cut -d'p' -f1)
REQUIRED_VERSION="3.4.2"

if [ "$RUBY_VERSION" != "$REQUIRED_VERSION" ]; then
    echo "⚠️  Warning: Ruby version mismatch!"
    echo "   Current: $RUBY_VERSION"
    echo "   Required: $REQUIRED_VERSION"
    echo ""
    echo "💡 To fix this, you can:"
    echo "   1. Use rbenv: rbenv install $REQUIRED_VERSION && rbenv local $REQUIRED_VERSION"
    echo "   2. Use rvm: rvm install $REQUIRED_VERSION && rvm use $REQUIRED_VERSION"
    echo "   3. Or continue anyway (may work with warnings)"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if bundle is available
if ! command -v bundle &> /dev/null; then
    echo "❌ Error: bundle command not found. Please install Ruby bundler first:"
    echo "   gem install bundler"
    exit 1
fi

# Install Ruby dependencies (including CocoaPods)
echo "📦 Installing Ruby dependencies..."
# Remove Gemfile.lock to avoid version conflicts with Ruby 3.4.2
if [ -f "Gemfile.lock" ]; then
    echo "🧹 Removing existing Gemfile.lock for Ruby 3.4.2 compatibility..."
    rm Gemfile.lock
fi

if ! bundle install; then
    echo "❌ Bundle install failed. Trying with --force..."
    if ! bundle install --force; then
        echo "❌ Bundle install still failed. Trying to update bundler..."
        gem install bundler
        bundle install
    fi
fi

# Navigate to iOS directory and install pods
echo "🔧 Installing CocoaPods dependencies..."
cd ios

# Clean pods if they exist
if [ -d "Pods" ]; then
    echo "🧹 Cleaning existing Pods..."
    rm -rf Pods Podfile.lock
fi

bundle exec pod install --verbose

echo "✅ iOS setup completed successfully!"
echo "💡 You can now run: pnpm ios or pnpm mobile:ios from the monorepo root"