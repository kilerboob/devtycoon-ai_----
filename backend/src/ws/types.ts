/**
 * WebSocket & Sync Protocol Types
 * LAYER 4: Soft-Sharding + Global Sync
 */

// === EVENT TYPES ===

export type SyncEventType = 
  // Player events
  | 'PLAYER_JOIN'
  | 'PLAYER_LEAVE'
  | 'PLAYER_UPDATE'
  // Chat events
  | 'CHAT_MESSAGE'
  | 'CHAT_GLOBAL'
  // State sync events
  | 'STATE_SYNC'
  | 'STATE_DELTA'
  // Corporation events
  | 'CORP_ACTION'
  | 'CORP_UPDATE'
  // Global events
  | 'GLOBAL_EVENT'
  | 'LEADERBOARD_UPDATE'
  // System events
  | 'PING'
  | 'PONG'
  | 'ERROR';

// === BASE EVENT ===

export interface SyncEvent<T = unknown> {
  type: SyncEventType;
  payload: T;
  timestamp: number;
  senderId: string;       // Player/client ID
  shardId: string;        // Origin shard
  targetShardId?: string; // Target shard (for cross-shard)
  eventId: string;        // Unique event ID
}

// === PLAYER EVENTS ===

export interface PlayerJoinPayload {
  playerId: string;
  playerName: string;
  shardId: string;
  role?: string;
  tier?: string;
}

export interface PlayerLeavePayload {
  playerId: string;
  reason: 'disconnect' | 'logout' | 'timeout' | 'kick';
}

export interface PlayerUpdatePayload {
  playerId: string;
  updates: Partial<{
    money: number;
    reputation: number;
    level: number;
    tier: string;
    role: string;
    corporationId: string | null;
  }>;
}

// === CHAT EVENTS ===

export interface ChatMessagePayload {
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
  channel: 'shard' | 'global' | 'corp' | 'private';
  recipientId?: string; // For private messages
  timestamp: number;
}

// === STATE SYNC ===

export interface StateSyncPayload {
  type: 'full' | 'delta';
  data: Record<string, unknown>;
  version: number;
}

export interface StateDeltaPayload {
  path: string;           // e.g. "corporations.corp_1.members"
  operation: 'set' | 'delete' | 'push' | 'pull';
  value: unknown;
  version: number;
}

// === CORPORATION EVENTS ===

export interface CorpActionPayload {
  corpId: string;
  action: 'create' | 'join' | 'leave' | 'invite' | 'kick' | 'promote' | 'demote' | 'war_declare' | 'war_end';
  actorId: string;
  targetId?: string;
  data?: Record<string, unknown>;
}

export interface CorpUpdatePayload {
  corpId: string;
  updates: Partial<{
    name: string;
    funds: number;
    reputation: number;
    memberCount: number;
    level: number;
    territories: string[];
  }>;
}

// === GLOBAL EVENTS ===

export interface GlobalEventPayload {
  eventType: 'announcement' | 'market_crash' | 'bonus_weekend' | 'tournament' | 'maintenance';
  title: string;
  description: string;
  duration?: number; // in seconds
  affectedShards: string[] | 'all';
  data?: Record<string, unknown>;
}

export interface LeaderboardUpdatePayload {
  type: 'money' | 'reputation' | 'level' | 'corp_power';
  entries: Array<{
    rank: number;
    playerId: string;
    playerName: string;
    shardId: string;
    value: number;
  }>;
  lastUpdated: number;
}

// === CLIENT STATE ===

export interface ConnectedClient {
  socketId: string;
  playerId: string;
  playerName: string;
  shardId: string;
  connectedAt: number;
  lastPing: number;
  rooms: string[];
}

// === ROOM TYPES ===

export type RoomType = 'shard' | 'global' | 'corp' | 'private';

export interface RoomInfo {
  id: string;
  type: RoomType;
  name: string;
  memberCount: number;
  createdAt: number;
}

// === SERVER CONFIG ===

export interface WSServerConfig {
  port: number;
  corsOrigin: string | string[];
  pingInterval: number;      // ms
  pingTimeout: number;       // ms
  maxClients: number;
  redisUrl?: string;
  enableRedis: boolean;
}

// === REDIS MESSAGES ===

export interface RedisPubSubMessage {
  channel: string;
  event: SyncEvent;
  sourceNode: string; // Server instance ID
}
