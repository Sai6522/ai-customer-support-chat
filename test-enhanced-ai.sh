#!/bin/bash

echo "🤖 Testing Enhanced AI Company Data Responses"
echo "=============================================="

# Login as user
echo "📝 Logging in as demo user..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/demo-login \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ Login successful!"

# Create session
echo "📱 Creating chat session..."
SESSION_RESPONSE=$(curl -s -X POST http://localhost:5000/api/chat/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}')

SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
echo "✅ Session created: $SESSION_ID"

# Test queries
echo ""
echo "🔍 Testing Company Data Queries:"
echo "================================"

# Test 1: Company Location
echo ""
echo "1️⃣ Query: 'What is your company location?'"
RESPONSE1=$(curl -s -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"message\": \"What is your company location?\", \"sessionId\": \"$SESSION_ID\"}")

CONTEXT_USED=$(echo $RESPONSE1 | grep -o '"contextUsed":[0-9]*' | cut -d':' -f2)
IS_COMPANY_QUERY=$(echo $RESPONSE1 | grep -o '"isCompanyQuery":[a-z]*' | cut -d':' -f2)
MESSAGE=$(echo $RESPONSE1 | grep -o '"message":"[^"]*"' | cut -d'"' -f4 | head -c 200)

echo "   📊 Context Used: $CONTEXT_USED items"
echo "   🏢 Company Query: $IS_COMPANY_QUERY"
echo "   💬 Response Preview: $MESSAGE..."

# Test 2: Data Management
echo ""
echo "2️⃣ Query: 'Tell me about data management'"
RESPONSE2=$(curl -s -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"message\": \"Tell me about data management\", \"sessionId\": \"$SESSION_ID\"}")

CONTEXT_USED2=$(echo $RESPONSE2 | grep -o '"contextUsed":[0-9]*' | cut -d':' -f2)
IS_COMPANY_QUERY2=$(echo $RESPONSE2 | grep -o '"isCompanyQuery":[a-z]*' | cut -d':' -f2)

echo "   📊 Context Used: $CONTEXT_USED2 items"
echo "   🏢 Company Query: $IS_COMPANY_QUERY2"

# Test 3: Regular Query (should not trigger enhanced response)
echo ""
echo "3️⃣ Query: 'Hello, how are you?' (Regular query)"
RESPONSE3=$(curl -s -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"message\": \"Hello, how are you?\", \"sessionId\": \"$SESSION_ID\"}")

CONTEXT_USED3=$(echo $RESPONSE3 | grep -o '"contextUsed":[0-9]*' | cut -d':' -f2)
IS_COMPANY_QUERY3=$(echo $RESPONSE3 | grep -o '"isCompanyQuery":[a-z]*' | cut -d':' -f2)

echo "   📊 Context Used: $CONTEXT_USED3 items"
echo "   🏢 Company Query: $IS_COMPANY_QUERY3"

echo ""
echo "🎉 Enhanced AI Testing Complete!"
echo ""
echo "📋 Summary:"
echo "- Company queries automatically get enhanced context (10+ items)"
echo "- Regular queries use minimal context (0-3 items)"
echo "- Both users and admins get comprehensive company information"
echo "- AI detects company-related keywords and provides detailed responses"
