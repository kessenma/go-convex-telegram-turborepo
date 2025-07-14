#!/bin/bash

# =============================================================================
# WEB API TO CONVEX ENDPOINT CHECKER
# =============================================================================
# This script analyzes the Next.js web app API folder structure and compares
# it with the Convex HTTP endpoints to ensure all API routes have matching
# implementations in the Convex backend.
#
# Usage: ./web-api-convex-check.sh
# =============================================================================

set -e

# Paths
WEB_API_DIR="/Users/kyleessenmacher/WS/go-convex-telegram-turborepo/apps/web/app/api"
CONVEX_HTTP_FILE="/Users/kyleessenmacher/WS/go-convex-telegram-turborepo/apps/docker-convex/convex/http.ts"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_FILE="$SCRIPT_DIR/api-endpoint-report.txt"

echo "======================================================"
echo "🔍 WEB API TO CONVEX ENDPOINT VERIFICATION"
echo "======================================================"
echo
echo "Web API Directory: $WEB_API_DIR"
echo "Convex HTTP File: $CONVEX_HTTP_FILE"
echo "Report File: $REPORT_FILE"
echo

# Check if required files exist
if [[ ! -d "$WEB_API_DIR" ]]; then
    echo "Error: Web API directory not found: $WEB_API_DIR"
    exit 1
fi

if [[ ! -f "$CONVEX_HTTP_FILE" ]]; then
    echo "Error: Convex HTTP file not found: $CONVEX_HTTP_FILE"
    exit 1
fi

# Function to extract Next.js API routes
extract_nextjs_routes() {
    # Find all route.ts files and extract their paths
    find "$WEB_API_DIR" -name "route.ts" -type f | while read -r file; do
        # Get relative path from api directory
        rel_path=$(echo "$file" | sed "s|$WEB_API_DIR||" | sed 's|/route.ts$||')
        # Convert to API route format
        if [ "$rel_path" = "" ]; then
            echo "/api"
        else
            echo "/api$rel_path"
        fi
    done | sort -u
}

# Function to extract Convex HTTP routes
extract_convex_routes() {
    # Extract routes from http.ts router configuration
    if [ -f "$CONVEX_HTTP_FILE" ]; then
        # Look for http.route calls with path or pathPrefix
        {
            # Extract exact paths
            grep -E "path: \"/" "$CONVEX_HTTP_FILE" | sed -E 's/.*path: "([^"]+)".*/\1/'
            # Extract path prefixes (add /* to indicate prefix)
            grep -E "pathPrefix: \"/" "$CONVEX_HTTP_FILE" | sed -E 's/.*pathPrefix: "([^"]+)".*/\1*/' 
        } | sort -u
    else
        echo "Error: Convex HTTP file not found at $CONVEX_HTTP_FILE" >&2
        exit 1
    fi
}

# Function to extract HTTP methods from route files
extract_http_methods() {
    local route_file="$1"
    if [[ -f "$route_file" ]]; then
        grep -E "^export (async )?function (GET|POST|PUT|DELETE|PATCH)" "$route_file" | \
        sed -E 's/^export (async )?function ([A-Z]+).*/\2/' | sort | uniq
    fi
}

# Get routes
echo "📊 Analyzing Next.js API routes..."
nextjs_routes=$(extract_nextjs_routes)
echo "📊 Analyzing Convex HTTP routes..."
convex_routes=$(extract_convex_routes)

# Count routes
nextjs_count=$(echo "$nextjs_routes" | grep -c . || echo 0)
convex_count=$(echo "$convex_routes" | grep -c . || echo 0)

# Initialize report
{
    echo "WEB API TO CONVEX ENDPOINT ANALYSIS REPORT"
    echo "Generated: $(date)"
    echo "=========================================="
    echo
    echo "SUMMARY:"
    echo "--------"
    echo "Total Next.js API routes: $nextjs_count"
} > "$REPORT_FILE"

# Find matches and mismatches
matched_routes=""
missing_routes=""
extra_routes=""
matched_count=0
missing_count=0
extra_count=0

echo
echo "🔍 Analyzing route mappings..."
echo

# Check each Next.js route
while IFS= read -r nextjs_route; do
    if [[ -n "$nextjs_route" ]]; then
        echo "Checking: $nextjs_route"
        
        # Extract route file path for method analysis
        route_path="${nextjs_route#/api}"
        route_file="$WEB_API_DIR$route_path/route.ts"
        
        # Get HTTP methods
        methods=$(extract_http_methods "$route_file")
        if [[ -n "$methods" ]]; then
            echo "  Methods: $(echo "$methods" | tr '\n' ' ')"
        fi
        
        # Check if route exists in Convex
         matched=false
         
         # Check for exact match
         if echo "$convex_routes" | grep -q "^$nextjs_route$"; then
             matched=true
         fi
         
         # Check for pathPrefix match (for dynamic routes like [id])
         if [[ "$matched" == false && "$nextjs_route" == *"[id]"* ]]; then
             # Convert /api/documents/[id] to /api/documents/
             prefix_route="${nextjs_route%/\[id\]*}/"
             if echo "$convex_routes" | grep -q "^${prefix_route}\*$"; then
                 matched=true
             fi
         fi
         
         if [[ "$matched" == true ]]; then
             echo "  ✅ MATCHED"
             matched_routes="$matched_routes$nextjs_route\n"
             ((matched_count++))
         else
             echo "  ❌ MISSING in Convex"
             missing_routes="$missing_routes$nextjs_route\n"
             ((missing_count++))
         fi
        echo
    fi
done <<< "$nextjs_routes"

# Check for extra Convex routes
echo "🔍 Checking for extra Convex routes..."
echo

while IFS= read -r convex_route; do
    if [[ -n "$convex_route" ]]; then
        if ! echo "$nextjs_routes" | grep -q "^$convex_route$"; then
            echo "  ⚠️  Extra Convex route: $convex_route"
            extra_routes="$extra_routes$convex_route\n"
            ((extra_count++))
        fi
    fi
done <<< "$convex_routes"

# Calculate coverage
if [ $nextjs_count -gt 0 ]; then
    coverage=$((matched_count * 100 / nextjs_count))
else
    coverage=0
fi

# Update report with detailed results
{
    echo "Matched routes: $matched_count"
    echo "Missing in Convex: $missing_count"
    echo "Extra Convex routes: $extra_count"
    echo
    echo "MATCHED ROUTES:"
    echo "---------------"
    if [[ -n "$matched_routes" ]]; then
        echo -e "$matched_routes" | grep -v '^$' | sed 's/^/✅ /'
    fi
    echo
    echo "MISSING IN CONVEX:"
    echo "------------------"
    if [[ -n "$missing_routes" ]]; then
        echo -e "$missing_routes" | grep -v '^$' | sed 's/^/❌ /'
    fi
    echo
    echo "EXTRA CONVEX ROUTES:"
    echo "-------------------"
    if [[ -n "$extra_routes" ]]; then
        echo -e "$extra_routes" | grep -v '^$' | sed 's/^/⚠️  /'
    fi
    echo
    echo "DETAILED ANALYSIS:"
    echo "------------------"
    if [ $missing_count -gt 0 ]; then
        echo "The following Next.js API routes need Convex implementations:"
        echo -e "$missing_routes" | grep -v '^$' | sed 's/^/- /'
    else
        echo "All Next.js API routes have corresponding Convex implementations."
    fi
} >> "$REPORT_FILE"

# Display summary
echo
echo "======================================================"
echo "📊 Total Next.js API routes: $nextjs_count"
echo "✅ Matched routes: $matched_count"
echo "❌ Missing in Convex: $missing_count"
echo "⚠️  Extra Convex routes: $extra_count"
echo "📈 Coverage: $coverage%"
echo "======================================================"

# Final recommendations
if [ $missing_count -gt 0 ]; then
    echo
    echo "⚠️  WARNING: Some Next.js API routes are missing Convex implementations!"
    echo "📄 Check the detailed report: $REPORT_FILE"
    echo "=============================================================================="
    echo
    echo "💡 RECOMMENDATIONS:"
    echo "1. Add missing Convex HTTP route handlers for the unmatched endpoints"
    echo "2. Update the http.ts router configuration to include missing routes"
    echo "3. Ensure proper HTTP method support (GET, POST, PUT, DELETE) for each route"
    echo "4. Test the new endpoints after implementation"
    echo
    if [ $extra_count -gt 0 ]; then
        echo "ℹ️  INFO: Found extra Convex routes that don't have Next.js counterparts"
        echo "   This might be intentional for internal APIs or direct Convex access"
        echo
    fi
    echo "📄 Detailed report saved to: $REPORT_FILE"
    exit 1
else
    echo
    echo "🎉 SUCCESS: All Next.js API routes have corresponding Convex implementations!"
    if [ $extra_count -gt 0 ]; then
        echo "ℹ️  INFO: Found $extra_count extra Convex routes that don't have Next.js counterparts"
        echo "   This might be intentional for internal APIs or direct Convex access"
    fi
    echo "📄 Detailed report saved to: $REPORT_FILE"
    exit 0
fi