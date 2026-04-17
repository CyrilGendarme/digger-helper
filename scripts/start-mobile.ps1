#Requires -Version 5.1
<#
.SYNOPSIS
    Start the Expo mobile app, auto-writing the backend API URL to .env.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$MobileDir = Join-Path $PSScriptRoot '..' 'mobile' | Resolve-Path
Push-Location $MobileDir

try {
    # ── 1. Install node_modules if needed ─────────────────────────────────────
    if (-not (Test-Path 'node_modules')) {
        Write-Host '[mobile] Installing npm dependencies...' -ForegroundColor Cyan
        npm install
    }

    # ── 2. Ask for local backend IP (pre-fill if .env already set) ────────────
    $EnvFile = '.env'
    $ExistingUrl = ''
    if (Test-Path $EnvFile) {
        $ExistingUrl = (Get-Content $EnvFile | Where-Object { $_ -match 'EXPO_PUBLIC_API_URL' }) `
            -replace 'EXPO_PUBLIC_API_URL=', ''
    }

    if ($ExistingUrl) {
        Write-Host "[mobile] Current API URL: $ExistingUrl" -ForegroundColor DarkGray
        $NewIp = Read-Host '[mobile] Press ENTER to keep it, or type a new IP (e.g. 192.168.1.42)'
        if ($NewIp) { $ExistingUrl = "http://${NewIp}:8000/api/v1" }
    } else {
        $Ip = Read-Host '[mobile] Enter your machine local IP (e.g. 192.168.1.42)'
        $ExistingUrl = "http://${Ip}:8000/api/v1"
    }

    Set-Content $EnvFile "EXPO_PUBLIC_API_URL=$ExistingUrl"
    Write-Host "[mobile] API URL set to: $ExistingUrl" -ForegroundColor Green

    # ── 3. Start Expo ─────────────────────────────────────────────────────────
    Write-Host '[mobile] Starting Expo — scan the QR code with Expo Go...' -ForegroundColor Green
    npx expo start
}
finally {
    Pop-Location
}
