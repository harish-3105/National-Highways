#!/bin/bash

# Development Setup Script

echo "🔧 Setting up Highways Management System for development..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Setup Backend
echo ""
echo "📦 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

echo "Installing backend dependencies..."
npm install

cd ..

# Setup Frontend
echo ""
echo "📦 Setting up frontend..."
cd frontend

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

echo "Installing frontend dependencies..."
npm install

cd ..

# Setup Database
echo ""
echo "🗄️  Setting up database..."
echo "Starting PostgreSQL with PostGIS..."

docker run -d \
  --name highways_postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=highways_db \
  -p 5432:5432 \
  postgis/postgis:15-3.3 2>/dev/null || echo "PostgreSQL container already exists"

echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Run migrations
echo "Running database migrations..."
cd backend
npm run migration:run
cd ..

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "🚀 To start development servers:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "📍 Access points:"
echo "   Frontend:  http://localhost:3001"
echo "   Backend:   http://localhost:3000"
echo "   Database:  localhost:5432"
echo ""
