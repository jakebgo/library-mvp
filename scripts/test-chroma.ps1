# Check if ChromaDB is running
$response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/heartbeat" -Method GET -UseBasicParsing -ErrorAction SilentlyContinue

if (-not $response) {
    Write-Host "ChromaDB is not running. Starting it..."
    docker-compose up -d chroma
    
    # Wait for ChromaDB to start
    Write-Host "Waiting for ChromaDB to start..."
    Start-Sleep -Seconds 5
}

# Run the test
Write-Host "Running ChromaDB test..."
npx ts-node src/lib/chroma.test.ts 