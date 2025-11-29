-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- GLOBAL SCHEMA (Shared across all nodes)
-- ==========================================
CREATE SCHEMA IF NOT EXISTS global_data;

-- 1. Item Catalog
CREATE TABLE IF NOT EXISTS global_data.item_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- hardware, decor, upgrade, consumable, license, app_skin
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_stats JSONB DEFAULT '{}'::jsonb, -- heat, power, rarity, base_price, buffs
    flags JSONB DEFAULT '{}'::jsonb, -- canBeIllegal, canBeStolen, isShadowOnly
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Hardware Catalog (Optional extension of item_catalog, or separate if needed for specific hardware logic)
-- For now, we assume hardware is in item_catalog with category='hardware', but we can create a view or separate table if strict normalization is needed.
-- Let's keep it simple as requested: "детали для ПК, если нужно отдельно". We will use item_catalog for now, but create a view for convenience.
CREATE OR REPLACE VIEW global_data.view_hardware AS
SELECT * FROM global_data.item_catalog WHERE category = 'hardware';

-- 3. Room Decor Catalog
CREATE OR REPLACE VIEW global_data.view_decor AS
SELECT * FROM global_data.item_catalog WHERE category = 'decor';

-- 4. App Blueprints
CREATE TABLE IF NOT EXISTS global_data.app_blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(255) UNIQUE NOT NULL, -- e.g. 'ide_basic', 'browser_chrome'
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- system, user_creatable
    base_source_code TEXT, -- Boilerplate code
    required_resources JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Faction Catalog
CREATE TABLE IF NOT EXISTS global_data.faction_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- WNF, DARKHUB, ROOT_SEEKERS
    name VARCHAR(255) NOT NULL,
    description TEXT,
    bonuses JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Lore Entries
CREATE TABLE IF NOT EXISTS global_data.lore_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL, -- protocol_0, init_seed
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(100), -- Architect AI, Unknown
    unlock_conditions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- SHARD SCHEMA GENERATION FUNCTION
-- ==========================================
-- This function creates a new schema for a specific node (e.g., node_01)
CREATE OR REPLACE FUNCTION create_node_shard(target_node_id VARCHAR) RETURNS VOID AS $$
DECLARE
    schema_name VARCHAR := quote_ident(target_node_id);
BEGIN
    -- Create Schema
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || schema_name;

    -- 1. Players
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.players (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        node_id VARCHAR(50) NOT NULL DEFAULT ''' || target_node_id || ''',
        account_id VARCHAR(255) NOT NULL, -- External Auth ID
        nickname VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_' || target_node_id || '_nickname UNIQUE (nickname)
    )';

    -- 2. Player Progress
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.player_progress (
        player_id UUID PRIMARY KEY REFERENCES ' || schema_name || '.players(id) ON DELETE CASCADE,
        level INTEGER DEFAULT 1,
        xp BIGINT DEFAULT 0,
        unlocked_features JSONB DEFAULT ''[]''::jsonb, -- ShadowNet, Creator-Web
        reputation INTEGER DEFAULT 0,
        money DECIMAL(20, 2) DEFAULT 0,
        shadow_credits DECIMAL(20, 2) DEFAULT 0,
        trace_percent DECIMAL(5, 2) DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )';

    -- 3. Inventory Items
    -- ID is string to support <node>-<snowflake> format
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.inventory_items (
        id VARCHAR(255) PRIMARY KEY,
        node_id VARCHAR(50) NOT NULL DEFAULT ''' || target_node_id || ''',
        owner_player_id UUID REFERENCES ' || schema_name || '.players(id) ON DELETE CASCADE,
        catalog_item_id UUID REFERENCES global_data.item_catalog(id),
        durability INTEGER DEFAULT 100,
        is_stolen BOOLEAN DEFAULT FALSE,
        is_illegal BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )';

    -- 4. PC Builds
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.pc_builds (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        player_id UUID REFERENCES ' || schema_name || '.players(id) ON DELETE CASCADE,
        node_id VARCHAR(50) NOT NULL DEFAULT ''' || target_node_id || ''',
        slot_cpu VARCHAR(255) REFERENCES ' || schema_name || '.inventory_items(id),
        slot_gpu VARCHAR(255) REFERENCES ' || schema_name || '.inventory_items(id),
        slot_ram VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR[], -- Array of inventory IDs
        slot_storage VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR[],
        slot_cooler VARCHAR(255) REFERENCES ' || schema_name || '.inventory_items(id),
        current_temperature DECIMAL(5, 2) DEFAULT 30.0,
        overheat_strikes INTEGER DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )';

    -- 5. Room State
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.room_state (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        player_id UUID UNIQUE REFERENCES ' || schema_name || '.players(id) ON DELETE CASCADE,
        node_id VARCHAR(50) NOT NULL DEFAULT ''' || target_node_id || ''',
        wallpaper_item_id VARCHAR(255) REFERENCES ' || schema_name || '.inventory_items(id),
        desk_item_id VARCHAR(255) REFERENCES ' || schema_name || '.inventory_items(id),
        chair_item_id VARCHAR(255) REFERENCES ' || schema_name || '.inventory_items(id),
        neon_items JSONB DEFAULT ''[]''::jsonb, -- List of inventory IDs positioned in room
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )';

    -- 6. DevOS Files
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.devos_files (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        node_id VARCHAR(50) NOT NULL DEFAULT ''' || target_node_id || ''',
        owner_player_id UUID REFERENCES ' || schema_name || '.players(id) ON DELETE CASCADE,
        parent_folder_id UUID REFERENCES ' || schema_name || '.devos_files(id),
        path VARCHAR(1024) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN (''file'', ''directory'')),
        mime VARCHAR(100),
        content TEXT, -- Or storage URL
        size_bytes BIGINT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE (owner_player_id, path)
    )';

    -- 7. Web Projects
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.web_projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        node_id VARCHAR(50) NOT NULL DEFAULT ''' || target_node_id || ''',
        owner_player_id UUID REFERENCES ' || schema_name || '.players(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL, -- ang://slug
        entry_file_id UUID REFERENCES ' || schema_name || '.devos_files(id),
        metadata JSONB DEFAULT ''{"is_public": false, "tags": []}''::jsonb,
        last_deployed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE (slug) -- Global uniqueness within node? Or global? Assuming node for now.
    )';

    -- 8. Logic Circuits
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.logic_circuits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        node_id VARCHAR(50) NOT NULL DEFAULT ''' || target_node_id || ''',
        owner_player_id UUID REFERENCES ' || schema_name || '.players(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        graph_data JSONB NOT NULL DEFAULT ''{"nodes": [], "edges": []}''::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )';

    -- 9. Markets
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.markets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        node_id VARCHAR(50) NOT NULL DEFAULT ''' || target_node_id || ''',
        type VARCHAR(50) NOT NULL CHECK (type IN (''white'', ''shadow'', ''resale'')),
        name VARCHAR(255) NOT NULL,
        tax_rate DECIMAL(4, 3) DEFAULT 0.05
    )';

    -- 10. Market Orders
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.market_orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        node_id VARCHAR(50) NOT NULL DEFAULT ''' || target_node_id || ''',
        market_id UUID REFERENCES ' || schema_name || '.markets(id),
        seller_player_id UUID REFERENCES ' || schema_name || '.players(id),
        inventory_item_id VARCHAR(255) REFERENCES ' || schema_name || '.inventory_items(id),
        price DECIMAL(20, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL CHECK (currency IN (''USD'', ''SC'')),
        status VARCHAR(20) DEFAULT ''active'' CHECK (status IN (''active'', ''filled'', ''canceled'')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )';

    -- 11. Transactions
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        node_id VARCHAR(50) NOT NULL DEFAULT ''' || target_node_id || ''',
        from_player_id UUID REFERENCES ' || schema_name || '.players(id),
        to_player_id UUID REFERENCES ' || schema_name || '.players(id),
        inventory_item_id VARCHAR(255), -- Nullable if just money transfer
        amount DECIMAL(20, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        type VARCHAR(50) NOT NULL, -- buy, sell, wash, fee, reward
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )';

    -- 12. Trace Logs
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.trace_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        node_id VARCHAR(50) NOT NULL DEFAULT ''' || target_node_id || ''',
        player_id UUID REFERENCES ' || schema_name || '.players(id),
        source VARCHAR(100) NOT NULL,
        delta DECIMAL(5, 2) NOT NULL,
        trace_before DECIMAL(5, 2) NOT NULL,
        trace_after DECIMAL(5, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )';

    -- 13. Corporations
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.corporations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        node_id VARCHAR(50) NOT NULL DEFAULT ''' || target_node_id || ''',
        name VARCHAR(255) NOT NULL,
        owner_player_id UUID REFERENCES ' || schema_name || '.players(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )';
    
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || schema_name || '.corporation_members (
        corporation_id UUID REFERENCES ' || schema_name || '.corporations(id) ON DELETE CASCADE,
        player_id UUID REFERENCES ' || schema_name || '.players(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT ''member'',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (corporation_id, player_id)
    )';

END;
$$ LANGUAGE plpgsql;

-- Example Usage:
-- SELECT create_node_shard('node_01');
-- SELECT create_node_shard('node_02');
