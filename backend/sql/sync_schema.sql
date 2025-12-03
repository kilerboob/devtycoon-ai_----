-- Sync Events Schema for Soft-Sharding
-- LAYER 4: Global State Persistence

-- Player sessions table (for tracking online players across shards)
CREATE TABLE IF NOT EXISTS player_sessions (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    player_name VARCHAR(128) NOT NULL,
    shard_id VARCHAR(32) NOT NULL,
    socket_id VARCHAR(64),
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP,
    last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT TRUE,
    ip_address INET,
    user_agent TEXT,
    CONSTRAINT unique_active_session UNIQUE (player_id, is_online)
);

CREATE INDEX idx_player_sessions_shard ON player_sessions(shard_id, is_online);
CREATE INDEX idx_player_sessions_player ON player_sessions(player_id);

-- Sync events log (for event replay and debugging)
CREATE TABLE IF NOT EXISTS sync_events (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID NOT NULL UNIQUE,
    event_type VARCHAR(32) NOT NULL,
    sender_id VARCHAR(64) NOT NULL,
    shard_id VARCHAR(32) NOT NULL,
    target_shard_id VARCHAR(32),
    payload JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT
);

CREATE INDEX idx_sync_events_type ON sync_events(event_type);
CREATE INDEX idx_sync_events_shard ON sync_events(shard_id);
CREATE INDEX idx_sync_events_created ON sync_events(created_at);
CREATE INDEX idx_sync_events_processed ON sync_events(processed) WHERE NOT processed;

-- Global chat messages (persistent)
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    message_id UUID NOT NULL UNIQUE,
    sender_id VARCHAR(64) NOT NULL,
    sender_name VARCHAR(128) NOT NULL,
    channel VARCHAR(16) NOT NULL, -- 'global', 'shard', 'corp', 'private'
    shard_id VARCHAR(32),
    recipient_id VARCHAR(64), -- for private/corp messages
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_chat_messages_channel ON chat_messages(channel, created_at DESC);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_shard ON chat_messages(shard_id, created_at DESC) WHERE channel = 'shard';

-- Leaderboard snapshots (for cross-shard rankings)
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
    id SERIAL PRIMARY KEY,
    leaderboard_type VARCHAR(32) NOT NULL, -- 'money', 'reputation', 'level', 'corp_power'
    player_id VARCHAR(64) NOT NULL,
    player_name VARCHAR(128) NOT NULL,
    shard_id VARCHAR(32) NOT NULL,
    value BIGINT NOT NULL,
    rank INTEGER,
    snapshot_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_leaderboard_entry UNIQUE (leaderboard_type, player_id)
);

CREATE INDEX idx_leaderboard_type ON leaderboard_snapshots(leaderboard_type, rank);
CREATE INDEX idx_leaderboard_value ON leaderboard_snapshots(leaderboard_type, value DESC);

-- Corporation cross-shard state
CREATE TABLE IF NOT EXISTS corporation_state (
    id SERIAL PRIMARY KEY,
    corp_id VARCHAR(64) NOT NULL UNIQUE,
    corp_name VARCHAR(128) NOT NULL,
    leader_id VARCHAR(64) NOT NULL,
    origin_shard_id VARCHAR(32) NOT NULL, -- where corp was created
    total_members INTEGER DEFAULT 1,
    total_funds BIGINT DEFAULT 0,
    reputation INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    territories JSONB DEFAULT '[]'::JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_corporation_state_leader ON corporation_state(leader_id);
CREATE INDEX idx_corporation_state_shard ON corporation_state(origin_shard_id);

-- Global events log
CREATE TABLE IF NOT EXISTS global_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(32) NOT NULL, -- 'announcement', 'market_crash', 'bonus_weekend', etc.
    title VARCHAR(256) NOT NULL,
    description TEXT,
    affected_shards TEXT[] DEFAULT ARRAY['all'],
    start_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_at TIMESTAMP,
    data JSONB DEFAULT '{}'::JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(64)
);

CREATE INDEX idx_global_events_active ON global_events(is_active, start_at);
CREATE INDEX idx_global_events_type ON global_events(event_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for corporation_state
DROP TRIGGER IF EXISTS update_corporation_state_updated_at ON corporation_state;
CREATE TRIGGER update_corporation_state_updated_at
    BEFORE UPDATE ON corporation_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION cleanup_old_sync_events(days_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sync_events
    WHERE created_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL
      AND processed = TRUE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- LAYER 17: Rooms (social spaces)
CREATE TABLE IF NOT EXISTS rooms (
    id BIGSERIAL PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    theme VARCHAR(64) DEFAULT 'default',
    layout JSONB DEFAULT '{}'::JSONB,
    privacy VARCHAR(16) DEFAULT 'public', -- public | friends | private
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rooms_owner ON rooms(owner_id);

CREATE TABLE IF NOT EXISTS room_items (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    item_type VARCHAR(64) NOT NULL, -- e.g., 'sofa', 'desk', 'pc_case'
    asset_id VARCHAR(128), -- reference to AI Assets identifier
    position JSONB NOT NULL, -- { x, y, z }
    rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::JSONB,
    scale JSONB DEFAULT '{"x":1,"y":1,"z":1}'::JSONB,
    properties JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_room_items_room ON room_items(room_id);

-- User PC components installed inside the room's PC
CREATE TABLE IF NOT EXISTS user_pc_components (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    room_id BIGINT REFERENCES rooms(id) ON DELETE SET NULL,
    component_type VARCHAR(64) NOT NULL, -- cpu | gpu | ram | storage | psu | motherboard | cooler
    model VARCHAR(128) NOT NULL,
    tier INTEGER DEFAULT 1, -- upgrade level
    stats JSONB DEFAULT '{}'::JSONB, -- performance metrics
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_pc_component UNIQUE (user_id, component_type)
);

CREATE INDEX IF NOT EXISTS idx_user_pc_components_user ON user_pc_components(user_id);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_room_items_updated_at ON room_items;
CREATE TRIGGER update_room_items_updated_at
    BEFORE UPDATE ON room_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_pc_components_updated_at ON user_pc_components;
CREATE TRIGGER update_user_pc_components_updated_at
    BEFORE UPDATE ON user_pc_components
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- LAYER 20: AI Assets (generated furniture, textures, 3D models)
CREATE TABLE IF NOT EXISTS ai_assets (
    asset_id VARCHAR(128) PRIMARY KEY,
    url TEXT NOT NULL,
    prompt TEXT NOT NULL,
    type VARCHAR(64) NOT NULL, -- furniture | 3d_model | texture | icon
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_assets_type ON ai_assets(type);
CREATE INDEX IF NOT EXISTS idx_ai_assets_generated ON ai_assets(generated_at DESC);

\i sql/security_layer.sql

-- include market layer
\i sql/market_layer.sql

CREATE OR REPLACE FUNCTION cleanup_old_chat_messages(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM chat_messages
    WHERE created_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL
      AND channel IN ('shard', 'private');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
