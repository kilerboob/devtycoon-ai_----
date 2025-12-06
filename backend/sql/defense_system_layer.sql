-- Add defense system columns to server_rooms
ALTER TABLE server_rooms 
ADD COLUMN IF NOT EXISTS defense_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS defense_cooldown_end TIMESTAMP,
ADD COLUMN IF NOT EXISTS defense_upgrade_cost INTEGER DEFAULT 50000,
ADD COLUMN IF NOT EXISTS defense_health INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS last_raid_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS raid_cooldown_minutes INTEGER DEFAULT 30;

-- Create server_defense_upgrades tracking table
CREATE TABLE IF NOT EXISTS server_defense_upgrades (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES server_rooms(id) ON DELETE CASCADE,
  upgrade_type VARCHAR(50) NOT NULL, -- 'firewall', 'antivirus', 'ids', 'encryption'
  level INTEGER DEFAULT 1,
  cost INTEGER NOT NULL,
  effectiveness FLOAT DEFAULT 0.5, -- 0.0 to 1.0, reduces damage by this %
  installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create defense history table for tracking
CREATE TABLE IF NOT EXISTS defense_events (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES server_rooms(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'raid_blocked', 'defense_upgraded', 'defense_failed', 'cooldown_active'
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_server_defense_upgrades_room_id ON server_defense_upgrades(room_id);
CREATE INDEX IF NOT EXISTS idx_defense_events_room_id ON defense_events(room_id);
CREATE INDEX IF NOT EXISTS idx_server_rooms_defense_level ON server_rooms(defense_level);
CREATE INDEX IF NOT EXISTS idx_server_rooms_cooldown ON server_rooms(defense_cooldown_end);

-- Create a view for server defense status
CREATE OR REPLACE VIEW server_defense_status AS
SELECT 
  sr.id,
  sr.name,
  sr.defense_level,
  sr.defense_health,
  sr.raid_cooldown_minutes,
  sr.last_raid_time,
  COALESCE(sr.defense_cooldown_end > CURRENT_TIMESTAMP, false) as cooldown_active,
  EXTRACT(EPOCH FROM (sr.defense_cooldown_end - CURRENT_TIMESTAMP)) as cooldown_remaining_seconds,
  COALESCE(ARRAY_AGG(
    jsonb_build_object(
      'type', sdu.upgrade_type,
      'level', sdu.level,
      'effectiveness', sdu.effectiveness
    )
  ) FILTER (WHERE sdu.id IS NOT NULL), '{}') as upgrades,
  (SELECT COUNT(*) FROM defense_events WHERE room_id = sr.id AND event_type = 'raid_blocked') as raids_blocked
FROM server_rooms sr
LEFT JOIN server_defense_upgrades sdu ON sr.id = sdu.room_id
GROUP BY sr.id;
