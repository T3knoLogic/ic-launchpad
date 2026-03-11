# ICP Launchpad - Local setup for Windows
# Requires WSL with dfx installed. Runs run-local.sh via WSL, then syncs env and installs deps.
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir

Write-Host "=== ICP Launchpad - Local setup (Windows) ===" -ForegroundColor Cyan
Write-Host ""

# Run bash script in WSL
$WslPath = $Root -replace '^([A-Za-z]):', '/mnt/$1' -replace '\\', '/'
Write-Host "Running run-local.sh in WSL..." -ForegroundColor Yellow
wsl -e bash -c "cd $WslPath && chmod +x scripts/run-local.sh && ./scripts/run-local.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Host "WSL/dfx failed. Is dfx installed in WSL? See LOCAL_TESTING.md" -ForegroundColor Red
    exit 1
}

# Sync env (in case run-local.sh didn't write frontend/.env fully)
Write-Host ""
Write-Host "Syncing frontend/.env..." -ForegroundColor Yellow
node "$Root\scripts\sync-env.mjs"

# Install deps
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Set-Location $Root
npm run setup

Write-Host ""
Write-Host "Done. Start the dashboard: npm run dev" -ForegroundColor Green
Write-Host "Then open http://localhost:5173" -ForegroundColor Green
