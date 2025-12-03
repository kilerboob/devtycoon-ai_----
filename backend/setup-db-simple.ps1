# Simplified Database Setup - No Admin Rights Required
# This script will help you set up the database when you have the correct PostgreSQL password

Write-Host "=== DevTycoon Database Setup (Simplified) ===" -ForegroundColor Cyan
Write-Host ""

# Add PostgreSQL to PATH
$env:PATH += ";C:\Program Files\PostgreSQL\16\bin"

# Ask for password
Write-Host "Enter PostgreSQL password (default from installation): " -NoNewline -ForegroundColor Yellow
$password = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ([string]::IsNullOrEmpty($plainPassword)) {
    Write-Host "Using empty password..." -ForegroundColor Yellow
    $env:PGPASSWORD = ""
} else {
    $env:PGPASSWORD = $plainPassword
}

Write-Host "`nTesting connection..." -ForegroundColor Yellow
$testConnection = psql -U postgres -h 127.0.0.1 -c "SELECT version();" 2>&1

if ($testConnection -like "*password authentication failed*" -or $testConnection -like "*Connection refused*") {
    Write-Host "Connection failed. Please check:" -ForegroundColor Red
    Write-Host "1. PostgreSQL service is running (Get-Service postgresql-x64-16)" -ForegroundColor Yellow
    Write-Host "2. Password is correct" -ForegroundColor Yellow
    Write-Host "3. Run this in PowerShell as Administrator if needed" -ForegroundColor Yellow
    exit 1
}

Write-Host "Connection successful!" -ForegroundColor Green

# Create database
Write-Host "`nCreating database..." -ForegroundColor Yellow
$dbCheck = psql -U postgres -h 127.0.0.1 -t -c "SELECT 1 FROM pg_database WHERE datname='devtycoon_angverse';" 2>&1

if ($dbCheck -notmatch "1") {
    psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE devtycoon_angverse;" 2>&1
    if ($?) {
        Write-Host "Database created successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to create database" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Database already exists" -ForegroundColor Green
}

# Apply schema
Write-Host "`nApplying SQL schema..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$schemaFile = Join-Path $scriptDir "sql\sync_schema.sql"

if (Test-Path $schemaFile) {
    psql -U postgres -h 127.0.0.1 -d devtycoon_angverse -f $schemaFile 2>&1
    if ($?) {
        Write-Host "`nSetup completed successfully!" -ForegroundColor Green
        Write-Host "Database 'devtycoon_angverse' is ready!" -ForegroundColor Cyan
        Write-Host "`nYou can now start the backend server:" -ForegroundColor Yellow
        Write-Host "  cd backend" -ForegroundColor White
        Write-Host "  npm install" -ForegroundColor White
        Write-Host "  npm start" -ForegroundColor White
    } else {
        Write-Host "Schema application had errors - check output above" -ForegroundColor Yellow
    }
} else {
    Write-Host "Schema file not found: $schemaFile" -ForegroundColor Red
    exit 1
}
