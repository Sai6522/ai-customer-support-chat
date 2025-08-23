#!/bin/bash

echo "🔍 AI Customer Support Chat Platform Status Check"
echo "================================================"

# Check Backend
echo -n "Backend (Port 5000): "
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not responding"
fi

# Check Frontend
echo -n "Frontend (Port 3000): "
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not responding"
fi

# Check MongoDB
echo -n "MongoDB: "
if mongosh --eval "db.runCommand('ping')" --quiet > /dev/null 2>&1; then
    echo "✅ Connected"
else
    echo "❌ Not connected"
fi

echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000/api"
echo ""
echo "📊 Quick API Test:"
curl -s http://localhost:5000/api/health | grep -o '"message":"[^"]*"' | sed 's/"message":"/   /' | sed 's/"//'
