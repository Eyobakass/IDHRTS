# run-docker-e2e.ps1
# Automates Option 3: Full Docker Orchestration E2E Testing

$ErrorActionPreference = "Stop"

Write-Host "[START] Starting Full Docker Orchestration for E2E Testing..." -ForegroundColor Cyan

# 0. Kill any local dev servers occupying ports 3000 or 8000
Write-Host "[PREP] Freeing ports 3000 and 8000..."
Get-NetTCPConnection -LocalPort 3000, 8000 -ErrorAction SilentlyContinue | 
    Select-Object -ExpandProperty OwningProcess | 
    Get-Process -ErrorAction SilentlyContinue | 
    Stop-Process -Force -ErrorAction SilentlyContinue

# 1. Spin up the cluster
Write-Host "[BUILD] Building and starting containers (backend, frontend, postgres, redis, celery)..."
docker-compose down -v
docker-compose build
docker-compose up -d

Write-Host "[WAIT] Waiting for containers to report healthy (this takes about 30-40 seconds)..."

# 2. Wait for health checks
$maxRetries = 12
$retryCount = 0
$healthy = $false

while ($retryCount -lt $maxRetries) {
    # Check if backend and frontend are healthy
    $backendHealth = docker inspect --format="{{.State.Health.Status}}" idhrts_backend 2>$null
    $frontendHealth = docker inspect --format="{{.State.Health.Status}}" idhrts_frontend 2>$null

    if ($backendHealth -eq "healthy" -and $frontendHealth -eq "healthy") {
        $healthy = $true
        break
    }

    Write-Host "   -> Status: Backend [$backendHealth], Frontend [$frontendHealth]. Waiting 5s..."
    Start-Sleep -Seconds 5
    $retryCount++
}

if (-not $healthy) {
    Write-Host "[ERROR] Containers failed to become healthy within the timeout." -ForegroundColor Red
    docker-compose logs
    docker-compose down
    exit 1
}

Write-Host "[OK] Docker cluster is fully healthy!" -ForegroundColor Green

# 3. Run Playwright Tests against the Docker cluster
Write-Host "[TEST] Running Playwright E2E suite against Docker containers..." -ForegroundColor Cyan

# Set environment variable so Playwright knows to seed the Docker DB instead of SQLite
$env:USE_DOCKER = "1"

# Playwright runs from the idhrts_frontend directory
Set-Location -Path .\idhrts_frontend

try {
    # We do NOT let playwright boot 'npm run dev' because Docker is serving Next.js on port 3000
    # But playwright.config.ts has 'reuseExistingServer: true', so it will see 3000 is occupied by Docker and just use it!
    npx playwright test e2e/real/ --project=real-e2e
    $testExitCode = $LASTEXITCODE
} finally {
    Set-Location -Path ..
}

# 4. Teardown
Write-Host "[CLEANUP] Tearing down Docker cluster..." -ForegroundColor Cyan
docker-compose down -v

if ($testExitCode -eq 0) {
    Write-Host "[SUCCESS] Option 3 Complete: Full Docker Orchestration E2E Tests PASSED!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Docker E2E Tests FAILED." -ForegroundColor Red
    exit $testExitCode
}
