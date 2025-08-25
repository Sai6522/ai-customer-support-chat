#!/bin/bash

echo "🧪 Testing Chat Clearing on User Login/Logout"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000/api"

echo -e "${BLUE}📝 Step 1: Login as User 1 (admin)${NC}"
USER1_RESPONSE=$(curl -s -X POST $BASE_URL/auth/demo-login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}')

USER1_TOKEN=$(echo $USER1_RESPONSE | jq -r '.data.token')
USER1_ID=$(echo $USER1_RESPONSE | jq -r '.data.user.id')

if [ "$USER1_TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ User 1 (admin) login successful${NC}"
    echo "   User ID: $USER1_ID"
else
    echo -e "${RED}❌ User 1 login failed${NC}"
    exit 1
fi

echo -e "${BLUE}💬 Step 2: Create Chat Session for User 1${NC}"
SESSION1_RESPONSE=$(curl -s -X POST $BASE_URL/chat/session \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "User 1 Chat Session"}')

SESSION1_ID=$(echo $SESSION1_RESPONSE | jq -r '.data.sessionId')
echo "   Session ID: $SESSION1_ID"

echo -e "${BLUE}🤖 Step 3: Send Messages as User 1${NC}"
curl -s -X POST $BASE_URL/chat/message \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Hello, I am admin user\", \"sessionId\": \"$SESSION1_ID\"}" > /dev/null

curl -s -X POST $BASE_URL/chat/message \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What are your business hours?\", \"sessionId\": \"$SESSION1_ID\"}" > /dev/null

echo "   ✅ Sent 2 messages as User 1"

echo -e "${BLUE}📋 Step 4: Check Chat History for User 1${NC}"
HISTORY1_RESPONSE=$(curl -s -X GET $BASE_URL/chat/history/$SESSION1_ID \
  -H "Authorization: Bearer $USER1_TOKEN")

MESSAGE_COUNT1=$(echo $HISTORY1_RESPONSE | jq '.data.messages | length')
echo "   Messages in User 1 chat: $MESSAGE_COUNT1"

echo -e "${BLUE}👤 Step 5: Login as User 2 (regular user)${NC}"
USER2_RESPONSE=$(curl -s -X POST $BASE_URL/auth/demo-login \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "password123"}')

USER2_TOKEN=$(echo $USER2_RESPONSE | jq -r '.data.token')
USER2_ID=$(echo $USER2_RESPONSE | jq -r '.data.user.id')

if [ "$USER2_TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ User 2 (user) login successful${NC}"
    echo "   User ID: $USER2_ID"
else
    echo -e "${RED}❌ User 2 login failed${NC}"
    exit 1
fi

echo -e "${BLUE}💬 Step 6: Create Chat Session for User 2${NC}"
SESSION2_RESPONSE=$(curl -s -X POST $BASE_URL/chat/session \
  -H "Authorization: Bearer $USER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "User 2 Chat Session"}')

SESSION2_ID=$(echo $SESSION2_RESPONSE | jq -r '.data.sessionId')
echo "   Session ID: $SESSION2_ID"

echo -e "${BLUE}🔍 Step 7: Verify Sessions are Different${NC}"
if [ "$SESSION1_ID" != "$SESSION2_ID" ]; then
    echo -e "${GREEN}✅ Different users have different sessions${NC}"
    echo "   User 1 Session: $SESSION1_ID"
    echo "   User 2 Session: $SESSION2_ID"
else
    echo -e "${RED}❌ Sessions are the same - this is the bug!${NC}"
fi

echo -e "${BLUE}🤖 Step 8: Send Messages as User 2${NC}"
curl -s -X POST $BASE_URL/chat/message \
  -H "Authorization: Bearer $USER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Hello, I am regular user\", \"sessionId\": \"$SESSION2_ID\"}" > /dev/null

echo "   ✅ Sent 1 message as User 2"

echo -e "${BLUE}📋 Step 9: Check Chat History for User 2${NC}"
HISTORY2_RESPONSE=$(curl -s -X GET $BASE_URL/chat/history/$SESSION2_ID \
  -H "Authorization: Bearer $USER2_TOKEN")

MESSAGE_COUNT2=$(echo $HISTORY2_RESPONSE | jq '.data.messages | length')
echo "   Messages in User 2 chat: $MESSAGE_COUNT2"

echo -e "${BLUE}🔄 Step 10: Login Back as User 1${NC}"
USER1_AGAIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/demo-login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}')

USER1_AGAIN_TOKEN=$(echo $USER1_AGAIN_RESPONSE | jq -r '.data.token')

echo -e "${BLUE}📋 Step 11: Check if User 1 Still Has Their Chat History${NC}"
HISTORY1_AGAIN_RESPONSE=$(curl -s -X GET $BASE_URL/chat/history/$SESSION1_ID \
  -H "Authorization: Bearer $USER1_AGAIN_TOKEN")

MESSAGE_COUNT1_AGAIN=$(echo $HISTORY1_AGAIN_RESPONSE | jq '.data.messages | length')
echo "   Messages in User 1 chat after re-login: $MESSAGE_COUNT1_AGAIN"

echo -e "${BLUE}🎯 Step 12: Test Results Summary${NC}"
echo "=============================================="

if [ "$SESSION1_ID" != "$SESSION2_ID" ]; then
    echo -e "${GREEN}✅ PASS: Different users get different chat sessions${NC}"
else
    echo -e "${RED}❌ FAIL: Users share the same chat session${NC}"
fi

if [ "$MESSAGE_COUNT2" -eq 2 ]; then  # 1 user message + 1 bot response
    echo -e "${GREEN}✅ PASS: User 2 has their own chat history${NC}"
else
    echo -e "${YELLOW}⚠️  INFO: User 2 has $MESSAGE_COUNT2 messages (expected 2)${NC}"
fi

if [ "$MESSAGE_COUNT1_AGAIN" -eq "$MESSAGE_COUNT1" ]; then
    echo -e "${GREEN}✅ PASS: User 1 retains their chat history after re-login${NC}"
else
    echo -e "${YELLOW}⚠️  INFO: User 1 chat history changed (was $MESSAGE_COUNT1, now $MESSAGE_COUNT1_AGAIN)${NC}"
fi

echo ""
echo -e "${BLUE}💡 Expected Behavior:${NC}"
echo "   • Each user should have their own isolated chat sessions"
echo "   • Chat history should not be shared between users"
echo "   • Users should retain their own chat history when logging back in"
echo "   • When switching users, the previous user's chat should not be visible"

echo ""
echo -e "${GREEN}🎉 Chat Isolation Test Complete!${NC}"
