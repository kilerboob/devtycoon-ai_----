# Database Schema — Logical Model

Ниже описана логическая схема БД (без привязки к конкретному SQL/NoSQL). Может быть реализована в Postgres.

## users

- id (uuid, pk)
- username (string, unique)
- email (string, unique)
- password_hash (string)
- role (enum: programmer, engineer, hacker, security, trader)
- tier (enum: trainee, junior, middle, senior, architect)
- corporation_id (nullable, fk → corporations.id)
- guild_id (nullable, fk → guilds.id)
- studio_id (nullable, fk → studios.id)
- money (numeric)
- room_config (jsonb)
- pc_config (jsonb)
- created_at (timestamp)
- updated_at (timestamp)

## studios

- id (uuid, pk)
- name (string, unique)
- owner_id (fk → users.id)
- members (jsonb / отдельная таблица studio_members)
- finances (jsonb)
- reputation (int)
- created_at
- updated_at

## guilds

- id (uuid, pk)
- name (string, unique)
- type (enum: hacker, security, engineer, trader)
- members (jsonb / отдельная таблица guild_members)
- rank (int)
- headquarters_location (string / planet coord)
- created_at
- updated_at

## corporations

- id (uuid, pk)
- name (string, unique)
- description (text)
- influence (jsonb)
- ai_core_level (int)
- created_at
- updated_at

## labs

- id (uuid, pk)
- corporation_id (fk → corporations.id)
- name (string)
- security_level (int)
- ai_core_stats (jsonb)
- blueprint_vault (jsonb)
- prototype_vault (jsonb)
- vulnerability_score (int)
- coordinates (jsonb)
- created_at
- updated_at

## blueprints

- id (uuid, pk)
- corporation_id (fk → corporations.id, nullable)
- name (string)
- rarity (enum: common, advanced, rare, prototype, legendary, experimental)
- type (enum: cpu, gpu, ssd, case, cooler, ai_core, quantum_node, other)
- requirements (jsonb)
- stats (jsonb)
- devfs_path (string)
- created_at
- updated_at

## devfs_files

- id (uuid, pk)
- owner_id (fk → users.id, nullable)
- path (string, indexed)
- type (enum: file, folder)
- file_type (string)
- content (text / отдельное хранилище)
- meta (jsonb)
- created_at
- updated_at

## projects

- id (uuid, pk)
- owner_id (fk → users.id)
- studio_id (fk → studios.id, nullable)
- title (string)
- type (enum: app, site, game, tool)
- status (enum: draft, in_progress, released, archived)
- files (jsonb, ссылки на devfs_paths)
- revenue (numeric)
- rating (numeric)
- created_at
- updated_at

## market_items

- id (uuid, pk)
- item_type (enum: part, software, site, service, blueprint)
- item_ref (jsonb)
- seller_id (fk → users.id)
- price (numeric)
- tags (text[])
- created_at
- updated_at

## darkhub_items

- id (uuid, pk)
- item_type (enum: blueprint, vulnerability, prototype, illegal_chip)
- item_ref (jsonb)
- seller_id (fk → users.id)
- price (numeric)
- risk_level (int)
- encrypted (bool)
- created_at
- updated_at

## messages

- id (uuid, pk)
- from_entity (jsonb: {type: user|npc|corp|gov, id})
- to_entity (jsonb)
- type (enum: normal, system, threat, bill, warning)
- content (text/json)
- severity (int)
- options (jsonb)
- created_at

## calls

- id (uuid, pk)
- caller_id (fk → users.id)
- receiver_id (fk → users.id)
- type (enum: voice, video, mock)
- duration_sec (int)
- status (enum: accepted, rejected, missed)
- created_at

## bills

- id (uuid, pk)
- user_id (fk → users.id)
- type (enum: electricity, tax, loan, internet)
- amount (numeric)
- deadline (timestamp)
- status (enum: pending, paid, overdue)
- created_at
- updated_at

## threats

- id (uuid, pk)
- from_npc (jsonb)
- to_user_id (fk → users.id)
- severity (int)
- reason (text)
- demanded_amount (numeric, nullable)
- created_at

## gov_actions

- id (uuid, pk)
- user_id (fk → users.id)
- action_type (enum: shutdown, punish, warn)
- reason (text)
- created_at
