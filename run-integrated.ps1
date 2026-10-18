$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendRoot = Join-Path $ProjectRoot 'backend'
$FrontendRoot = Join-Path $ProjectRoot 'Frontend'

if (-not (Test-Path (Join-Path $BackendRoot 'main.py'))) {
    throw "Backend was not found at $BackendRoot"
}

if (-not (Test-Path (Join-Path $FrontendRoot 'package.json'))) {
    throw "Frontend was not found at $FrontendRoot"
}

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "Python was not found on PATH."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm was not found on PATH."
}

Write-Host 'Starting BrainTrace backend and models at http://localhost:8000 ...' -ForegroundColor Green
Start-Process powershell.exe `
    -ArgumentList '-NoExit', '-Command', 'python -m uvicorn main:app --host 127.0.0.1 --port 8000' `
    -WorkingDirectory $BackendRoot

Write-Host 'Starting BrainTrace frontend at http://localhost:3000 ...' -ForegroundColor Green
Start-Process powershell.exe `
    -ArgumentList '-NoExit', '-Command', 'npm run dev' `
    -WorkingDirectory $FrontendRoot

Write-Host ''
Write-Host 'Integrated BrainTrace is starting:' -ForegroundColor Cyan
Write-Host '  Frontend: http://localhost:3000'
Write-Host '  Backend:  http://localhost:8000'
Write-Host '  Ready:    http://localhost:3000/api/ready'
Write-Host ''
Write-Host 'The backend startup loads Model 1 and Model 2 automatically.' -ForegroundColor Yellow
