#!/bin/bash

# Check if ChromaDB is running
if ! curl -s http://localhost:8000/api/v1/heartbeat > /dev/null; then
    echo "ChromaDB is not running. Starting it..."
    ./scripts/start-chroma.sh
fi

# Run the test
echo "Running ChromaDB test..."
npx ts-node src/lib/chroma.test.ts 