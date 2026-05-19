Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "🚀 AI LEARNING & ASSESSMENT PLATFORM LAUNCHER" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Stop existing servers on ports 8000 and 3002
Write-Host "🧹 Stopping any existing server processes..." -ForegroundColor Yellow
$backendPort = 8000
$frontendPort = 3002

$backendProc = Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue
if ($backendProc) {
    Stop-Process -Id $backendProc.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "   Stopping active backend process on port $backendPort..."
}

$frontendProc = Get-NetTCPConnection -LocalPort $frontendPort -ErrorAction SilentlyContinue
if ($frontendProc) {
    Stop-Process -Id $frontendProc.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "   Stopping active frontend process on port $frontendPort..."
}
Start-Sleep -Seconds 1

# 2. Check and install dependencies
Write-Host "📦 Verifying and installing Python backend dependencies..." -ForegroundColor Yellow
pip install -r "$PSScriptRoot\backend\requirements.txt"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to verify/install dependencies." -ForegroundColor Red
} else {
    Write-Host "✅ Dependencies verified successfully." -ForegroundColor Green
}

# 3. Start FastAPI Backend
Write-Host "🔥 Starting FastAPI Backend server on http://localhost:8000..." -ForegroundColor Yellow
Start-Process python -ArgumentList "main.py" -WorkingDirectory "$PSScriptRoot\backend" -NoNewWindow
Start-Sleep -Seconds 2

# 4. Start Python Frontend Server
Write-Host "🎨 Starting Frontend server on http://localhost:3002..." -ForegroundColor Yellow
Start-Process python -ArgumentList "serve_fresh.py" -WorkingDirectory "$PSScriptRoot\frontend" -NoNewWindow
Start-Sleep -Seconds 2

# 5. Open browser
Write-Host "🌐 Opening your browser to http://localhost:3002..." -ForegroundColor Green
Start-Process "http://localhost:3002"

Write-Host "=============================================" -ForegroundColor Green
Write-Host "🎉 Platform successfully launched!" -ForegroundColor Green
Write-Host "Keep this terminal open while running the platform." -ForegroundColor Green
Write-Host "Press Ctrl+C to close." -ForegroundColor Gray
Write-Host "=============================================" -ForegroundColor Green
