# Product Context

## Target Audience
- Players who enjoy retro-futuristic OS simulations, hacking minigames, and incremental RPG progression.
- Learners who want to experience an IDE-centric storyline where DevFS mirrors real engineering workflows.
- Community builders who will run corporations, studios, or guilds once MMO sharding is unlocked.

## Value Proposition
- A living desktop: log in, receive jobs from corporations, use DevFS to ship builds, and see immediate narrative consequences.
- Single source of truth: REDMAP, DB schema, AI rules, and lore are baked into the Memory Bank so each turn feels orchestrated instead of improvised.
- Extendable systems: scripted apps, browser hosted sites, DarkHub markets, and hacking labs can all evolve with new content drops.

## Primary Player Flows
1. Boot DeVOS, review Notifications/Tasks, open ProjectsApp, edit files, run tests in Terminal, and submit work through DevFsTester.
2. Explore corporations, labs, and DarkHub to unlock blueprints, AI cores, and sharded upgrades that influence future assignments.
3. Consult in-universe documentation (Browser + Memory Bank) to learn about lore, APIs, and mission steps before acting.

## Economy & Progression
- Money, reputation, and blueprint rarity tiers (T1-T6) dictate access to labs and hardware upgrades.
- Corporations assign jobs; labs gate PvE/PvP; shards ensure regional diversity.
- Narrative beats recorded inside ROADMAP_NEXT_STEPS.md, REDMAP_PROGRESS.md, and SESSION_SUMMARY.md drive pacing.

## Dependencies & Risks
- Requires DevFS stability: recursive ops, migrations, and undo flows must stay consistent with tests under tests/.
- Depends on accurate sharding + schema docs (backend/database-schema.md, devos/devfs-spec.md, cybernation/*.md).
- Memory resets between sessions mean missing documentation instantly hurts velocity unless activeContext/progress stay current.

## Source References
- DEVFS_SESSION_RU.md / DEVFS_SESSION_COMPLETION.md
- REDMAP_PROGRESS.md / ROADMAP_NEXT_STEPS.md
- devos/devfs-spec.md
- cybernation/*.md
- tests/*.ts(x)
