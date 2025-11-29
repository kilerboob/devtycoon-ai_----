# PostgreSQL Setup Script for DeVOS/CyberNation
# Installs PostgreSQL 16 and configures it for the project

Write-Host "🐘 PostgreSQL Setup - DeVOS/CyberNation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check for existing installation
Write-Host "🔍 Checking for existing PostgreSQL..." -ForegroundColor Yellow
$service = Get-Service postgresql -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "⚠️  Found existing 'postgresql' service." -ForegroundColor Yellow
    Write-Host "   Status: $($service.Status)"
    
    # Check if path exists
    try {
        $path = (Get-WmiObject win32_service | Where-Object { $_.Name -eq 'postgresql' }).PathName
        if ($path -match '"(.*?)"') { $path = $matches[1] }
        
        if (-Not (Test-Path $path)) {
            Write-Host "❌ Service points to non-existent path: $path" -ForegroundColor Red
            Write-Host "   This is a 'ghost' service. You may need to delete it manually:" -ForegroundColor White
            Write-Host "   sc delete postgresql" -ForegroundColor Gray
        }
    }
    catch {}
}

# Step 2: Install PostgreSQL via Winget
Write-Host ""
Write-Host "📦 Installing PostgreSQL 16..." -ForegroundColor Yellow
Write-Host "   This may ask for Administrator privileges." -ForegroundColor Cyan

# Define password
$DB_PASSWORD = "553837"

try {
    # Install with specific password
    # Note: EDB installer arguments for unattended install
    $installArgs = "--unattendedmodeui minimal --mode unattended --superpassword $DB_PASSWORD --servicepassword $DB_PASSWORD"
    
    winget install PostgreSQL.PostgreSQL --version 16 --override "$installArgs"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL installed successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Winget exited with code $LASTEXITCODE. Check if installed manually." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Installation failed: $_" -ForegroundColor Red
}

# Step 3: Verify Installation
Write-Host ""
Write-Host "🔍 Verifying installation..." -ForegroundColor Yellow

# Refresh env vars
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "✅ 'psql' found in PATH" -ForegroundColor Green
    
    # Try connection
    Write-Host "🔌 Testing connection..." -ForegroundColor Yellow
    $env:PGPASSWORD = $DB_PASSWORD
    
    try {
        psql -U postgres -c "SELECT version();"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Connection successful!" -ForegroundColor Green
            
            # Create Database
            Write-Host "🗄️  Creating database 'devtycoon_angverse'..." -ForegroundColor Yellow
            psql -U postgres -c "CREATE DATABASE devtycoon_angverse;"
            Write-Host "✅ Database created (or already exists)" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Connection failed. Service might not be running." -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error connecting: $_" -ForegroundColor Red
    }
}
else {
    Write-Host "⚠️  'psql' not found in PATH. You may need to restart your terminal." -ForegroundColor Yellow
    Write-Host "   Default path: C:\Program Files\PostgreSQL\16\bin" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Setup Finished" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. If installation failed, install manually from: https://www.postgresql.org/download/windows/" -ForegroundColor White
Write-Host "   2. Set password to: $DB_PASSWORD" -ForegroundColor White
Write-Host "   3. Run 'npm run dev' to start backend" -ForegroundColor White
