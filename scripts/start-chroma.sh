#!/bin/bash

# Create necessary directories
mkdir -p auth
mkdir -p ssl

# Start ChromaDB with Docker Compose
docker-compose up -d chroma

# Wait for ChromaDB to be ready
echo "Waiting for ChromaDB to start..."
sleep 5

# Check if ChromaDB is running
if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null; then
    echo "ChromaDB is running successfully!"
else
    echo "Error: ChromaDB failed to start. Check the logs with 'docker-compose logs chroma'"
    exit 1
fi 