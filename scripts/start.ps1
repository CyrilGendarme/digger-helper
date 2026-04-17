#Requires -Version 5.1
<#
.SYNOPSIS
    Launch backend + mobile in two separate PowerShell windows simultaneously.
#>

$Root = Split-Path $PSScriptRoot -Parent

Write-Host '[dev] Starting backend...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"& '$Root\scripts\start-backend.ps1'`""

Write-Host '[dev] Starting mobile...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"& '$Root\scripts\start-mobile.ps1'`""

Write-Host '[dev] Both processes launched in separate windows.' -ForegroundColor Green
