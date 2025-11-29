#!/bin/bash
# Memory Bank MCP Server - Automatic Setup Script for Linux/macOS
# This script installs and configures the Memory Bank MCP Server for Cursor

echo "🚀 Memory Bank MCP Server - Automatic Setup"
echo "============================================="
echo ""

# Define paths
MEMORY_BANK_ROOT="e:/May Prodgekt/devtycoon-ai_-путь-программиста/memory-bank"
CURSOR_SETTINGS_DIR="$HOME/Library/Application Support/Cursor/User/globalStorage/kilocode.kilo-code/settings"
MCP_SETTINGS_FILE="$CURSOR_SETTINGS_DIR/mcp_settings.json"

echo "📂 Memory Bank Root: $MEMORY_BANK_ROOT"
echo "📂 Cursor Settings Dir: $CURSOR_SETTINGS_DIR"
echo ""

# Step 1: Verify Memory Bank directory exists
if [ ! -d "$MEMORY_BANK_ROOT" ]; then
    echo "❌ Error: Memory Bank directory not found at $MEMORY_BANK_ROOT"
    exit 1
fi
echo "✅ Memory Bank directory found"

# Step 2: Create Cursor settings directory if it doesn't exist
if [ ! -d "$CURSOR_SETTINGS_DIR" ]; then
    echo "📁 Creating Cursor settings directory..."
    mkdir -p "$CURSOR_SETTINGS_DIR"
    echo "✅ Directory created"
else
    echo "✅ Cursor settings directory exists"
fi

# Step 3: Create or update mcp_settings.json
echo ""
echo "📝 Configuring MCP settings..."

cat > "$MCP_SETTINGS_FILE" << EOF
{
  "allpepper-memory-bank": {
    "command": "npx",
    "args": ["-y", "@allpepper/memory-bank-mcp"],
    "env": {
      "MEMORY_BANK_ROOT": "$MEMORY_BANK_ROOT"
    },
    "disabled": false,
    "autoApprove": [
      "memory_bank_read",
      "memory_bank_write",
      "memory_bank_update",
      "list_projects",
      "list_project_files"
    ]
  }
}
EOF

echo "✅ MCP settings file created/updated at:"
echo "   $MCP_SETTINGS_FILE"

# Step 4: Install Memory Bank MCP Server via npx
echo ""
echo "📦 Installing Memory Bank MCP Server..."
echo "   Running: npx -y @smithery/cli install @alioshr/memory-bank-mcp --client cursor"

if npx -y @smithery/cli install @alioshr/memory-bank-mcp --client cursor; then
    echo "✅ Memory Bank MCP Server installed successfully"
else
    echo "⚠️  Warning: Smithery installation failed. Manual setup may be required."
    echo "   You can still use the MCP server via the settings file."
fi

# Step 5: Display summary
echo ""
echo "============================================="
echo "✅ Setup Complete!"
echo "============================================="
echo ""
echo "📋 Next Steps:"
echo "   1. Restart Cursor IDE"
echo "   2. Open Cursor Settings → Features → MCP Servers"
echo "   3. Verify 'allpepper-memory-bank' is listed and enabled"
echo ""
echo "🔧 MCP Server Configuration:"
echo "   Command: npx -y @allpepper/memory-bank-mcp"
echo "   Root: $MEMORY_BANK_ROOT"
echo ""
echo "📚 Available Operations:"
echo "   • memory_bank_read - Read memory bank files"
echo "   • memory_bank_write - Create new files"
echo "   • memory_bank_update - Update existing files"
echo "   • list_projects - List available projects"
echo "   • list_project_files - List files within a project"
echo ""
echo "🎉 You're all set! Restart Cursor to activate the MCP server."
