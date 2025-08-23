#!/bin/bash

echo "🛑 Stopping AI Customer Support Chat Platform..."

# Stop backend server
echo "Stopping backend server..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true

# Stop frontend server
echo "Stopping frontend server..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

# Stop MongoDB (if running with Docker)
if command -v docker-compose &> /dev/null; then
    echo "Stopping MongoDB (Docker)..."
    docker-compose down 2>/dev/null || true
fi

echo "✅ All services stopped!"
