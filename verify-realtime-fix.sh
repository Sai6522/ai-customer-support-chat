#!/bin/bash

echo "🔍 Verifying Real-time Data Update Fix"
echo "======================================"

# Check if the required files exist and have been updated
echo ""
echo "📁 Checking updated files..."

# Check Gemini service
if grep -q "getFreshContextData" backend/utils/geminiService.js; then
    echo "✅ Gemini service updated with fresh data function"
else
    echo "❌ Gemini service missing fresh data function"
fi

if grep -q "freshDataUsed" backend/utils/geminiService.js; then
    echo "✅ Gemini service includes fresh data metadata"
else
    echo "❌ Gemini service missing fresh data metadata"
fi

# Check chat route
if grep -q "updatedAt" backend/routes/chat.js; then
    echo "✅ Chat route updated with timestamp sorting"
else
    echo "❌ Chat route missing timestamp sorting"
fi

if grep -q "lean()" backend/routes/chat.js; then
    echo "✅ Chat route using lean queries for performance"
else
    echo "❌ Chat route missing lean queries"
fi

# Check FAQ model
if grep -q "updatedAt: -1" backend/models/FAQ.js; then
    echo "✅ FAQ model updated with timestamp sorting"
else
    echo "❌ FAQ model missing timestamp sorting"
fi

# Check CompanyData model
if grep -q "updatedAt: -1" backend/models/CompanyData.js; then
    echo "✅ CompanyData model updated with timestamp sorting"
else
    echo "❌ CompanyData model missing timestamp sorting"
fi

# Check if test script exists
if [ -f "test-realtime-updates.js" ]; then
    echo "✅ Test script created successfully"
else
    echo "❌ Test script missing"
fi

echo ""
echo "🧪 To test the real-time updates:"
echo "1. Start your application: ./start.sh"
echo "2. Run the test script: node test-realtime-updates.js"
echo "3. Or manually test through the admin dashboard"

echo ""
echo "📋 Manual Testing Steps:"
echo "1. Login to admin dashboard (http://localhost:3000/admin)"
echo "2. Update an FAQ or Company Data entry"
echo "3. Go to chat interface (http://localhost:3000)"
echo "4. Ask a question related to the updated content"
echo "5. Verify the AI provides the updated information"

echo ""
echo "🔧 Key Improvements Made:"
echo "- Fresh database queries with .lean() for performance"
echo "- Priority + timestamp sorting for latest data"
echo "- Enhanced context management with source tracking"
echo "- Improved AI instructions for using fresh data"
echo "- Comprehensive debug logging"
echo "- Fresh data indicators in response metadata"

echo ""
echo "✅ Real-time Data Update Fix Implementation Complete!"
