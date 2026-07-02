#!/usr/bin/env pwsh
# FreshTrack AI - Quick Start Script
# Run this from d:\Capstone to launch both backend and frontend servers

Write-Host "`n🥗 FreshTrack AI - Startup Script`n" -ForegroundColor Green

# === Start Backend ===
Write-Host "🔧 Starting FastAPI Backend..." -ForegroundColor Cyan
$backendPath = "$PSScriptRoot\backend"
$venvPython = "$backendPath\.venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "❌ Virtual environment not found at $venvPython" -ForegroundColor Red
    Write-Host "   Run: python -m venv $backendPath\.venv" -ForegroundColor Yellow
    exit 1
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; $venvPython -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" -WindowStyle Normal

Write-Host "✅ Backend starting on http://localhost:8000" -ForegroundColor Green
Start-Sleep -Seconds 2

# === Start Frontend ===
Write-Host "`n🎨 Starting React Frontend..." -ForegroundColor Cyan
$frontendPath = "$PSScriptRoot\frontend"

if (-not (Test-Path "$frontendPath\node_modules")) {
    Write-Host "📦 Installing npm packages..." -ForegroundColor Yellow
    Set-Location $frontendPath
    npm.cmd install
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm.cmd run dev" -WindowStyle Normal

Write-Host "✅ Frontend starting on http://localhost:5173" -ForegroundColor Green
Write-Host "`n🌐 Opening browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host "`n✨ FreshTrack AI is running! Press Ctrl+C in server windows to stop.`n" -ForegroundColor Green
