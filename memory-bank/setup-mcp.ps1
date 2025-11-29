# Memory Bank MCP Server - Automatic Setup Script for Windows
# This script installs and configures the Memory Bank MCP Server for Cursor

Write-Host "🚀 Memory Bank MCP Server - Automatic Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Define paths
$MEMORY_BANK_ROOT = "e:/May Prodgekt/devtycoon-ai_-путь-программиста/memory-bank"
$CURSOR_SETTINGS_DIR = "$env:APPDATA\Cursor\User\globalStorage\kilocode.kilo-code\settings"
$MCP_SETTINGS_FILE = "$CURSOR_SETTINGS_DIR\mcp_settings.json"

Write-Host "📂 Memory Bank Root: $MEMORY_BANK_ROOT" -ForegroundColor Yellow
Write-Host "📂 Cursor Settings Dir: $CURSOR_SETTINGS_DIR" -ForegroundColor Yellow
Write-Host ""

# Step 1: Verify Memory Bank directory exists
if (-Not (Test-Path $MEMORY_BANK_ROOT)) {
    Write-Host "❌ Error: Memory Bank directory not found at $MEMORY_BANK_ROOT" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Memory Bank directory found" -ForegroundColor Green

# Step 2: Create Cursor settings directory if it doesn't exist
if (-Not (Test-Path $CURSOR_SETTINGS_DIR)) {
    Write-Host "📁 Creating Cursor settings directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $CURSOR_SETTINGS_DIR -Force | Out-Null
    Write-Host "✅ Directory created" -ForegroundColor Green
} else {
    Write-Host "✅ Cursor settings directory exists" -ForegroundColor Green
}

# Step 3: Create or update mcp_settings.json
Write-Host ""
Write-Host "📝 Configuring MCP settings..." -ForegroundColor Yellow

$mcpConfig = @{
    "allpepper-memory-bank" = @{
        command = "npx"
        args = @("-y", "@allpepper/memory-bank-mcp")
        env = @{
            MEMORY_BANK_ROOT = $MEMORY_BANK_ROOT
        }
        disabled = $false
        autoApprove = @(
            "memory_bank_read",
            "memory_bank_write",
            "memory_bank_update",
            "list_projects",
            "list_project_files"
        )
    }
}

# Convert to JSON and save
$mcpConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $MCP_SETTINGS_FILE -Encoding UTF8
Write-Host "✅ MCP settings file created/updated at:" -ForegroundColor Green
Write-Host "   $MCP_SETTINGS_FILE" -ForegroundColor Cyan

# Step 4: Install Memory Bank MCP Server via npx
Write-Host ""
Write-Host "📦 Installing Memory Bank MCP Server..." -ForegroundColor Yellow
Write-Host "   Running: npx -y @smithery/cli install @alioshr/memory-bank-mcp --client cursor" -ForegroundColor Cyan

try {
    npx -y @smithery/cli install @alioshr/memory-bank-mcp --client cursor
    Write-Host "✅ Memory Bank MCP Server installed successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Smithery installation failed. Manual setup may be required." -ForegroundColor Yellow
    Write-Host "   You can still use the MCP server via the settings file." -ForegroundColor Yellow
}

# Step 5: Display summary
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart Cursor IDE" -ForegroundColor White
Write-Host "   2. Open Cursor Settings → Features → MCP Servers" -ForegroundColor White
Write-Host "   3. Verify 'allpepper-memory-bank' is listed and enabled" -ForegroundColor White
Write-Host ""
Write-Host "🔧 MCP Server Configuration:" -ForegroundColor Yellow
Write-Host "   Command: npx -y @allpepper/memory-bank-mcp" -ForegroundColor White
Write-Host "   Root: $MEMORY_BANK_ROOT" -ForegroundColor White
Write-Host ""
Write-Host "📚 Available Operations:" -ForegroundColor Yellow
Write-Host "   • memory_bank_read - Read memory bank files" -ForegroundColor White
Write-Host "   • memory_bank_write - Create new files" -ForegroundColor White
Write-Host "   • memory_bank_update - Update existing files" -ForegroundColor White
Write-Host "   • list_projects - List available projects" -ForegroundColor White
Write-Host "   • list_project_files - List files within a project" -ForegroundColor White
Write-Host ""
Write-Host "🎉 You're all set! Restart Cursor to activate the MCP server." -ForegroundColor Green
