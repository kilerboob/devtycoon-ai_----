-- LAYER 18: SERVER ROOMS (Hacking, Raids, PvE/PvP)
-- Server Rooms, Raids, Raid Rewards, Raid Participants

-- Server Rooms (игровые локации)
CREATE TABLE IF NOT EXISTS server_rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  room_type VARCHAR(50) NOT NULL CHECK (room_type IN ('pve', 'pvp', 'world')),
  difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard', 'legendary')),
  -- Положение в игровом мире (или координаты дата-центра)
  location_x FLOAT DEFAULT 0,
  location_y FLOAT DEFAULT 0,
  location_z FLOAT DEFAULT 0,
  -- Основные ресурсы и параметры
  security_level INT DEFAULT 1,
  ai_defense_strength INT DEFAULT 50,
  storage_capacity INT DEFAULT 1000,
  -- Статус и занятость
  current_raid_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  controlled_by_faction VARCHAR(100),
  -- Тайминг
  last_raid_timestamp BIGINT,
  respawn_cooldown_ms INT DEFAULT 3600000,
  -- Награды за взлом
  base_reward_currency INT DEFAULT 100,
  base_reward_xp INT DEFAULT 50,
  base_reward_resources JSONB DEFAULT '{"credits":100,"data_shards":10}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Рейды (инстансы взлома)
CREATE TABLE IF NOT EXISTS raids (
  id SERIAL PRIMARY KEY,
  server_room_id INT NOT NULL REFERENCES server_rooms(id) ON DELETE CASCADE,
  raid_type VARCHAR(50) NOT NULL CHECK (raid_type IN ('solo', 'group', 'pvp')),
  raid_mode VARCHAR(50) NOT NULL CHECK (raid_mode IN ('hack', 'defend', 'assault')),
  difficulty_override VARCHAR(50),
  -- Организатор и участники
  leader_id INT NOT NULL,
  max_participants INT DEFAULT 4,
  min_participants INT DEFAULT 1,
  -- Статус рейда
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'active', 'hacking', 'failed', 'completed', 'cancelled')) DEFAULT 'pending',
  phase VARCHAR(50) DEFAULT 'preparation',
  -- Начало и время жизни
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_limit_seconds INT DEFAULT 600,
  hack_progress_percent INT DEFAULT 0,
  -- Враги и защита
  enemy_count INT DEFAULT 1,
  defeated_enemy_count INT DEFAULT 0,
  defense_integrity INT DEFAULT 100,
  -- Награды
  total_rewards_pool JSONB DEFAULT '{"credits":0,"xp":0}',
  loot_available JSONB DEFAULT '[]',
  -- Статистика
  total_damage_dealt INT DEFAULT 0,
  successful_hacks INT DEFAULT 0,
  failed_hacks INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Участники рейда
CREATE TABLE IF NOT EXISTS raid_participants (
  id SERIAL PRIMARY KEY,
  raid_id INT NOT NULL REFERENCES raids(id) ON DELETE CASCADE,
  player_id INT NOT NULL,
  username VARCHAR(255),
  join_timestamp TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'dead', 'disconnected', 'completed')),
  -- Индивидуальная статистика
  hacks_attempted INT DEFAULT 0,
  hacks_successful INT DEFAULT 0,
  damage_dealt INT DEFAULT 0,
  damage_taken INT DEFAULT 0,
  resources_looted JSONB DEFAULT '{}',
  individual_reward JSONB DEFAULT '{"credits":0,"xp":0}',
  has_claimed_reward BOOLEAN DEFAULT FALSE,
  contribution_percent FLOAT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Награды за рейд
CREATE TABLE IF NOT EXISTS raid_rewards (
  id SERIAL PRIMARY KEY,
  raid_id INT NOT NULL REFERENCES raids(id) ON DELETE CASCADE,
  player_id INT NOT NULL,
  reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('currency', 'xp', 'equipment', 'resource', 'title')),
  reward_value INT,
  reward_data JSONB,
  rarity VARCHAR(50) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_raids_server_room ON raids(server_room_id);
CREATE INDEX IF NOT EXISTS idx_raids_leader ON raids(leader_id);
CREATE INDEX IF NOT EXISTS idx_raids_status ON raids(status);
CREATE INDEX IF NOT EXISTS idx_raid_participants_raid ON raid_participants(raid_id);
CREATE INDEX IF NOT EXISTS idx_raid_participants_player ON raid_participants(player_id);
CREATE INDEX IF NOT EXISTS idx_raid_rewards_raid ON raid_rewards(raid_id);
CREATE INDEX IF NOT EXISTS idx_raid_rewards_player ON raid_rewards(player_id);
CREATE INDEX IF NOT EXISTS idx_raid_rewards_claimed ON raid_rewards(is_claimed);
CREATE INDEX IF NOT EXISTS idx_server_rooms_type_difficulty ON server_rooms(room_type, difficulty);
CREATE INDEX IF NOT EXISTS idx_server_rooms_active ON server_rooms(is_active);

-- Инициальные данные: предустановленные дата-центры
INSERT INTO server_rooms (name, description, room_type, difficulty, security_level, ai_defense_strength, base_reward_currency, base_reward_xp)
VALUES
  ('Nexus Alpha', 'Главный дата-центр корпорации', 'pve', 'easy', 1, 30, 100, 50),
  ('Nexus Beta', 'Региональный сервер безопасности', 'pve', 'normal', 2, 60, 200, 100),
  ('Nexus Gamma', 'Защищённое хранилище данных', 'pve', 'hard', 3, 90, 400, 200),
  ('Nexus Prime', 'Секретный командный центр', 'pvp', 'legendary', 5, 150, 1000, 500),
  ('Shadow Network', 'Скрытая сеть конкурента', 'pvp', 'hard', 4, 120, 600, 300)
ON CONFLICT DO NOTHING;
