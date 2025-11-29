# System Patterns

## Client OS Layer
- Desktop orchestrates windows, notifications, and system settings under components/Desktop.tsx.
- Apps (ProjectsApp, StorageApp, Browser, SkillTree, Settings, Messenger, MusicPlayer, DarkHub, CyberBay) mount as React components but behave like native tools.
- UndoSnackbar, ConfirmModal, NotificationContainer, and MatrixBackground provide UX scaffolding for reversible actions and ambience.

## DevFS + IDE Stack
- DevFS abstracts IndexedDB/local storage and exposes CRUD + traversal methods via services/devFsService.ts and dbService.ts.
- ProjectsApp, VisualEditor, DevFsTester, and Terminal rely on DevFS contracts (create/update/delete/move/list) to stay in sync.
- Tests (devFsService.test.ts, devFsRecursive.test.ts, devFsHeavyLoad.test.ts, FileTreeInlineRename.test.tsx) ensure deterministic behavior.
- DevFsMigration + devFsService guard schema upgrades and session recovery.

## Backend & Services
- Future backend (backend/src/*.ts, backend/sql/init.sql) outlines Express + PostgreSQL services per backend/api-plan.md.
- Database schema divides users, studios, guilds, corporations, labs, assets, and sharded nodes (node_01+).
- Gemini/online mocks emulate remote calls until sharded MMO backend ships.

## Network, Shards, and MMO Systems
- Layer 4+ in REDMAP define shards, auth, corporations, labs, blueprints, guilds, and planetary markets.
- DevOS client keeps shard metadata in global state so UI can reflect current region.

## Unified Memory Architecture
- Memory Bank MCP: structured markdown stored locally (documents in memory-bank/ plus new MCP core files).
- Rememberizer Vector Store MCP: semantic search for past sessions, conversation history, and lore.
- Context7 MCP: authoritative library docs (React, Next.js, PostgreSQL, Node tooling) to avoid hallucinated APIs.
- setup-unified-memory scripts configure Cursor to talk to all three automatically.

## Observability & QA
- DevFsTester component provides in-world validation of DevFS operations.
- Tests directory exercises DevFS behavior; future telemetry entries should be reflected in progress.md and .clinerules.

## References
- App.tsx, Desktop.tsx, components/*.tsx
- services/devFsService.ts, devFsMigration.ts, dbService.ts
- backend/database-schema.md, backend/api-plan.md
- memory-bank/UNIFIED_MEMORY_ARCHITECTURE.md
