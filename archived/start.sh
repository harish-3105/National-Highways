#!/bin/bash

# Highways Management System - Quick Start Script

echo "🚀 Starting Highways Management System..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start services
echo "🏗️  Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check PostgreSQL
echo "🔍 Checking PostgreSQL..."
docker-compose exec -T postgres pg_isready -U postgres

# Run migrations
echo "📊 Running database migrations..."
docker-compose exec -T backend npm run migration:run

# Show status
echo ""
echo "✅ Services are running!"
echo ""
echo "📍 Access points:"
echo "   Frontend:  http://localhost:3001"
echo "   Backend:   http://localhost:3000"
echo "   Database:  localhost:5432"
echo ""
echo "🔐 Default credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart:       docker-compose restart"
echo ""
