#!/bin/bash
# Unified Memory System for DeVOS/CyberNation
# Bash Setup Script - Integrates Memory Bank MCP + Rememberizer Vector Store MCP + Context7 MCP

echo "?? Unified Memory System Setup - DeVOS/CyberNation"
echo "===================================================="
echo ""

# Define paths
MEMORY_BANK_ROOT="e:/May Prodgekt/devtycoon-ai_-����-�ணࠬ����/memory-bank"
CURSOR_SETTINGS_DIR="$HOME/Library/Application Support/Cursor/User/globalStorage/kilocode.kilo-code/settings"
MCP_SETTINGS_FILE="$CURSOR_SETTINGS_DIR/mcp_settings.json"

echo "?? Memory Bank Root: $MEMORY_BANK_ROOT"
echo "?? Cursor Settings Dir: $CURSOR_SETTINGS_DIR"
echo ""

# Step 1: Verify Memory Bank directory exists
if [ ! -d "$MEMORY_BANK_ROOT" ]; then
    echo "? Error: Memory Bank directory not found at $MEMORY_BANK_ROOT"
    exit 1
fi
echo "? Memory Bank directory found"

# Step 2: Create Cursor settings directory if it doesn't exist
if [ ! -d "$CURSOR_SETTINGS_DIR" ]; then
    echo "?? Creating Cursor settings directory..."
    mkdir -p "$CURSOR_SETTINGS_DIR"
    echo "? Directory created"
else
    echo "? Cursor settings directory exists"
fi

# Step 3: Prompt for Rememberizer API key
echo ""
echo "?? Rememberizer Vector Store Configuration"
echo "   To use Rememberizer Vector Store, you need an API key."
echo "   Get one at: https://docs.rememberizer.ai/developer/vector-stores"
echo ""
read -r -p "   Enter your Rememberizer API key (or press Enter to skip): " REMEMBERIZER_API_KEY

# Step 3.5: Prompt for Context7 API key
echo ""
echo "?? Context7 Configuration (Up-to-date Library Docs)"
echo "   To use Context7, you need an API key from https://context7.com"
echo ""
read -r -p "   Enter your Context7 API key (or press Enter to skip): " CONTEXT7_API_KEY

# Step 4: Create unified MCP settings
echo ""
echo "?? Configuring unified MCP settings..."
MEMORY_BANK_ROOT="$MEMORY_BANK_ROOT" \
MCP_SETTINGS_FILE="$MCP_SETTINGS_FILE" \
REMEMBERIZER_API_KEY="$REMEMBERIZER_API_KEY" \
CONTEXT7_API_KEY="$CONTEXT7_API_KEY" \
python - <<'PY'
import json, os, pathlib
memory_bank_root = os.environ["MEMORY_BANK_ROOT"]
settings_file = pathlib.Path(os.environ["MCP_SETTINGS_FILE"])
settings_file.parent.mkdir(parents=True, exist_ok=True)
config = {
    "allpepper-memory-bank": {
        "command": "npx",
        "args": ["-y", "@allpepper/memory-bank-mcp"],
        "env": {
            "MEMORY_BANK_ROOT": memory_bank_root
        },
        "disabled": False,
        "autoApprove": [
            "memory_bank_read",
            "memory_bank_write",
            "memory_bank_update",
            "list_projects",
            "list_project_files"
        ]
    }
}
rememberizer_api_key = os.environ.get("REMEMBERIZER_API_KEY", "").strip()
if rememberizer_api_key:
    config["rememberizer-vectordb"] = {
        "command": "uvx",
        "args": ["mcp-rememberizer-vectordb"],
        "env": {
            "REMEMBERIZER_VECTOR_STORE_API_KEY": rememberizer_api_key
        },
        "disabled": False,
        "autoApprove": [
            "rememberizer_vectordb_search",
            "rememberizer_vectordb_agentic_search",
            "rememberizer_vectordb_list_documents",
            "rememberizer_vectordb_information",
            "rememberizer_vectordb_create_document"
        ]
    }
context7_api_key = os.environ.get("CONTEXT7_API_KEY", "").strip()
if context7_api_key:
    config["context7"] = {
        "type": "streamable-http",
        "url": "https://mcp.context7.com/mcp",
        "headers": {
            "Authorization": f"Bearer {context7_api_key}"
        },
        "alwaysAllow": [],
        "disabled": False
    }
settings_file.write_text(json.dumps(config, indent=2), encoding="utf-8")
PY

echo "? MCP settings file created/updated at:"
echo "   $MCP_SETTINGS_FILE"

echo "? Memory Bank MCP configured"
if [ -n "$REMEMBERIZER_API_KEY" ]; then
    echo "? Rememberizer Vector Store configured"
else
    echo "??  Skipping Rememberizer Vector Store (no API key provided)"
fi
if [ -n "$CONTEXT7_API_KEY" ]; then
    echo "? Context7 MCP configured"
else
    echo "??  Skipping Context7 MCP (no API key provided)"
fi

# Step 5: Install Memory Bank MCP Server
echo ""
echo "?? Installing Memory Bank MCP Server..."
echo "   Running: npx -y @smithery/cli install @alioshr/memory-bank-mcp --client cursor"
if npx -y @smithery/cli install @alioshr/memory-bank-mcp --client cursor > /dev/null 2>&1; then
    echo "? Memory Bank MCP Server installed successfully"
else
    echo "??  Warning: Smithery installation failed. Manual setup may be required."
fi

# Step 6: Install Rememberizer if API key provided
if [ -n "$REMEMBERIZER_API_KEY" ]; then
    echo ""
    echo "?? Installing Rememberizer Vector Store MCP Server..."
    echo "   Running: uvx mcp-rememberizer-vectordb"
    if command -v uvx > /dev/null 2>&1; then
        if uvx mcp-rememberizer-vectordb --help > /dev/null 2>&1; then
            echo "? Rememberizer Vector Store MCP Server installed successfully"
        else
            echo "??  Warning: Rememberizer installation check failed."
        fi
    else
        echo "??  Warning: uvx not found. Install it with: pip install uv"
        echo "   Or use: pipx install uv"
    fi
fi

# Step 7: Display summary
echo ""
echo "===================================================="
echo "? Unified Memory System Setup Complete!"
echo "===================================================="
echo ""
echo "?? Configured MCP Servers:"
echo "   1. Memory Bank MCP (File-based)"
echo "      - Stores: Project documentation, REDMAP, schemas, API plans"
echo "      - Access: Local file system"
echo ""
if [ -n "$REMEMBERIZER_API_KEY" ]; then
    echo "   2. Rememberizer Vector Store MCP (Vector DB)"
    echo "      - Stores: Long-term memory, conversation context, semantic search"
    echo "      - Access: Cloud API (Rememberizer)"
    echo ""
fi
if [ -n "$CONTEXT7_API_KEY" ]; then
    echo "   3. Context7 MCP (Library Docs)"
    echo "      - Stores: Up-to-date external documentation"
    echo "      - Access: Cloud API (Context7)"
    echo ""
fi

echo "?? Memory System Architecture:"
echo "   ���������������������������������������������Ŀ"
echo "   �         Unified Memory System               �"
echo "   ���������������������������������������������Ĵ"
echo "   �  Memory Bank MCP (Structured Docs)          �"
echo "   �  - REDMAP v6.0                            �"
echo "   �  - Database Schema                        �"
echo "   �  - API Plans                              �"
echo "   �  - AI Rules & Orchestrator                �"
echo "   ���������������������������������������������Ĵ"
if [ -n "$REMEMBERIZER_API_KEY" ]; then
    echo "   �  Rememberizer Vector Store (Semantic)       �"
    echo "   �  - Conversation History                   �"
    echo "   �  - Game Events & Lore                     �"
    echo "   ���������������������������������������������Ĵ"
fi
if [ -n "$CONTEXT7_API_KEY" ]; then
    echo "   �  Context7 MCP (External Docs)               �"
    echo "   �  - React, Next.js, PostgreSQL             �"
    echo "   �  - No hallucinations                      �"
    echo "   �����������������������������������������������"
else
    echo "   �����������������������������������������������"
fi

echo ""
echo "?? Available Operations:"
echo "   Memory Bank MCP:"
echo "   - memory_bank_read - Read project documentation"
echo "   - memory_bank_write - Create new files"
echo "   - memory_bank_update - Update existing files"
echo "   - list_projects - List available projects"
echo "   - list_project_files - List files within a project"
echo ""
if [ -n "$REMEMBERIZER_API_KEY" ]; then
    echo "   Rememberizer Vector Store MCP:"
    echo "   - rememberizer_vectordb_search - Semantic search"
    echo "   - rememberizer_vectordb_agentic_search - AI enhanced search"
    echo "   - rememberizer_vectordb_create_document - Store new memories"
    echo "   - rememberizer_vectordb_list_documents - List all memories"
    echo "   - rememberizer_vectordb_information - Vector store info"
    echo ""
fi
if [ -n "$CONTEXT7_API_KEY" ]; then
    echo "   Context7 MCP:"
    echo "   - resolve-library-id - Find library IDs"
    echo "   - get-library-docs - Fetch documentation"
    echo ""
fi

echo "?? Next Steps:"
echo "   1. Restart Cursor IDE"
echo "   2. Open Cursor Settings -> Features -> MCP Servers"
echo "   3. Verify that every configured MCP server is enabled"
echo "   4. In Cursor, run: 'read memory bank', 'search memory', and 'use context7' to confirm connectivity"
if [ -z "$REMEMBERIZER_API_KEY" ] || [ -z "$CONTEXT7_API_KEY" ]; then
    echo "   5. (Optional) Re-run this script with any missing API keys to unlock full functionality"
fi

echo ""
echo "?? You're all set! Restart Cursor to activate the unified memory system."

