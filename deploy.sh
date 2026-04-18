#!/bin/bash
# VPS Deploy Script - Run everything in Docker

echo "🚀 Building and starting YoTop10..."

# Build and start all services including the app
docker-compose up -d --build

echo ""
echo "✅ Services started:"
echo "  - Frontend: http://localhost:3100"
echo "  - Backend API: http://localhost:8100/api"
echo "  - MongoDB: localhost:27017"
echo "  - Redis: localhost:6379"
echo "  - Elasticsearch: localhost:9200"
echo ""
echo "📊 Logs: docker-compose logs -f"
echo "🛑 Stop: docker-compose down"
