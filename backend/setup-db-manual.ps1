# Manual PostgreSQL Setup Script
# Run this in PowerShell as Administrator

Write-Host "=== PostgreSQL Database Setup ===" -ForegroundColor Cyan

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "WARNING: This script needs to run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit
}

# Add PostgreSQL to PATH
$env:PATH += ";C:\Program Files\PostgreSQL\16\bin"

Write-Host "`n1. Stopping PostgreSQL service..." -ForegroundColor Yellow
Stop-Service postgresql-x64-16 -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "2. Modifying pg_hba.conf for temporary trust access..." -ForegroundColor Yellow
$pgHba = "C:\Program Files\PostgreSQL\16\data\pg_hba.conf"
$pgHbaBackup = "$pgHba.original"

# Backup original if not exists
if (-not (Test-Path $pgHbaBackup)) {
    Copy-Item $pgHba $pgHbaBackup
}

# Read and modify
$content = Get-Content $pgHba
$newContent = $content | ForEach-Object {
    if ($_ -match "^host\s+all\s+all\s+127\.0\.0\.1/32") {
        "host    all             all             127.0.0.1/32            trust"
    } elseif ($_ -match "^host\s+all\s+all\s+::1/128") {
        "host    all             all             ::1/128                 trust"
    } else {
        $_
    }
}
$newContent | Set-Content $pgHba

Write-Host "3. Starting PostgreSQL service..." -ForegroundColor Yellow
Start-Service postgresql-x64-16
Start-Sleep -Seconds 3

Write-Host "4. Setting password for postgres user..." -ForegroundColor Yellow
$password = "553837"
psql -U postgres -c "ALTER USER postgres WITH PASSWORD '$password';"

Write-Host "5. Creating devtycoon_angverse database..." -ForegroundColor Yellow
$dbExists = psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='devtycoon_angverse';"
if ($dbExists -notmatch "1") {
    psql -U postgres -c "CREATE DATABASE devtycoon_angverse;"
    Write-Host "Database created successfully" -ForegroundColor Green
} else {
    Write-Host "Database already exists" -ForegroundColor Green
}

Write-Host "6. Applying SQL schema..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
psql -U postgres -d devtycoon_angverse -f "$scriptDir\sql\sync_schema.sql"

Write-Host "7. Restoring password authentication..." -ForegroundColor Yellow
Copy-Item $pgHbaBackup $pgHba -Force
Restart-Service postgresql-x64-16

Write-Host "`nSetup completed successfully!" -ForegroundColor Green
Write-Host "Database 'devtycoon_angverse' is ready to use" -ForegroundColor Green
Write-Host "Password for postgres user: $password" -ForegroundColor Cyan
