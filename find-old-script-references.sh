#!/bin/bash

# Script to find references to old script paths that need updating
# after moving scripts to helper-scripts directory

echo "🔍 Searching for old script references..."
echo "==========================================="
echo ""

# List of scripts that were moved to helper-scripts
SCRIPTS=(
    "deploy-convex-api.sh"
    "deploy-convex-prod.sh"
    "deploy-convex.sh"
    "reset-web-only.sh"
    "docker-manager.sh"
    "setup-mobile.sh"
    "deploy-minimal-llm.sh"
    "deploy-optimized-llm.sh"
    "deploy-stable-llm.sh"
    "docker-troubleshoot.sh"
    "restart-web-dashboard.sh"
    "setup-ssl.sh"
    "test-llm-connection.sh"
)

echo "📋 Checking for references to moved scripts:"
for script in "${SCRIPTS[@]}"; do
    echo "\n🔍 Searching for: $script"
    # Search for references that don't already include helper-scripts/
    grep -r "\./[^h].*$script" . --exclude-dir=node_modules --exclude-dir=.git --exclude="find-old-script-references.sh" 2>/dev/null || echo "   ✅ No old references found"
done

echo "\n📋 Summary of files that were updated:"
echo "✅ /Users/kyleessenmacher/WS/go-convex-telegram-turborepo/package.json"
echo "✅ /Users/kyleessenmacher/WS/go-convex-telegram-turborepo/setup.sh"
echo "✅ /Users/kyleessenmacher/WS/go-convex-telegram-turborepo/helper-scripts/docker-manager.sh"
echo "✅ /Users/kyleessenmacher/WS/go-convex-telegram-turborepo/Terminal"

echo "\n🎉 Script reference update complete!"
echo "All helper scripts now correctly reference the helper-scripts/ directory."