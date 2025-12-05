/**
 * WebSocket Server - LAYER 4: Soft-Sharding + Global Sync
 * 
 * Socket.IO сервер с поддержкой:
 * - Rooms по shardId
 * - Cross-shard messaging через Redis Pub/Sub
 * - State replication
 * - Heartbeat/ping система
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  SyncEvent,
  SyncEventType,
  ConnectedClient,
  ChatMessagePayload,
  PlayerJoinPayload,
  PlayerLeavePayload,
  PlayerUpdatePayload,
  WSServerConfig,
  RoomType
} from './types';
import { RedisAdapter } from './redisAdapter';

// Default config
const DEFAULT_CONFIG: WSServerConfig = {
  port: 3001,
  corsOrigin: ['http://localhost:3000', 'http://localhost:3003', 'http://localhost:5173'],
  pingInterval: 25000,
  pingTimeout: 10000,
  maxClients: 10000,
  enableRedis: false
};

export class WebSocketServer {
  private io: Server | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private playerToSocket: Map<string, string> = new Map(); // playerId -> socketId
  private redisAdapter: RedisAdapter | null = null;
  private config: WSServerConfig;
  private nodeId: string;
  private onlineCount: number = 0;

  constructor(config: Partial<WSServerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.nodeId = `ws-node-${uuidv4().substring(0, 8)}`;
  }

  /**
   * Initialize WebSocket server
   */
  async init(httpServer: HttpServer): Promise<void> {
    this.io = new Server(httpServer, {
      cors: {
        origin: this.config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingInterval: this.config.pingInterval,
      pingTimeout: this.config.pingTimeout,
      maxHttpBufferSize: 1e6 // 1MB
    });

    // Initialize Redis adapter if enabled
    if (this.config.enableRedis && this.config.redisUrl) {
      this.redisAdapter = new RedisAdapter(this.config.redisUrl, this.nodeId);
      await this.redisAdapter.init();
      
      // Subscribe to cross-node messages
      this.redisAdapter.onMessage((channel, event) => {
        this.handleRedisMessage(channel, event);
      });
    }

    // Setup connection handler
    this.io.on('connection', (socket) => this.handleConnection(socket));

    console.log(`[WSServer] ${this.nodeId} initialized, Redis: ${this.config.enableRedis}`);
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: Socket): void {
    console.log(`[WSServer] New connection: ${socket.id}`);

    // Auth handler
    socket.on('auth', (data: { playerId: string; playerName: string; shardId: string; token?: string }) => {
      this.handleAuth(socket, data);
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      this.handleDisconnect(socket, reason);
    });

    // Chat message handler
    socket.on('chat:message', (data: Omit<ChatMessagePayload, 'messageId' | 'timestamp'>) => {
      this.handleChatMessage(socket, data);
    });

    // Player update handler
    socket.on('player:update', (data: PlayerUpdatePayload) => {
      this.handlePlayerUpdate(socket, data);
    });

    // State sync request handler
    socket.on('state:sync', (data: { type: string }) => {
      this.handleStateSyncRequest(socket, data);
    });

    // Corporation action handler
    socket.on('corp:action', (data: any) => {
      this.handleCorpAction(socket, data);
    });

    // Ping handler for latency measurement
    socket.on('ping', (timestamp: number) => {
      socket.emit('pong', { clientTimestamp: timestamp, serverTimestamp: Date.now() });
    });

    // Raid events
    socket.on('raid:join', (data: { raidId: number; playerId: string; username: string }) => {
      this.handleRaidJoin(socket, data);
    });

    socket.on('raid:hack-attempt', (data: { raidId: number; playerId: string; success: boolean; progress: number }) => {
      this.handleRaidHackAttempt(socket, data);
    });

    socket.on('raid:progress', (data: { raidId: number; hackProgress: number; phase: string }) => {
      this.handleRaidProgress(socket, data);
    });

    socket.on('raid:damage', (data: { raidId: number; playerId: string; damage: number; target: string }) => {
      this.handleRaidDamage(socket, data);
    });

    socket.on('raid:loot-drop', (data: { raidId: number; itemId: string; rarity: string; value: number }) => {
      this.handleRaidLootDrop(socket, data);
    });

    socket.on('raid:complete', (data: { raidId: number; success: boolean; rewards: any }) => {
      this.handleRaidComplete(socket, data);
    });

    // Error handler
    socket.on('error', (error) => {
      console.error(`[WSServer] Socket error ${socket.id}:`, error);
    });
  }

  /**
   * Handle raid participant join
   */
  private handleRaidJoin(socket: Socket, data: { raidId: number; playerId: string; username: string }): void {
    const client = this.clients.get(socket.id);
    if (!client) return;

    const room = `raid:${data.raidId}`;
    socket.join(room);

    const event = this.createEvent('RAID_PARTICIPANT_JOINED', {
      raidId: data.raidId,
      playerId: data.playerId,
      username: data.username,
      timestamp: Date.now()
    }, client.playerId, client.shardId);

    this.broadcastToRoom(room, event);

    if (this.redisAdapter) {
      this.redisAdapter.publish(room, event);
    }

    console.log(`[WSServer] Player ${data.username} joined raid ${data.raidId}`);
  }

  /**
   * Handle hack attempt
   */
  private handleRaidHackAttempt(socket: Socket, data: { raidId: number; playerId: string; success: boolean; progress: number }): void {
    const client = this.clients.get(socket.id);
    if (!client) return;

    const room = `raid:${data.raidId}`;

    const event = this.createEvent('RAID_HACK_ATTEMPT', {
      raidId: data.raidId,
      playerId: data.playerId,
      success: data.success,
      progress: data.progress,
      timestamp: Date.now()
    }, client.playerId, client.shardId);

    this.broadcastToRoom(room, event);

    if (this.redisAdapter) {
      this.redisAdapter.publish(room, event);
    }

    console.log(`[WSServer] Hack attempt in raid ${data.raidId}: ${data.success ? 'SUCCESS' : 'FAILURE'}`);
  }

  /**
   * Handle raid progress update
   */
  private handleRaidProgress(socket: Socket, data: { raidId: number; hackProgress: number; phase: string }): void {
    const client = this.clients.get(socket.id);
    if (!client) return;

    const room = `raid:${data.raidId}`;

    const event = this.createEvent('RAID_PROGRESS_UPDATE', {
      raidId: data.raidId,
      hackProgress: data.hackProgress,
      phase: data.phase,
      timestamp: Date.now()
    }, client.playerId, client.shardId);

    this.broadcastToRoom(room, event);

    if (this.redisAdapter) {
      this.redisAdapter.publish(room, event);
    }

    console.log(`[WSServer] Raid ${data.raidId} progress: ${data.hackProgress}% (${data.phase})`);
  }

  /**
   * Handle damage dealt
   */
  private handleRaidDamage(socket: Socket, data: { raidId: number; playerId: string; damage: number; target: string }): void {
    const client = this.clients.get(socket.id);
    if (!client) return;

    const room = `raid:${data.raidId}`;

    const event = this.createEvent('RAID_DAMAGE', {
      raidId: data.raidId,
      playerId: data.playerId,
      damage: data.damage,
      target: data.target,
      timestamp: Date.now()
    }, client.playerId, client.shardId);

    this.broadcastToRoom(room, event);

    if (this.redisAdapter) {
      this.redisAdapter.publish(room, event);
    }

    console.log(`[WSServer] Damage in raid ${data.raidId}: ${data.damage} to ${data.target}`);
  }

  /**
   * Handle loot drop
   */
  private handleRaidLootDrop(socket: Socket, data: { raidId: number; itemId: string; rarity: string; value: number }): void {
    const client = this.clients.get(socket.id);
    if (!client) return;

    const room = `raid:${data.raidId}`;

    const event = this.createEvent('RAID_LOOT_DROP', {
      raidId: data.raidId,
      itemId: data.itemId,
      rarity: data.rarity,
      value: data.value,
      timestamp: Date.now()
    }, client.playerId, client.shardId);

    this.broadcastToRoom(room, event);

    if (this.redisAdapter) {
      this.redisAdapter.publish(room, event);
    }

    console.log(`[WSServer] Loot drop in raid ${data.raidId}: ${data.itemId} (${data.rarity})`);
  }

  /**
   * Handle raid completion
   */
  private handleRaidComplete(socket: Socket, data: { raidId: number; success: boolean; rewards: any }): void {
    const client = this.clients.get(socket.id);
    if (!client) return;

    const room = `raid:${data.raidId}`;

    const event = this.createEvent('RAID_COMPLETED', {
      raidId: data.raidId,
      success: data.success,
      rewards: data.rewards,
      timestamp: Date.now()
    }, client.playerId, client.shardId);

    this.broadcastToRoom(room, event);

    if (this.redisAdapter) {
      this.redisAdapter.publish(room, event);
    }

    // Clean up raid room after 5 seconds
    setTimeout(() => {
      const io = this.io;
      if (io) {
        io.in(room).disconnectSockets();
      }
    }, 5000);

    console.log(`[WSServer] Raid ${data.raidId} completed (success: ${data.success})`);
  }

  /**
   * Handle client authentication
   */
  private handleAuth(socket: Socket, data: { playerId: string; playerName: string; shardId: string; token?: string }): void {
    const { playerId, playerName, shardId } = data;

    // Check if player already connected (prevent duplicates)
    const existingSocketId = this.playerToSocket.get(playerId);
    if (existingSocketId && existingSocketId !== socket.id) {
      // Disconnect old socket
      const oldSocket = this.io?.sockets.sockets.get(existingSocketId);
      if (oldSocket) {
        oldSocket.emit('error', { code: 'DUPLICATE_SESSION', message: 'Connected from another location' });
        oldSocket.disconnect(true);
      }
    }

    // Create client record
    const client: ConnectedClient = {
      socketId: socket.id,
      playerId,
      playerName,
      shardId,
      connectedAt: Date.now(),
      lastPing: Date.now(),
      rooms: [`shard:${shardId}`, 'global']
    };

    // Store client
    this.clients.set(socket.id, client);
    this.playerToSocket.set(playerId, socket.id);
    this.onlineCount++;

    // Join rooms
    socket.join(`shard:${shardId}`);
    socket.join('global');

    // Confirm auth
    socket.emit('auth:success', {
      socketId: socket.id,
      playerId,
      shardId,
      serverTime: Date.now(),
      onlineCount: this.onlineCount
    });

    // Broadcast player join to shard
    const joinEvent = this.createEvent<PlayerJoinPayload>('PLAYER_JOIN', {
      playerId,
      playerName,
      shardId
    }, playerId, shardId);

    this.broadcastToRoom(`shard:${shardId}`, joinEvent, socket.id);

    // Publish to Redis for cross-node sync
    if (this.redisAdapter) {
      this.redisAdapter.publish(`shard:${shardId}`, joinEvent);
    }

    console.log(`[WSServer] Auth success: ${playerName} (${playerId}) -> shard:${shardId}, online: ${this.onlineCount}`);
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(socket: Socket, reason: string): void {
    const client = this.clients.get(socket.id);
    if (!client) return;

    // Remove from maps
    this.clients.delete(socket.id);
    this.playerToSocket.delete(client.playerId);
    this.onlineCount--;

    // Broadcast player leave to shard
    const leaveEvent = this.createEvent<PlayerLeavePayload>('PLAYER_LEAVE', {
      playerId: client.playerId,
      reason: reason === 'client namespace disconnect' ? 'logout' : 
              reason === 'ping timeout' ? 'timeout' : 'disconnect'
    }, client.playerId, client.shardId);

    this.broadcastToRoom(`shard:${client.shardId}`, leaveEvent);

    // Publish to Redis for cross-node sync
    if (this.redisAdapter) {
      this.redisAdapter.publish(`shard:${client.shardId}`, leaveEvent);
    }

    console.log(`[WSServer] Disconnect: ${client.playerName} (${reason}), online: ${this.onlineCount}`);
  }

  /**
   * Handle chat message
   */
  private handleChatMessage(socket: Socket, data: Omit<ChatMessagePayload, 'messageId' | 'timestamp'>): void {
    const client = this.clients.get(socket.id);
    if (!client) {
      socket.emit('error', { code: 'NOT_AUTHENTICATED', message: 'Please authenticate first' });
      return;
    }

    const message: ChatMessagePayload = {
      ...data,
      messageId: uuidv4(),
      senderId: client.playerId,
      senderName: client.playerName,
      timestamp: Date.now()
    };

    const chatEvent = this.createEvent<ChatMessagePayload>(
      data.channel === 'global' ? 'CHAT_GLOBAL' : 'CHAT_MESSAGE',
      message,
      client.playerId,
      client.shardId
    );

    // Route by channel
    switch (data.channel) {
      case 'global':
        this.broadcastToRoom('global', chatEvent);
        if (this.redisAdapter) {
          this.redisAdapter.publish('global', chatEvent);
        }
        break;

      case 'shard':
        this.broadcastToRoom(`shard:${client.shardId}`, chatEvent);
        if (this.redisAdapter) {
          this.redisAdapter.publish(`shard:${client.shardId}`, chatEvent);
        }
        break;

      case 'corp':
        if (data.recipientId) {
          this.broadcastToRoom(`corp:${data.recipientId}`, chatEvent);
          if (this.redisAdapter) {
            this.redisAdapter.publish(`corp:${data.recipientId}`, chatEvent);
          }
        }
        break;

      case 'private':
        if (data.recipientId) {
          const recipientSocketId = this.playerToSocket.get(data.recipientId);
          if (recipientSocketId) {
            this.io?.to(recipientSocketId).emit('sync:event', chatEvent);
          }
          // Also send to sender for confirmation
          socket.emit('sync:event', chatEvent);
        }
        break;
    }
  }

  /**
   * Handle player update (state change)
   */
  private handlePlayerUpdate(socket: Socket, data: PlayerUpdatePayload): void {
    const client = this.clients.get(socket.id);
    if (!client) return;

    const updateEvent = this.createEvent<PlayerUpdatePayload>('PLAYER_UPDATE', data, client.playerId, client.shardId);

    // Broadcast to shard
    this.broadcastToRoom(`shard:${client.shardId}`, updateEvent);

    // Cross-shard for leaderboard updates
    if (data.updates.money || data.updates.reputation || data.updates.level) {
      if (this.redisAdapter) {
        this.redisAdapter.publish('leaderboard', updateEvent);
      }
    }
  }

  /**
   * Handle state sync request
   */
  private handleStateSyncRequest(socket: Socket, data: { type: string }): void {
    const client = this.clients.get(socket.id);
    if (!client) return;

    // Return current online players in shard
    const shardClients = Array.from(this.clients.values())
      .filter(c => c.shardId === client.shardId)
      .map(c => ({
        playerId: c.playerId,
        playerName: c.playerName,
        connectedAt: c.connectedAt
      }));

    socket.emit('state:sync:response', {
      type: data.type,
      shardId: client.shardId,
      players: shardClients,
      onlineCount: this.onlineCount,
      serverTime: Date.now()
    });
  }

  /**
   * Handle corporation action
   */
  private handleCorpAction(socket: Socket, data: any): void {
    const client = this.clients.get(socket.id);
    if (!client) return;

    const corpEvent = this.createEvent('CORP_ACTION', {
      ...data,
      actorId: client.playerId
    }, client.playerId, client.shardId);

    // Corp events are cross-shard
    this.broadcastToRoom('global', corpEvent);
    
    if (this.redisAdapter) {
      this.redisAdapter.publish('corporations', corpEvent);
    }
  }

  /**
   * Handle message from Redis (cross-node)
   */
  private handleRedisMessage(channel: string, event: SyncEvent): void {
    // Avoid echo (message from this node)
    // Already handled by redisAdapter

    // Broadcast to appropriate room
    this.broadcastToRoom(channel, event);
  }

  /**
   * Create sync event
   */
  private createEvent<T>(type: SyncEventType, payload: T, senderId: string, shardId: string): SyncEvent<T> {
    return {
      type,
      payload,
      timestamp: Date.now(),
      senderId,
      shardId,
      eventId: uuidv4()
    };
  }

  /**
   * Broadcast event to room (excluding sender optionally)
   */
  private broadcastToRoom(room: string, event: SyncEvent, excludeSocketId?: string): void {
    if (!this.io) return;

    if (excludeSocketId) {
      this.io.to(room).except(excludeSocketId).emit('sync:event', event);
    } else {
      this.io.to(room).emit('sync:event', event);
    }
  }

  /**
   * Send global event (e.g., announcements)
   */
  sendGlobalEvent(event: SyncEvent): void {
    this.broadcastToRoom('global', event);
    
    if (this.redisAdapter) {
      this.redisAdapter.publish('global', event);
    }
  }

  /**
   * Get online statistics
   */
  getStats(): { onlineCount: number; shardCounts: Record<string, number> } {
    const shardCounts: Record<string, number> = {};
    
    for (const client of this.clients.values()) {
      shardCounts[client.shardId] = (shardCounts[client.shardId] || 0) + 1;
    }

    return {
      onlineCount: this.onlineCount,
      shardCounts
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[WSServer] Shutting down...');

    // Notify all clients
    if (this.io) {
      this.io.emit('error', { code: 'SERVER_SHUTDOWN', message: 'Server is shutting down' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.io.close();
    }

    // Close Redis connection
    if (this.redisAdapter) {
      await this.redisAdapter.shutdown();
    }

    console.log('[WSServer] Shutdown complete');
  }
}

// Export singleton factory
let wsServerInstance: WebSocketServer | null = null;

export function getWSServer(config?: Partial<WSServerConfig>): WebSocketServer {
  if (!wsServerInstance) {
    wsServerInstance = new WebSocketServer(config);
  }
  return wsServerInstance;
}
