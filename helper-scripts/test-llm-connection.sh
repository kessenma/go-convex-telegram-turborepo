#!/bin/bash

# Test script to verify LLM service connection
echo "🧪 Testing LLM Service Connection..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test health endpoint
echo -e "${YELLOW}1. Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:7999/health)
HTTP_CODE="${HEALTH_RESPONSE: -3}"
RESPONSE_BODY="${HEALTH_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health endpoint responding (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo -e "${RED}❌ Health endpoint failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY"
fi

echo ""

# Test embed endpoint
echo -e "${YELLOW}2. Testing embed endpoint...${NC}"
EMBED_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world, this is a test"}' \
  http://localhost:7999/embed)

HTTP_CODE="${EMBED_RESPONSE: -3}"
RESPONSE_BODY="${EMBED_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Embed endpoint working (HTTP $HTTP_CODE)${NC}"
    echo "Response preview: $(echo "$RESPONSE_BODY" | jq '.embeddings[0:3]' 2>/dev/null || echo "Raw: ${RESPONSE_BODY:0:100}...")"
else
    echo -e "${RED}❌ Embed endpoint failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY"
fi

echo ""

# Test web app API route
echo -e "${YELLOW}3. Testing web app LLM status API...${NC}"
WEB_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/llm/status)
HTTP_CODE="${WEB_RESPONSE: -3}"
RESPONSE_BODY="${WEB_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Web app LLM status API working (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo -e "${RED}❌ Web app LLM status API failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY"
fi

echo ""
echo "🏁 Test completed!"
echo ""
echo "💡 Tips:"
echo "- If health shows 'loading', wait a few minutes for model download"
echo "- Check Docker logs: docker-compose logs vector-convert-llm"
echo "- Monitor memory usage in the health response"
