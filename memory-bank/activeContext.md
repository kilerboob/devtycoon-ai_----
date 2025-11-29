# Active Context

**Last Updated:** 2025-11-27

## Current Focus
1. Keep the new MCP-standard docs authoritative and cross-link them with existing domain folders so agents can navigate instantly.
2. Maintain the unified-memory setup scripts and architecture note; Context7 support now lives in both scripts, but users still need to rerun them with their API keys.
3. Capture verification outcomes after the user restarts Cursor and runs "read memory bank", "search memory", and "use context7"; log any findings in progress.md and .clinerules.

## Immediate Tasks
- [x] Draft core MCP files with references to existing docs.
- [x] Update setup-unified-memory scripts and rerun tests.
- [x] Expand ai/custom-instructions.md with mappings + checklist + logging guidance.
- [ ] After restarting Cursor, run the MCP verification commands and log outcomes in progress.md.

## Risks / Watch List
- Agents skipping the reading checklist will still miss context; enforce it via ai/custom-instructions.md.
- Rememberizer and Context7 require API keys; scripts degrade gracefully, but functionality remains limited until keys are provided and verification commands succeed.

## References
- projectbrief.md, productContext.md, systemPatterns.md, techContext.md
- memory-bank/UNIFIED_MEMORY_ARCHITECTURE.md
- ai/custom-instructions.md
