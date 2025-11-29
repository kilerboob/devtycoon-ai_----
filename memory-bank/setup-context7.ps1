# Context7 MCP Setup Script for DeVOS/CyberNation
# Adds Context7 (up-to-date library docs) to your MCP configuration

Write-Host "🔧 Context7 MCP Setup - DeVOS/CyberNation" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Define paths
$PROJECT_ROOT = "e:/May Prodgekt/devtycoon-ai_-путь-программиста"
$KILOCODE_DIR = "$PROJECT_ROOT/.kilocode"
$MCP_CONFIG_FILE = "$KILOCODE_DIR/mcp.json"
$CURSOR_SETTINGS_DIR = "$env:APPDATA\Cursor\User\globalStorage\kilocode.kilo-code\settings"
$GLOBAL_MCP_SETTINGS = "$CURSOR_SETTINGS_DIR\mcp_settings.json"

Write-Host "📂 Project Root: $PROJECT_ROOT" -ForegroundColor Yellow
Write-Host "📂 Kilo Code Config: $MCP_CONFIG_FILE" -ForegroundColor Yellow
Write-Host ""

# Step 1: Prompt for API key
Write-Host "🔑 Context7 API Key Required" -ForegroundColor Yellow
Write-Host "   Get your API key at: https://context7.com" -ForegroundColor Cyan
Write-Host ""
$apiKey = Read-Host "   Enter your Context7 API key (or press Enter to skip)"

if (-Not $apiKey -or $apiKey.Trim() -eq "") {
    Write-Host ""
    Write-Host "⚠️  No API key provided. Skipping Context7 setup." -ForegroundColor Yellow
    Write-Host "   You can run this script again later with an API key." -ForegroundColor White
    exit 0
}

# Step 2: Choose configuration level
Write-Host ""
Write-Host "📋 Configuration Level" -ForegroundColor Yellow
Write-Host "   1. Project-level (.kilocode/mcp.json) - Recommended for team projects" -ForegroundColor White
Write-Host "   2. Global (mcp_settings.json) - Applies to all projects" -ForegroundColor White
Write-Host ""
$configChoice = Read-Host "   Choose configuration level (1 or 2, default: 1)"

if (-Not $configChoice -or $configChoice -eq "1") {
    $configLevel = "project"
    $configFile = $MCP_CONFIG_FILE
}
else {
    $configLevel = "global"
    $configFile = $GLOBAL_MCP_SETTINGS
}

Write-Host ""
Write-Host "📝 Configuring Context7 at $configLevel level..." -ForegroundColor Yellow

# Step 3: Create directory if needed
if ($configLevel -eq "project") {
    if (-Not (Test-Path $KILOCODE_DIR)) {
        Write-Host "📁 Creating .kilocode directory..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $KILOCODE_DIR -Force | Out-Null
        Write-Host "✅ Directory created" -ForegroundColor Green
    }
}

# Step 4: Create or update configuration
$context7Config = @{
    type        = "streamable-http"
    url         = "https://mcp.context7.com/mcp"
    headers     = @{
        Authorization = "Bearer $($apiKey.Trim())"
    }
    alwaysAllow = @()
    disabled    = $false
}

# Check if config file exists
if (Test-Path $configFile) {
    Write-Host "📄 Existing configuration found. Updating..." -ForegroundColor Yellow
    
    try {
        $existingConfig = Get-Content $configFile -Raw | ConvertFrom-Json
        
        # Add or update context7 server
        if (-Not $existingConfig.mcpServers) {
            $existingConfig | Add-Member -MemberType NoteProperty -Name "mcpServers" -Value @{}
        }
        
        $existingConfig.mcpServers | Add-Member -MemberType NoteProperty -Name "context7" -Value $context7Config -Force
        
        $existingConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $configFile -Encoding UTF8
        Write-Host "✅ Configuration updated" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Warning: Could not parse existing config. Creating new one..." -ForegroundColor Yellow
        $newConfig = @{
            mcpServers = @{
                context7 = $context7Config
            }
        }
        $newConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $configFile -Encoding UTF8
        Write-Host "✅ New configuration created" -ForegroundColor Green
    }
}
else {
    Write-Host "📄 Creating new configuration file..." -ForegroundColor Yellow
    $newConfig = @{
        mcpServers = @{
            context7 = $context7Config
        }
    }
    $newConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $configFile -Encoding UTF8
    Write-Host "✅ Configuration file created" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Context7 MCP configured at:" -ForegroundColor Green
Write-Host "   $configFile" -ForegroundColor Cyan

# Step 5: Display summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Context7 MCP Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Configuration Details:" -ForegroundColor Yellow
Write-Host "   Type: Remote (streamable-http)" -ForegroundColor White
Write-Host "   URL: https://mcp.context7.com/mcp" -ForegroundColor White
Write-Host "   Level: $configLevel" -ForegroundColor White
Write-Host ""
Write-Host "🔨 Available Tools:" -ForegroundColor Yellow
Write-Host "   • resolve-library-id - Convert library name to Context7 ID" -ForegroundColor Gray
Write-Host "   • get-library-docs - Fetch up-to-date documentation" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 How to Use:" -ForegroundColor Yellow
Write-Host "   Add 'use context7' to your prompts:" -ForegroundColor White
Write-Host ""
Write-Host "   Example:" -ForegroundColor Cyan
Write-Host "   'Create a Next.js middleware for JWT auth. use context7'" -ForegroundColor Gray
Write-Host "   'Configure PostgreSQL connection pooling. use context7'" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart Cursor IDE" -ForegroundColor White

if ($configLevel -eq "project") {
    Write-Host "   2. Open Settings → MCP Servers" -ForegroundColor White
    Write-Host "   3. Click 'Refresh MCP Servers'" -ForegroundColor White
    Write-Host "   4. Verify 'context7' is listed and enabled" -ForegroundColor White
}
else {
    Write-Host "   2. Verify 'context7' appears in Settings → MCP Servers" -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 Done! Context7 is now part of your Unified Memory System." -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Context7 works best for external libraries (React, Next.js, PostgreSQL)." -ForegroundColor Cyan
Write-Host "    Use Memory Bank MCP for internal project documentation." -ForegroundColor Cyan
