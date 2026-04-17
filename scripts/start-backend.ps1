#Requires -Version 5.1
<#
.SYNOPSIS
    Start the digger-helper FastAPI backend in a local virtualenv.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$BackendDir = Join-Path $PSScriptRoot '..' 'backend' | Resolve-Path
Push-Location $BackendDir

try {
    # ── 1. Create virtualenv if needed ────────────────────────────────────────
    if (-not (Test-Path '.venv')) {
        Write-Host '[backend] Creating virtual environment...' -ForegroundColor Cyan
        python -m venv .venv
    }

    # ── 2. Activate ───────────────────────────────────────────────────────────
    $Activate = Join-Path '.venv' 'Scripts' 'Activate.ps1'
    . $Activate

    # ── 3. Install / update dependencies ─────────────────────────────────────
    Write-Host '[backend] Installing dependencies...' -ForegroundColor Cyan
    pip install -q -r requirements.txt

    # ── 4. Bootstrap .env from example if missing ─────────────────────────────
    if (-not (Test-Path '.env')) {
        if (Test-Path '.env.example') {
            Copy-Item '.env.example' '.env'
            Write-Host '[backend] .env created from .env.example — fill in your API keys.' -ForegroundColor Yellow
        } else {
            Write-Host '[backend] WARNING: no .env found and no .env.example to copy.' -ForegroundColor Red
        }
    }

    # ── 5. Start server ───────────────────────────────────────────────────────
    Write-Host '[backend] Starting uvicorn on http://0.0.0.0:8000 ...' -ForegroundColor Green
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
}
finally {
    Pop-Location
}
