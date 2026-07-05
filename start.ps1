param(
    [switch]$Seed
)

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   Alumni Network Platform Startup Script    " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Check and install backend dependencies
Write-Host "`n[1/3] Checking Backend App..." -ForegroundColor Yellow
if (-not (Test-Path "$projectRoot\backend\.env")) {
    Write-Host "Error: backend/.env file not found. Copy backend/.env.example and configure it." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "$projectRoot\backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
    Set-Location "$projectRoot\backend"
    npm install
    Set-Location $projectRoot
}

# 2. Check and install frontend dependencies
Write-Host "[2/3] Checking Frontend App..." -ForegroundColor Yellow
if (-not (Test-Path "$projectRoot\frontend\.env")) {
    Write-Host "Error: frontend/.env file not found. Set it up before running." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "$projectRoot\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    Set-Location "$projectRoot\frontend"
    npm install
    Set-Location $projectRoot
}

# 3. Seed database if requested
if ($Seed) {
    Write-Host "`n[Seeding] Seeding Database..." -ForegroundColor Cyan
    Set-Location "$projectRoot\backend"
    npx prisma db push
    npm run seed
    Set-Location $projectRoot
    Write-Host "Database Seeding completed successfully." -ForegroundColor Green
}

# 4. Start servers
Write-Host "`n[3/3] Starting Application Servers..." -ForegroundColor Yellow

# Start backend server (Express + Socket.IO on port 5000)
Write-Host "🚀 Starting Express & Socket.IO backend on http://localhost:5000" -ForegroundColor Green
Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev") -WorkingDirectory "$projectRoot\backend"

# Start frontend server (Next.js on http://localhost:3000)
Write-Host "🚀 Starting Next.js frontend on http://localhost:3000" -ForegroundColor Green
Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev") -WorkingDirectory "$projectRoot\frontend"

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "  Success: Application servers started!       " -ForegroundColor Green
Write-Host "  Backend: http://localhost:5000              " -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000             " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
