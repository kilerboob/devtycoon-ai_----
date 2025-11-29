/**
 * WebSocket Client Service - LAYER 4: Frontend Sync
 * 
 * Клиент для подключения к WS серверу с:
 * - Auto-reconnect
 * - Offline action queue
 * - State sync
 * - Event handlers
 */

import { io, Socket } from 'socket.io-client';

// === TYPES ===

export type SyncEventType = 
  | 'PLAYER_JOIN' | 'PLAYER_LEAVE' | 'PLAYER_UPDATE'
  | 'CHAT_MESSAGE' | 'CHAT_GLOBAL'
  | 'STATE_SYNC' | 'STATE_DELTA'
  | 'CORP_ACTION' | 'CORP_UPDATE'
  | 'GLOBAL_EVENT' | 'LEADERBOARD_UPDATE'
  | 'PING' | 'PONG' | 'ERROR';

export interface SyncEvent<T = unknown> {
  type: SyncEventType;
  payload: T;
  timestamp: number;
  senderId: string;
  shardId: string;
  eventId: string;
}

export interface ChatMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
  channel: 'shard' | 'global' | 'corp' | 'private';
  recipientId?: string;
  timestamp: number;
}

export interface PlayerInfo {
  playerId: string;
  playerName: string;
  shardId: string;
  connectedAt: number;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

type EventCallback<T = unknown> = (event: SyncEvent<T>) => void;
type StateCallback = (state: ConnectionState) => void;

// === CLIENT CLASS ===

class WSClientService {
  private socket: Socket | null = null;
  private serverUrl: string = '';
  private playerId: string = '';
  private playerName: string = '';
  private shardId: string = '';
  
  private connectionState: ConnectionState = 'disconnected';
  private stateListeners: Set<StateCallback> = new Set();
  private eventListeners: Map<SyncEventType | '*', Set<EventCallback>> = new Map();
  
  private offlineQueue: Array<{ event: string; data: unknown }> = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  
  private lastPing: number = 0;
  private latency: number = 0;
  private onlineCount: number = 0;
  private shardPlayers: PlayerInfo[] = [];

  /**
   * Initialize and connect to WebSocket server
   */
  async connect(config: {
    serverUrl: string;
    playerId: string;
    playerName: string;
    shardId: string;
    token?: string;
  }): Promise<boolean> {
    this.serverUrl = config.serverUrl;
    this.playerId = config.playerId;
    this.playerName = config.playerName;
    this.shardId = config.shardId;

    this.setConnectionState('connecting');

    return new Promise((resolve) => {
      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 5000,
          timeout: 10000,
          autoConnect: true
        });

        // Connection established
        this.socket.on('connect', () => {
          console.log('[WSClient] Connected to server');
          this.reconnectAttempts = 0;
          
          // Authenticate
          this.socket!.emit('auth', {
            playerId: this.playerId,
            playerName: this.playerName,
            shardId: this.shardId,
            token: config.token
          });
        });

        // Auth success
        this.socket.on('auth:success', (data: { socketId: string; playerId: string; shardId: string; serverTime: number; onlineCount: number }) => {
          console.log('[WSClient] Auth success:', data);
          this.onlineCount = data.onlineCount;
          this.setConnectionState('connected');
          
          // Flush offline queue
          this.flushOfflineQueue();
          
          // Request initial state sync
          this.requestStateSync('initial');
          
          resolve(true);
        });

        // Sync events
        this.socket.on('sync:event', (event: SyncEvent) => {
          this.handleSyncEvent(event);
        });

        // State sync response
        this.socket.on('state:sync:response', (data: { type: string; shardId: string; players: PlayerInfo[]; onlineCount: number; serverTime: number }) => {
          this.shardPlayers = data.players;
          this.onlineCount = data.onlineCount;
          this.emitEvent({ type: 'STATE_SYNC', payload: data, timestamp: Date.now(), senderId: 'server', shardId: data.shardId, eventId: 'sync' });
        });

        // Pong (latency measurement)
        this.socket.on('pong', (data: { clientTimestamp: number; serverTimestamp: number }) => {
          this.latency = Date.now() - data.clientTimestamp;
          this.lastPing = Date.now();
        });

        // Disconnect
        this.socket.on('disconnect', (reason) => {
          console.log('[WSClient] Disconnected:', reason);
          this.setConnectionState('disconnected');
        });

        // Reconnecting
        this.socket.on('reconnect_attempt', (attempt) => {
          console.log('[WSClient] Reconnecting... attempt:', attempt);
          this.reconnectAttempts = attempt;
          this.setConnectionState('reconnecting');
        });

        // Reconnected
        this.socket.on('reconnect', () => {
          console.log('[WSClient] Reconnected');
          // Re-authenticate
          this.socket!.emit('auth', {
            playerId: this.playerId,
            playerName: this.playerName,
            shardId: this.shardId
          });
        });

        // Error
        this.socket.on('error', (error: { code: string; message: string }) => {
          console.error('[WSClient] Error:', error);
          this.emitEvent({ type: 'ERROR', payload: error, timestamp: Date.now(), senderId: 'server', shardId: this.shardId, eventId: 'error' });
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
          console.error('[WSClient] Connection error:', error.message);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.setConnectionState('disconnected');
            resolve(false);
          }
        });

        // Start ping interval
        this.startPingInterval();

      } catch (error) {
        console.error('[WSClient] Init error:', error);
        this.setConnectionState('disconnected');
        resolve(false);
      }
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.setConnectionState('disconnected');
  }

  /**
   * Send chat message
   */
  sendChatMessage(content: string, channel: 'shard' | 'global' | 'corp' | 'private' = 'shard', recipientId?: string): void {
    const data = {
      content,
      channel,
      recipientId
    };

    if (this.isConnected()) {
      this.socket!.emit('chat:message', data);
    } else {
      this.queueOfflineAction('chat:message', data);
    }
  }

  /**
   * Send player update
   */
  sendPlayerUpdate(updates: Partial<{ money: number; reputation: number; level: number; tier: string; role: string; corporationId: string | null }>): void {
    const data = {
      playerId: this.playerId,
      updates
    };

    if (this.isConnected()) {
      this.socket!.emit('player:update', data);
    } else {
      this.queueOfflineAction('player:update', data);
    }
  }

  /**
   * Send corporation action
   */
  sendCorpAction(action: string, corpId: string, targetId?: string, data?: Record<string, unknown>): void {
    const payload = {
      action,
      corpId,
      targetId,
      data
    };

    if (this.isConnected()) {
      this.socket!.emit('corp:action', payload);
    } else {
      this.queueOfflineAction('corp:action', payload);
    }
  }

  /**
   * Request state sync
   */
  requestStateSync(type: string = 'full'): void {
    if (this.isConnected()) {
      this.socket!.emit('state:sync', { type });
    }
  }

  /**
   * Add event listener
   */
  on<T = unknown>(eventType: SyncEventType | '*', callback: EventCallback<T>): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(eventType)?.delete(callback as EventCallback);
    };
  }

  /**
   * Add connection state listener
   */
  onStateChange(callback: StateCallback): () => void {
    this.stateListeners.add(callback);
    // Immediately call with current state
    callback(this.connectionState);

    return () => {
      this.stateListeners.delete(callback);
    };
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected' && this.socket?.connected === true;
  }

  /**
   * Get current latency
   */
  getLatency(): number {
    return this.latency;
  }

  /**
   * Get online count
   */
  getOnlineCount(): number {
    return this.onlineCount;
  }

  /**
   * Get shard players
   */
  getShardPlayers(): PlayerInfo[] {
    return this.shardPlayers;
  }

  /**
   * Get current player info
   */
  getPlayerInfo(): { playerId: string; playerName: string; shardId: string } {
    return {
      playerId: this.playerId,
      playerName: this.playerName,
      shardId: this.shardId
    };
  }

  // === PRIVATE METHODS ===

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      for (const listener of this.stateListeners) {
        listener(state);
      }
    }
  }

  private handleSyncEvent(event: SyncEvent): void {
    // Update local state based on event type
    switch (event.type) {
      case 'PLAYER_JOIN':
        this.onlineCount++;
        const joinPayload = event.payload as { playerId: string; playerName: string; shardId: string };
        if (joinPayload.shardId === this.shardId) {
          this.shardPlayers.push({
            playerId: joinPayload.playerId,
            playerName: joinPayload.playerName,
            shardId: joinPayload.shardId,
            connectedAt: event.timestamp
          });
        }
        break;

      case 'PLAYER_LEAVE':
        this.onlineCount = Math.max(0, this.onlineCount - 1);
        const leavePayload = event.payload as { playerId: string };
        this.shardPlayers = this.shardPlayers.filter(p => p.playerId !== leavePayload.playerId);
        break;
    }

    // Emit to listeners
    this.emitEvent(event);
  }

  private emitEvent(event: SyncEvent): void {
    // Type-specific listeners
    const typeListeners = this.eventListeners.get(event.type);
    if (typeListeners) {
      for (const listener of typeListeners) {
        listener(event);
      }
    }

    // Wildcard listeners
    const wildcardListeners = this.eventListeners.get('*');
    if (wildcardListeners) {
      for (const listener of wildcardListeners) {
        listener(event);
      }
    }
  }

  private queueOfflineAction(event: string, data: unknown): void {
    this.offlineQueue.push({ event, data });
    console.log('[WSClient] Queued offline action:', event);
  }

  private flushOfflineQueue(): void {
    if (this.offlineQueue.length === 0) return;

    console.log(`[WSClient] Flushing ${this.offlineQueue.length} offline actions`);
    
    for (const action of this.offlineQueue) {
      this.socket?.emit(action.event, action.data);
    }
    
    this.offlineQueue = [];
  }

  private startPingInterval(): void {
    setInterval(() => {
      if (this.isConnected()) {
        this.socket!.emit('ping', Date.now());
      }
    }, 5000);
  }
}

// Export singleton
export const wsClient = new WSClientService();
