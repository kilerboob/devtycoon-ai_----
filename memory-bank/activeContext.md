# Active Context

**Last Updated:** 2025-12-02

## Current Focus

1. LAYER 17 (Rooms) — **COMPLETED** ✅
   - Backend API for rooms, furniture, PC components working
   - Frontend UI placeholders ready (edit mode, furniture palette)
   - Database schema applied (17 tables)
   
2. Next priority: Integrate drag-drop editor in Room.tsx
3. Memory Bank MCP is operational — local file system working, no API key needed
4. Rememberizer working locally, Context7 needs setup if external docs required

## Immediate Tasks

- [x] Implement LAYER 17 backend (rooms, room_items, user_pc_components)
- [x] Add REST API endpoints for room management
- [x] Update Room.tsx with edit mode toggle
- [x] Document implementation in LAYER17_ROOMS_REPORT.md
- [x] Update progress.md with LAYER 17 completion
- [ ] Test "read memory bank" command to verify MCP integration
- [ ] Implement drag-drop furniture placement (React DnD)
- [ ] Connect PCInternals upgrades to /api/pc/upgrade endpoint

## Risks / Watch List

- Agents should use "read memory bank" command to load context from memory-bank/
- Backend running on port 3000, PostgreSQL on port 5433 (non-standard)
- Frontend Room.tsx edit mode is UI placeholder — drag-drop not yet functional
- AI Assets (Layer 20) integration pending for dynamic furniture generation

## References

- `LAYER17_ROOMS_REPORT.md` — Full implementation details
- `backend/src/services/roomsService.ts` — CRUD logic
- `backend/sql/sync_schema.sql` — Database schema
- `memory-bank/UNIFIED_MEMORY_ARCHITECTURE.md` — MCP architecture
- `memory-bank/progress.md` — Latest updates logged
