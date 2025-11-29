# Project Brief

## Vision
DevTycoon AI (DeVOS / CyberNation) delivers a playable DeVOS desktop that fuses career progression, hacking fantasy, and MMO scale. Players operate an in-universe OS, build studios, and interact with corporations, labs, and markets while the AI crew keeps context via the Memory Bank stack.

## Objectives
1. Ship a cohesive OS simulation (Desktop, Browser, ProjectsApp, Storage, SkillTree, Settings, Messenger, DarkHub, CyberBay) that feels like a living workstation.
2. Provide DevFS-driven creation loops so players write, run, and ship code through VisualEditor, Terminal, DevFsTester, and Runner integrations.
3. Maintain coherent lore, REDMAP milestones, and architectural decisions inside the Memory Bank + Rememberizer + Context7 unified memory so every session can resume instantly.

## Scope & Deliverables
- Desktop runtime with windowed apps, notifications, audio, and Matrix background effects.
- DevFS virtual disk, API, migrations, and tests that cover recursive operations, heavy load, and inline rename UX.
- Backend sharded PostgreSQL plan (corporations, studios, guilds, tiers, labs) with dbService/devFsService/geminiService glue.
- Unified memory scripts (setup-mcp, setup-unified-memory) plus documentation (STRUCTURE_VALIDATION, UNIFIED_MEMORY_ARCHITECTURE) that wire Cursor MCP servers.
- Narrative references such as REDMAP v6.0, DEVFS session logs, CHECKLIST, ROADMAP_NEXT_STEPS, IMPLEMENTATION_REPORT, and daily summaries.

## Constraints & Principles
- Follow REDMAP v6.0 ordering for layered delivery and call out any deviation inside activeContext.md.
- Respect PostgreSQL schema from backend/database-schema.md and sharding rules listed in devos/cybernation docs.
- Keep agents stateless: each task must begin with memory bank readings and end with progress.md and .clinerules updates when impact exceeds 25 percent.
- Maintain offline friendly docs, but keep Rememberizer and Context7 hooks ready for semantic or external lookups.

## Source References
- project/overview.md
- project/roadmap_redmap_v6.md
- backend/database-schema.md
- backend/api-plan.md
- ai/custom-instructions.md
