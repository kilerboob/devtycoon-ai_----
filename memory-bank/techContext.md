# TechContext

## Frontend
- React + TypeScript + Vite (vite.config.ts) drive the Desktop shell and app windows.
- Zustand/Context state (constants.ts, types.ts) syncs DevFS tree, selections, notifications, and OS prefs.
- Testing via Vitest + React Testing Library under tests/*.ts(x).

## DevFS & Persistence
- IndexedDB/localForage like storage via services/devFsService.ts and dbService.ts.
- DevFsMigration ensures compatibility across releases.
- Undo/redo and inline rename rely on consistent path normalization utilities.

## Backend & Infra (Planned)
- Node.js + Express + PostgreSQL per backend/src/server.ts and backend/sql/init.sql.
- Sharded DB nodes (node_01, node_02, ...) follow memory-bank/backend/database-schema.md rules.
- Future use of workers/queues for MMO events.

## AI & Memory Tooling
- Memory Bank MCP for markdown docs (this directory).
- Rememberizer Vector Store (uvx mcp-rememberizer-vectordb) for semantic recall.
- Context7 streamable HTTP MCP for live framework docs.
- Scripts: setup-mcp.ps1/.sh, setup-unified-memory.ps1/.sh, setup-context7.ps1.

## Dev Tooling & Automation
- npm + npx for frontend/backstage scripts.
- uv/uvx for Python based MCP clients.
- PowerShell/Bash setup scripts keep Cursor MCP settings in sync.

## References
- package.json, vite.config.ts, tsconfig.json
- services/*.ts, components/*.tsx
- memory-bank/UNIFIED_MEMORY_ARCHITECTURE.md
