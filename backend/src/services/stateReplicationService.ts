/**
 * State Replication Service - LAYER 4: Cross-Shard Sync
 * 
 * Сервис для репликации глобального состояния:
 * - Корпорации
 * - Лидерборды
 * - Глобальные события
 */

import { Pool } from 'pg';
import { SyncEvent, CorpUpdatePayload, LeaderboardUpdatePayload, GlobalEventPayload } from '../ws/types';

export class StateReplicationService {
  private db: Pool;
  private leaderboardCache: Map<string, LeaderboardUpdatePayload> = new Map();
  private lastLeaderboardUpdate: number = 0;
  private leaderboardUpdateInterval: number = 60000; // 1 minute

  constructor(db: Pool) {
    this.db = db;
  }

  // === CORPORATION STATE ===

  /**
   * Save or update corporation state
   */
  async upsertCorporation(corpId: string, data: {
    corpName: string;
    leaderId: string;
    originShardId: string;
    totalMembers?: number;
    totalFunds?: number;
    reputation?: number;
    level?: number;
    territories?: string[];
  }): Promise<void> {
    const query = `
      INSERT INTO corporation_state (
        corp_id, corp_name, leader_id, origin_shard_id, 
        total_members, total_funds, reputation, level, territories
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (corp_id) DO UPDATE SET
        corp_name = EXCLUDED.corp_name,
        leader_id = EXCLUDED.leader_id,
        total_members = COALESCE(EXCLUDED.total_members, corporation_state.total_members),
        total_funds = COALESCE(EXCLUDED.total_funds, corporation_state.total_funds),
        reputation = COALESCE(EXCLUDED.reputation, corporation_state.reputation),
        level = COALESCE(EXCLUDED.level, corporation_state.level),
        territories = COALESCE(EXCLUDED.territories, corporation_state.territories)
    `;

    await this.db.query(query, [
      corpId,
      data.corpName,
      data.leaderId,
      data.originShardId,
      data.totalMembers ?? 1,
      data.totalFunds ?? 0,
      data.reputation ?? 0,
      data.level ?? 1,
      JSON.stringify(data.territories ?? [])
    ]);
  }

  /**
   * Get corporation state
   */
  async getCorporation(corpId: string): Promise<CorpUpdatePayload | null> {
    const result = await this.db.query(
      'SELECT * FROM corporation_state WHERE corp_id = $1',
      [corpId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      corpId: row.corp_id,
      updates: {
        name: row.corp_name,
        funds: Number(row.total_funds),
        reputation: row.reputation,
        memberCount: row.total_members,
        level: row.level,
        territories: row.territories
      }
    };
  }

  /**
   * Get all corporations (for cross-shard display)
   */
  async getAllCorporations(): Promise<CorpUpdatePayload[]> {
    const result = await this.db.query(
      'SELECT * FROM corporation_state ORDER BY reputation DESC LIMIT 100'
    );

    return result.rows.map(row => ({
      corpId: row.corp_id,
      updates: {
        name: row.corp_name,
        funds: Number(row.total_funds),
        reputation: row.reputation,
        memberCount: row.total_members,
        level: row.level,
        territories: row.territories
      }
    }));
  }

  // === LEADERBOARDS ===

  /**
   * Update player leaderboard entry
   */
  async updateLeaderboardEntry(
    type: 'money' | 'reputation' | 'level' | 'corp_power',
    playerId: string,
    playerName: string,
    shardId: string,
    value: number
  ): Promise<void> {
    const query = `
      INSERT INTO leaderboard_snapshots (leaderboard_type, player_id, player_name, shard_id, value)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (leaderboard_type, player_id) DO UPDATE SET
        player_name = EXCLUDED.player_name,
        shard_id = EXCLUDED.shard_id,
        value = EXCLUDED.value,
        snapshot_at = CURRENT_TIMESTAMP
    `;

    await this.db.query(query, [type, playerId, playerName, shardId, value]);
  }

  /**
   * Get leaderboard (cached)
   */
  async getLeaderboard(type: 'money' | 'reputation' | 'level' | 'corp_power', limit: number = 100): Promise<LeaderboardUpdatePayload> {
    // Check cache
    const cacheKey = `${type}_${limit}`;
    const cached = this.leaderboardCache.get(cacheKey);
    
    if (cached && Date.now() - this.lastLeaderboardUpdate < this.leaderboardUpdateInterval) {
      return cached;
    }

    // Query fresh data
    const result = await this.db.query(`
      SELECT player_id, player_name, shard_id, value,
             ROW_NUMBER() OVER (ORDER BY value DESC) as rank
      FROM leaderboard_snapshots
      WHERE leaderboard_type = $1
      ORDER BY value DESC
      LIMIT $2
    `, [type, limit]);

    const leaderboard: LeaderboardUpdatePayload = {
      type,
      entries: result.rows.map(row => ({
        rank: Number(row.rank),
        playerId: row.player_id,
        playerName: row.player_name,
        shardId: row.shard_id,
        value: Number(row.value)
      })),
      lastUpdated: Date.now()
    };

    // Update cache
    this.leaderboardCache.set(cacheKey, leaderboard);
    this.lastLeaderboardUpdate = Date.now();

    return leaderboard;
  }

  /**
   * Update leaderboard ranks (run periodically)
   */
  async recalculateRanks(type: 'money' | 'reputation' | 'level' | 'corp_power'): Promise<void> {
    await this.db.query(`
      UPDATE leaderboard_snapshots ls
      SET rank = sub.new_rank
      FROM (
        SELECT player_id, ROW_NUMBER() OVER (ORDER BY value DESC) as new_rank
        FROM leaderboard_snapshots
        WHERE leaderboard_type = $1
      ) sub
      WHERE ls.player_id = sub.player_id AND ls.leaderboard_type = $1
    `, [type]);

    // Clear cache
    this.leaderboardCache.clear();
  }

  // === GLOBAL EVENTS ===

  /**
   * Create global event
   */
  async createGlobalEvent(event: Omit<GlobalEventPayload, 'data'> & { createdBy?: string; durationSeconds?: number }): Promise<number> {
    const result = await this.db.query(`
      INSERT INTO global_events (
        event_type, title, description, affected_shards, 
        start_at, end_at, is_active, created_by
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 
        CASE WHEN $5 > 0 THEN CURRENT_TIMESTAMP + ($5 || ' seconds')::INTERVAL ELSE NULL END,
        TRUE, $6)
      RETURNING id
    `, [
      event.eventType,
      event.title,
      event.description,
      event.affectedShards === 'all' ? ['all'] : event.affectedShards,
      event.durationSeconds ?? 0,
      event.createdBy
    ]);

    return result.rows[0].id;
  }

  /**
   * Get active global events
   */
  async getActiveGlobalEvents(shardId?: string): Promise<GlobalEventPayload[]> {
    const result = await this.db.query(`
      SELECT * FROM global_events
      WHERE is_active = TRUE
        AND (end_at IS NULL OR end_at > CURRENT_TIMESTAMP)
        AND ('all' = ANY(affected_shards) OR $1 = ANY(affected_shards) OR $1 IS NULL)
      ORDER BY start_at DESC
    `, [shardId]);

    return result.rows.map(row => ({
      eventType: row.event_type,
      title: row.title,
      description: row.description,
      duration: row.end_at ? Math.floor((new Date(row.end_at).getTime() - Date.now()) / 1000) : undefined,
      affectedShards: row.affected_shards.includes('all') ? 'all' : row.affected_shards,
      data: row.data
    }));
  }

  /**
   * End global event
   */
  async endGlobalEvent(eventId: number): Promise<void> {
    await this.db.query(`
      UPDATE global_events 
      SET is_active = FALSE, end_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [eventId]);
  }

  // === SYNC EVENTS LOG ===

  /**
   * Log sync event for debugging/replay
   */
  async logSyncEvent(event: SyncEvent): Promise<void> {
    await this.db.query(`
      INSERT INTO sync_events (event_id, event_type, sender_id, shard_id, target_shard_id, payload)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      event.eventId,
      event.type,
      event.senderId,
      event.shardId,
      event.targetShardId,
      JSON.stringify(event.payload)
    ]);
  }

  /**
   * Get recent sync events (for debugging)
   */
  async getRecentSyncEvents(limit: number = 100): Promise<SyncEvent[]> {
    const result = await this.db.query(`
      SELECT * FROM sync_events
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => ({
      type: row.event_type,
      payload: row.payload,
      timestamp: new Date(row.created_at).getTime(),
      senderId: row.sender_id,
      shardId: row.shard_id,
      targetShardId: row.target_shard_id,
      eventId: row.event_id
    }));
  }

  // === PLAYER SESSIONS ===

  /**
   * Record player session
   */
  async recordPlayerSession(
    playerId: string,
    playerName: string,
    shardId: string,
    socketId: string,
    ipAddress?: string
  ): Promise<void> {
    // Mark old sessions as offline
    await this.db.query(`
      UPDATE player_sessions 
      SET is_online = FALSE, disconnected_at = CURRENT_TIMESTAMP
      WHERE player_id = $1 AND is_online = TRUE
    `, [playerId]);

    // Create new session
    await this.db.query(`
      INSERT INTO player_sessions (player_id, player_name, shard_id, socket_id, ip_address, is_online)
      VALUES ($1, $2, $3, $4, $5, TRUE)
    `, [playerId, playerName, shardId, socketId, ipAddress]);
  }

  /**
   * End player session
   */
  async endPlayerSession(socketId: string): Promise<void> {
    await this.db.query(`
      UPDATE player_sessions 
      SET is_online = FALSE, disconnected_at = CURRENT_TIMESTAMP
      WHERE socket_id = $1
    `, [socketId]);
  }

  /**
   * Get online players by shard
   */
  async getOnlinePlayersByShard(shardId: string): Promise<Array<{ playerId: string; playerName: string; connectedAt: Date }>> {
    const result = await this.db.query(`
      SELECT player_id, player_name, connected_at
      FROM player_sessions
      WHERE shard_id = $1 AND is_online = TRUE
      ORDER BY connected_at DESC
    `, [shardId]);

    return result.rows.map(row => ({
      playerId: row.player_id,
      playerName: row.player_name,
      connectedAt: row.connected_at
    }));
  }

  /**
   * Get total online count
   */
  async getTotalOnlineCount(): Promise<{ total: number; byShardId: Record<string, number> }> {
    const result = await this.db.query(`
      SELECT shard_id, COUNT(*) as count
      FROM player_sessions
      WHERE is_online = TRUE
      GROUP BY shard_id
    `);

    const byShardId: Record<string, number> = {};
    let total = 0;

    for (const row of result.rows) {
      byShardId[row.shard_id] = Number(row.count);
      total += Number(row.count);
    }

    return { total, byShardId };
  }

  // === CLEANUP ===

  /**
   * Cleanup stale sessions (for crash recovery)
   */
  async cleanupStaleSessions(staleMinutes: number = 5): Promise<number> {
    const result = await this.db.query(`
      UPDATE player_sessions 
      SET is_online = FALSE, disconnected_at = CURRENT_TIMESTAMP
      WHERE is_online = TRUE 
        AND last_ping < CURRENT_TIMESTAMP - ($1 || ' minutes')::INTERVAL
    `, [staleMinutes]);

    return result.rowCount ?? 0;
  }
}
