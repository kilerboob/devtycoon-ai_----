export type UUID = string;
export type NodeID = string; // e.g., 'node_01'
export type Snowflake = string;

// --- GLOBAL CATALOGS ---

export interface ItemCatalog {
    id: UUID;
    code: string;
    category: 'hardware' | 'decor' | 'upgrade' | 'consumable' | 'license' | 'app_skin';
    name: string;
    description: string;
    base_stats: {
        heat?: number;
        power?: number;
        rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
        base_price?: number;
        buffs?: Record<string, number>;
    };
    flags: {
        canBeIllegal?: boolean;
        canBeStolen?: boolean;
        isShadowOnly?: boolean;
    };
    created_at: Date;
    updated_at: Date;
}

export interface AppBlueprint {
    id: UUID;
    code: string;
    name: string;
    type: 'system' | 'user_creatable';
    base_source_code: string;
    required_resources: Record<string, number>;
    created_at: Date;
}

export interface FactionCatalog {
    id: UUID;
    code: string;
    name: string;
    description: string;
    bonuses: Record<string, number>;
    created_at: Date;
}

export interface LoreEntry {
    id: UUID;
    slug: string;
    title: string;
    content: string;
    author: string;
    unlock_conditions: Record<string, any>;
    created_at: Date;
}

// --- SHARDED ENTITIES ---

export interface Player {
    id: UUID;
    node_id: NodeID;
    account_id: string;
    nickname: string;
    created_at: Date;
    last_login: Date;
}

export interface PlayerProgress {
    player_id: UUID;
    level: number;
    xp: number;
    unlocked_features: string[];
    reputation: number;
    money: number;
    shadow_credits: number;
    updated_at: Date;
}

export interface InventoryItem {
    id: string; // <node_id>-<snowflake>
    node_id: NodeID;
    owner_player_id: UUID;
    catalog_item_id: UUID;
    durability: number;
    is_stolen: boolean;
    is_illegal: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface PCBuild {
    id: UUID;
    player_id: UUID;
    node_id: NodeID;
    slot_cpu: string | null; // Inventory ID
    slot_gpu: string | null;
    slot_ram: string[];
    slot_storage: string[];
    slot_cooler: string | null;
    current_temperature: number;
    overheat_strikes: number;
    updated_at: Date;
}

export interface RoomState {
    id: UUID;
    player_id: UUID;
    node_id: NodeID;
    wallpaper_item_id: string | null;
    desk_item_id: string | null;
    chair_item_id: string | null;
    neon_items: string[]; // List of inventory IDs
    updated_at: Date;
}

export interface DevOSFile {
    id: UUID;
    node_id: NodeID;
    owner_player_id: UUID;
    parent_folder_id: UUID | null;
    path: string;
    name: string;
    type: 'file' | 'directory';
    mime: string | null;
    content: string | null;
    size_bytes: number;
    created_at: Date;
    updated_at: Date;
}

export interface WebProject {
    id: UUID;
    node_id: NodeID;
    owner_player_id: UUID;
    name: string;
    slug: string;
    entry_file_id: UUID;
    metadata: {
        is_public: boolean;
        tags: string[];
    };
    last_deployed_at: Date | null;
    created_at: Date;
}

export interface LogicCircuit {
    id: UUID;
    node_id: NodeID;
    owner_player_id: UUID;
    name: string;
    graph_data: {
        nodes: any[];
        edges: any[];
    };
    created_at: Date;
    updated_at: Date;
}

export interface Market {
    id: UUID;
    node_id: NodeID;
    type: 'white' | 'shadow' | 'resale';
    name: string;
    tax_rate: number;
}

export interface MarketOrder {
    id: UUID;
    node_id: NodeID;
    market_id: UUID;
    seller_player_id: UUID;
    inventory_item_id: string;
    price: number;
    currency: 'USD' | 'SC';
    status: 'active' | 'filled' | 'canceled';
    created_at: Date;
    updated_at: Date;
}

export interface Transaction {
    id: UUID;
    node_id: NodeID;
    from_player_id: UUID | null;
    to_player_id: UUID | null;
    inventory_item_id: string | null;
    amount: number;
    currency: string;
    type: 'buy' | 'sell' | 'wash' | 'fee' | 'reward';
    created_at: Date;
}

export interface TraceLog {
    id: UUID;
    node_id: NodeID;
    player_id: UUID | null;
    source: string;
    delta: number;
    trace_before: number;
    trace_after: number;
    created_at: Date;
}

// --- API DTOs ---

export interface RegisterPlayerRequest {
    nickname: string;
    account_id: string;
}

export interface AddInventoryItemRequest {
    catalog_item_code: string; // Use code to lookup ID
    is_stolen?: boolean;
    is_illegal?: boolean;
}

export interface SaveFileRequest {
    path: string;
    content: string;
    mime?: string;
}

export interface DeployAppRequest {
    name: string;
    slug: string;
    entry_file_path: string;
}

export interface CreateOrderRequest {
    market_type: 'white' | 'shadow' | 'resale';
    inventory_item_id: string;
    price: number;
    currency: 'USD' | 'SC';
}

export interface LogTraceRequest {
    source: string;
    delta: number;
}
