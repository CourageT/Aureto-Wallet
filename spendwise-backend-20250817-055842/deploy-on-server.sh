#!/bin/bash
set -e

echo "🛑 Stopping existing backend services..."
docker-compose down || true

echo "📁 Setting up directories..."
mkdir -p logs

echo "🏗️  Building backend image..."
docker-compose build backend

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Wait for database
echo "📊 Checking database connection..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U spendwise -d spendwise_production; then
        echo "✅ Database is ready"
        break
    fi
    echo "⏳ Waiting for database... ($i/30)"
    sleep 2
done

# Wait for backend
echo "📊 Checking backend health..."
for i in {1..30}; do
    if curl -f http://localhost:5000/health >/dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    fi
    echo "⏳ Waiting for backend... ($i/30)"
    sleep 2
done

echo "📊 Service status:"
docker-compose ps

echo "✅ Backend deployment completed!"
echo "🌐 Backend API available at: http://localhost:5000"
