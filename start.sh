#!/bin/bash

# AI Customer Support Chat Platform Startup Script

echo "🚀 Starting AI Customer Support Chat Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# Check if MongoDB is running or start with Docker
echo "📦 Checking MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "🐳 Starting MongoDB with Docker..."
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d mongodb
        echo "⏳ Waiting for MongoDB to start..."
        sleep 10
    else
        echo "❌ MongoDB is not running and Docker Compose is not available."
        echo "Please start MongoDB manually or install Docker Compose."
        exit 1
    fi
else
    echo "✅ MongoDB is already running"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please update the .env file with your OpenAI API key and other configurations."
fi

# Seed database with demo data
echo "🌱 Seeding database with demo data..."
npm run seed

# Start backend server
echo "🚀 Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
fi

# Start frontend server
echo "🚀 Starting frontend server..."
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ AI Customer Support Chat Platform is starting up!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📊 MongoDB Admin: http://localhost:8081 (if using Docker)"
echo ""
echo "👤 Demo Credentials:"
echo "   Admin: admin / password123"
echo "   User: user / password123"
echo ""
echo "⚠️  Don't forget to add your OpenAI API key to backend/.env"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop the services
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
