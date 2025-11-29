# Unified Memory System for DeVOS/CyberNation
# PowerShell Setup Script - Integrates Memory Bank MCP + Rememberizer Vector Store MCP

Write-Host "🧠 Unified Memory System Setup - DeVOS/CyberNation" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
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
}
else {
    Write-Host "✅ Cursor settings directory exists" -ForegroundColor Green
}

# Step 3: Prompt for Rememberizer API key
Write-Host ""
Write-Host "🔑 Rememberizer Vector Store Configuration" -ForegroundColor Yellow
Write-Host "   To use Rememberizer Vector Store, you need an API key." -ForegroundColor White
Write-Host "   Get one at: https://docs.rememberizer.ai/developer/vector-stores" -ForegroundColor Cyan
Write-Host ""
$rememberizerApiKey = Read-Host "   Enter your Rememberizer API key (or press Enter to skip)"

# Step 3.5: Prompt for Context7 API key
Write-Host ""
Write-Host "🔑 Context7 Configuration (Up-to-date Library Docs)" -ForegroundColor Yellow
Write-Host "   To use Context7 for up-to-date library documentation, you need an API key." -ForegroundColor White
Write-Host "   Get one at: https://context7.com" -ForegroundColor Cyan
Write-Host ""
$context7ApiKey = Read-Host "   Enter your Context7 API key (or press Enter to skip)"


# Step 4: Create unified MCP settings
Write-Host ""
Write-Host "📝 Configuring unified MCP settings..." -ForegroundColor Yellow

$mcpConfig = @{
    "allpepper-memory-bank" = @{
        command     = "npx"
        args        = @("-y", "@allpepper/memory-bank-mcp")
        env         = @{
            MEMORY_BANK_ROOT = $MEMORY_BANK_ROOT
        }
        disabled    = $false
        autoApprove = @(
            "memory_bank_read",
            "memory_bank_write",
            "memory_bank_update",
            "list_projects",
            "list_project_files"
        )
    }
}

# Add Rememberizer if API key provided
if ($rememberizerApiKey -and $rememberizerApiKey.Trim() -ne "") {
    $mcpConfig["rememberizer-vectordb"] = @{
        command     = "uvx"
        args        = @("mcp-rememberizer-vectordb")
        env         = @{
            REMEMBERIZER_VECTOR_STORE_API_KEY = $rememberizerApiKey.Trim()
        }
        disabled    = $false
        autoApprove = @(
            "rememberizer_vectordb_search",
            "rememberizer_vectordb_agentic_search",
            "rememberizer_vectordb_list_documents",
            "rememberizer_vectordb_information",
            "rememberizer_vectordb_create_document"
        )
    }
    Write-Host "✅ Rememberizer Vector Store configured" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Skipping Rememberizer Vector Store (no API key provided)" -ForegroundColor Yellow
}

# Add Context7 if API key provided
if ($context7ApiKey -and $context7ApiKey.Trim() -ne "") {
    $mcpConfig["context7"] = @{
        type        = "streamable-http"
        url         = "https://mcp.context7.com/mcp"
        headers     = @{
            Authorization = "Bearer $($context7ApiKey.Trim())"
        }
        alwaysAllow = @()
        disabled    = $false
    }
    Write-Host "✅ Context7 MCP configured" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Skipping Context7 MCP (no API key provided)" -ForegroundColor Yellow
}

# Convert to JSON and save
$mcpConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $MCP_SETTINGS_FILE -Encoding UTF8
Write-Host "✅ MCP settings file created/updated at:" -ForegroundColor Green
Write-Host "   $MCP_SETTINGS_FILE" -ForegroundColor Cyan

# Step 5: Install Memory Bank MCP Server
Write-Host ""
Write-Host "📦 Installing Memory Bank MCP Server..." -ForegroundColor Yellow
Write-Host "   Running: npx -y @smithery/cli install @alioshr/memory-bank-mcp --client cursor" -ForegroundColor Cyan

try {
    npx -y @smithery/cli install @alioshr/memory-bank-mcp --client cursor 2>&1 | Out-Null
    Write-Host "✅ Memory Bank MCP Server installed successfully" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Warning: Smithery installation failed. Manual setup may be required." -ForegroundColor Yellow
}

# Step 6: Install Rememberizer if API key provided
if ($rememberizerApiKey -and $rememberizerApiKey.Trim() -ne "") {
    Write-Host ""
    Write-Host "📦 Installing Rememberizer Vector Store MCP Server..." -ForegroundColor Yellow
    Write-Host "   Running: uvx mcp-rememberizer-vectordb" -ForegroundColor Cyan
    
    try {
        # Check if uvx is installed
        $uvxCheck = Get-Command uvx -ErrorAction SilentlyContinue
        if ($uvxCheck) {
            uvx mcp-rememberizer-vectordb --help 2>&1 | Out-Null
            Write-Host "✅ Rememberizer Vector Store MCP Server installed successfully" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️  Warning: uvx not found. Install it with: pip install uv" -ForegroundColor Yellow
            Write-Host "   Or use: pipx install uv" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "⚠️  Warning: Rememberizer installation check failed." -ForegroundColor Yellow
    }
}

# Step 7: Display summary
Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "✅ Unified Memory System Setup Complete!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Configured MCP Servers:" -ForegroundColor Yellow
Write-Host "   1. Memory Bank MCP (File-based)" -ForegroundColor White
Write-Host "      • Stores: Project documentation, REDMAP, schemas, API plans" -ForegroundColor Gray
Write-Host "      • Access: Local file system" -ForegroundColor Gray
Write-Host ""

if ($rememberizerApiKey -and $rememberizerApiKey.Trim() -ne "") {
    Write-Host "   2. Rememberizer Vector Store MCP (Vector DB)" -ForegroundColor White
    Write-Host "      • Stores: Long-term memory, conversation context, semantic search" -ForegroundColor Gray
    Write-Host "      • Access: Cloud API (Rememberizer)" -ForegroundColor Gray
    Write-Host ""
}

if ($context7ApiKey -and $context7ApiKey.Trim() -ne "") {
    Write-Host "   3. Context7 MCP (Library Docs)" -ForegroundColor White
    Write-Host "      • Stores: Up-to-date documentation for external libraries" -ForegroundColor Gray
    Write-Host "      • Access: Cloud API (Context7)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "🔧 Memory System Architecture:" -ForegroundColor Yellow
Write-Host "   ┌─────────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "   │         Unified Memory System               │" -ForegroundColor Cyan
Write-Host "   ├─────────────────────────────────────────────┤" -ForegroundColor Cyan
Write-Host "   │  Memory Bank MCP (Structured Docs)          │" -ForegroundColor White
Write-Host "   │  • REDMAP v6.0                              │" -ForegroundColor Gray
Write-Host "   │  • Database Schema                          │" -ForegroundColor Gray
Write-Host "   │  • API Plans                                │" -ForegroundColor Gray
Write-Host "   │  • AI Rules & Orchestrator                  │" -ForegroundColor Gray
Write-Host "   ├─────────────────────────────────────────────┤" -ForegroundColor Cyan

if ($rememberizerApiKey -and $rememberizerApiKey.Trim() -ne "") {
    Write-Host "   │  Rememberizer Vector Store (Semantic)       │" -ForegroundColor White
    Write-Host "   │  • Conversation History                     │" -ForegroundColor Gray
    Write-Host "   │  • Game Events & Lore                       │" -ForegroundColor Gray
    Write-Host "   ├─────────────────────────────────────────────┤" -ForegroundColor Cyan
}

if ($context7ApiKey -and $context7ApiKey.Trim() -ne "") {
    Write-Host "   │  Context7 MCP (External Docs)               │" -ForegroundColor White
    Write-Host "   │  • React, Next.js, PostgreSQL               │" -ForegroundColor Gray
    Write-Host "   │  • No hallucinations                        │" -ForegroundColor Gray
    Write-Host "   └─────────────────────────────────────────────┘" -ForegroundColor Cyan
}
else {
    Write-Host "   └─────────────────────────────────────────────┘" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📚 Available Operations:" -ForegroundColor Yellow
Write-Host "   Memory Bank MCP:" -ForegroundColor White
Write-Host "   • memory_bank_read - Read project documentation" -ForegroundColor Gray
Write-Host "   • memory_bank_write - Create new files" -ForegroundColor Gray
Write-Host "   • memory_bank_update - Update existing files" -ForegroundColor Gray
Write-Host "   • list_projects - List available projects" -ForegroundColor Gray
Write-Host "   • list_project_files - List files within a project" -ForegroundColor Gray
Write-Host ""

if ($rememberizerApiKey -and $rememberizerApiKey.Trim() -ne "") {
    Write-Host "   Rememberizer Vector Store MCP:" -ForegroundColor White
    Write-Host "   • rememberizer_vectordb_search - Semantic search" -ForegroundColor Gray
    Write-Host "   • rememberizer_vectordb_create_document - Store new memories" -ForegroundColor Gray
    Write-Host ""
}

if ($context7ApiKey -and $context7ApiKey.Trim() -ne "") {
    Write-Host "   Context7 MCP:" -ForegroundColor White
    Write-Host "   • resolve-library-id - Find library ID" -ForegroundColor Gray
    Write-Host "   • get-library-docs - Fetch documentation" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart Cursor IDE" -ForegroundColor White
Write-Host "   2. Open Cursor Settings → Features → MCP Servers" -ForegroundColor White
Write-Host "   3. Verify both MCP servers are listed and enabled" -ForegroundColor White
Write-Host "   4. In Cursor, run: 'read memory bank', 'search memory', and 'use context7' to confirm connectivity" -ForegroundColor White
if (-Not ($rememberizerApiKey -and $rememberizerApiKey.Trim() -ne "") -or -Not ($context7ApiKey -and $context7ApiKey.Trim() -ne "")) {
    Write-Host "   5. (Optional) Re-run this script with API keys to enable full functionality" -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 You're all set! Restart Cursor to activate the unified memory system." -ForegroundColor Green

