param(
    [switch]$Seed
)

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot

Set-Location $projectRoot

if (-not (Test-Path "$projectRoot\package.json")) {
    Write-Host "package.json not found. Run this from the project root." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$projectRoot\.env")) {
    Write-Host ".env file not found. Create one before starting the app." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$projectRoot\node_modules")) {
    Write-Host "node_modules not found. Run npm install once, then rerun this script." -ForegroundColor Red
    exit 1
}

if ($Seed) {
    Write-Host "Seeding database..." -ForegroundColor Cyan
    npm run seed
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Seed failed." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Starting Next.js dev server..." -ForegroundColor Green
Write-Host "Frontend and backend run together in one Next.js process." -ForegroundColor DarkGray

Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev") -WorkingDirectory $projectRoot
Write-Host "Started. The app is running in the background at http://localhost:3000" -ForegroundColor Green
