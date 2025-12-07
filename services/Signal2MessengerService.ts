/**
 * Signal 2.0 Messenger Service
 * Frontend integration layer для Signal 2.0 backend
 * 
 * Функции:
 * - REST API wrapper для каналов, сообщений, гильдий, уведомлений
 * - WebSocket подписка на real-time обновления
 * - Локальный кэш и офлайн очередь
 * - Поддержка @mentions, reactions, typing indicators
 */

// ========== TYPES ==========

export interface Signal2Channel {
  id: string;
  name: string;
  description?: string;
  type: 'global' | 'guild' | 'corporate' | 'dm';
  owner_id?: string;
  is_private: boolean;
  member_count: number;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface Signal2Message {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  mentions: string[];
  is_edited: boolean;
  created_at: string;
  reactions: Record<string, number>;
  metadata?: Record<string, any>;
}

export interface Signal2Notification {
  id: string;
  user_id: string;
  type: 'message' | 'mention' | 'quest' | 'achievement' | 'social' | 'system';
  title: string;
  content: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Signal2Guild {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  member_count: number;
  level: number;
  treasury: number;
  logo_url?: string;
  is_recruiting: boolean;
  created_at: string;
}

export interface CacheData {
  channels: Signal2Channel[];
  messages: Record<string, Signal2Message[]>; // By channel_id
  guilds: Signal2Guild[];
  notifications: Signal2Notification[];
  lastSync: number;
}

export interface OfflineAction {
  id: string;
  type: 'send_message' | 'react' | 'read_notification';
  data: any;
  timestamp: number;
  retries: number;
}

// ========== SERVICE CLASS ==========

export class Signal2MessengerService {
  private baseUrl: string;
  private wsUrl: string;
  private userId: string;
  private ws: WebSocket | null = null;
  private wsReconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  
  // Cache
  private cache: CacheData = {
    channels: [],
    messages: {},
    guilds: [],
    notifications: [],
    lastSync: 0
  };
  
  // Offline queue
  private offlineQueue: OfflineAction[] = [];
  private isOnline = navigator.onLine;
  
  // Callbacks
  private onMessageReceived: ((msg: Signal2Message) => void) | null = null;
  private onChannelUpdate: ((channel: Signal2Channel) => void) | null = null;
  private onNotification: ((notif: Signal2Notification) => void) | null = null;
  private onConnectionChange: ((isConnected: boolean) => void) | null = null;

  constructor(baseUrl = 'http://localhost:3000', userId: string = 'guest') {
    this.baseUrl = baseUrl;
    this.wsUrl = this.baseUrl.replace('http', 'ws');
    this.userId = userId;
    
    // Listen to online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  // ========== LIFECYCLE ==========

  /**
   * Initialize service: Load cache, connect WebSocket
   */
  async initialize() {
    console.log('[Signal2Service] Initializing...');
    
    // Load from localStorage
    this.loadCache();
    
    // Fetch latest data
    await this.refreshChannels();
    await this.refreshGuilds();
    await this.refreshNotifications();
    
    // Connect WebSocket
    this.connectWebSocket();
    
    console.log('[Signal2Service] Ready');
  }

  /**
   * Cleanup: Disconnect WebSocket, save cache
   */
  destroy() {
    console.log('[Signal2Service] Destroying...');
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.saveCache();
  }

  // ========== CACHE MANAGEMENT ==========

  private saveCache() {
    try {
      localStorage.setItem('signal2_cache', JSON.stringify(this.cache));
    } catch (e) {
      console.error('[Signal2Service] Failed to save cache:', e);
    }
  }

  private loadCache() {
    try {
      const cached = localStorage.getItem('signal2_cache');
      if (cached) {
        this.cache = JSON.parse(cached);
        console.log('[Signal2Service] Cache loaded');
      }
    } catch (e) {
      console.error('[Signal2Service] Failed to load cache:', e);
    }
  }

  private getCachedMessages(channelId: string): Signal2Message[] {
    return this.cache.messages[channelId] || [];
  }

  private setCachedMessages(channelId: string, messages: Signal2Message[]) {
    this.cache.messages[channelId] = messages;
    this.saveCache();
  }

  // ========== CHANNELS API ==========

  async getChannels(): Promise<Signal2Channel[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/channels`);
      const channels = await res.json();
      this.cache.channels = channels;
      this.saveCache();
      return channels;
    } catch (e) {
      console.error('[Signal2Service] Failed to get channels:', e);
      return this.cache.channels; // Return cached
    }
  }

  async getChannel(channelId: string): Promise<Signal2Channel | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/channels/${channelId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('[Signal2Service] Failed to get channel:', e);
      return null;
    }
  }

  async createChannel(name: string, type: string, description?: string): Promise<Signal2Channel | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, description, owner_id: this.userId })
      });
      if (!res.ok) return null;
      const channel = await res.json();
      this.cache.channels.push(channel);
      this.saveCache();
      return channel;
    } catch (e) {
      console.error('[Signal2Service] Failed to create channel:', e);
      return null;
    }
  }

  async refreshChannels() {
    return this.getChannels();
  }

  // ========== MESSAGES API ==========

  async getChannelMessages(channelId: string, limit = 50, offset = 0): Promise<Signal2Message[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/api/channels/${channelId}/messages?limit=${limit}&offset=${offset}`
      );
      const messages = await res.json();
      this.setCachedMessages(channelId, messages);
      return messages;
    } catch (e) {
      console.error('[Signal2Service] Failed to get messages:', e);
      return this.getCachedMessages(channelId);
    }
  }

  async sendMessage(
    channelId: string,
    content: string,
    mentions: string[] = []
  ): Promise<Signal2Message | null> {
    const action: OfflineAction = {
      id: `msg_${Date.now()}`,
      type: 'send_message',
      data: { channelId, content, mentions },
      timestamp: Date.now(),
      retries: 0
    };

    // If offline, queue it
    if (!this.isOnline) {
      this.offlineQueue.push(action);
      console.log('[Signal2Service] Message queued for offline:', action.id);
      return null;
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: this.userId,
          sender_name: localStorage.getItem('userName') || this.userId,
          content,
          mentions
        })
      });

      if (!res.ok) {
        // Queue for retry if failed
        action.retries++;
        if (action.retries < 3) {
          this.offlineQueue.push(action);
        }
        return null;
      }

      const message = await res.json();
      
      // Add to cache
      const cached = this.getCachedMessages(channelId);
      this.setCachedMessages(channelId, [...cached, message]);

      return message;
    } catch (e) {
      console.error('[Signal2Service] Failed to send message:', e);
      action.retries++;
      if (action.retries < 3) {
        this.offlineQueue.push(action);
      }
      return null;
    }
  }

  async addReaction(messageId: string, emoji: string): Promise<boolean> {
    if (!this.isOnline) {
      this.offlineQueue.push({
        id: `react_${Date.now()}`,
        type: 'react',
        data: { messageId, emoji },
        timestamp: Date.now(),
        retries: 0
      });
      return false;
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, user_id: this.userId })
      });
      return res.ok;
    } catch (e) {
      console.error('[Signal2Service] Failed to add reaction:', e);
      return false;
    }
  }

  // ========== GUILDS API ==========

  async getGuilds(): Promise<Signal2Guild[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/guilds`);
      const guilds = await res.json();
      this.cache.guilds = guilds;
      this.saveCache();
      return guilds;
    } catch (e) {
      console.error('[Signal2Service] Failed to get guilds:', e);
      return this.cache.guilds;
    }
  }

  async createGuild(name: string, description?: string): Promise<Signal2Guild | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/guilds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, owner_id: this.userId, description })
      });
      if (!res.ok) return null;
      const guild = await res.json();
      this.cache.guilds.push(guild);
      this.saveCache();
      return guild;
    } catch (e) {
      console.error('[Signal2Service] Failed to create guild:', e);
      return null;
    }
  }

  async refreshGuilds() {
    return this.getGuilds();
  }

  // ========== NOTIFICATIONS API ==========

  async getNotifications(unreadOnly = false): Promise<Signal2Notification[]> {
    try {
      const url = unreadOnly
        ? `${this.baseUrl}/api/notifications/${this.userId}?unreadOnly=true`
        : `${this.baseUrl}/api/notifications/${this.userId}`;
      
      const res = await fetch(url);
      const notifications = await res.json();
      this.cache.notifications = notifications;
      this.saveCache();
      return notifications;
    } catch (e) {
      console.error('[Signal2Service] Failed to get notifications:', e);
      return this.cache.notifications;
    }
  }

  async refreshNotifications() {
    return this.getNotifications();
  }

  async markNotificationsAsRead(notificationIds: string[]): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/notifications/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: this.userId, notification_ids: notificationIds })
      });
      return res.ok;
    } catch (e) {
      console.error('[Signal2Service] Failed to mark notifications as read:', e);
      return false;
    }
  }

  // ========== WEBSOCKET ==========

  private connectWebSocket() {
    if (this.ws) return;
    if (!this.isOnline) return;

    try {
      const wsUrl = this.wsUrl.replace(':3000', ':3000').replace('http:', 'ws:').replace('https:', 'wss:');
      console.log('[Signal2Service] Connecting WebSocket:', wsUrl);
      
      this.ws = new WebSocket(wsUrl + '/ws/messages');
      
      this.ws.onopen = () => {
        console.log('[Signal2Service] WebSocket connected');
        this.wsReconnectAttempts = 0;
        this.onConnectionChange?.(true);
        this.processOfflineQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWSMessage(data);
        } catch (e) {
          console.error('[Signal2Service] Failed to parse WS message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('[Signal2Service] WebSocket disconnected');
        this.ws = null;
        this.onConnectionChange?.(false);
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[Signal2Service] WebSocket error:', error);
      };
    } catch (e) {
      console.error('[Signal2Service] Failed to connect WebSocket:', e);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.wsReconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[Signal2Service] Max reconnect attempts reached');
      return;
    }

    this.wsReconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.wsReconnectAttempts - 1);
    console.log(`[Signal2Service] Reconnecting in ${delay}ms (attempt ${this.wsReconnectAttempts})`);

    setTimeout(() => {
      if (!this.ws) {
        this.connectWebSocket();
      }
    }, delay);
  }

  private handleWSMessage(data: any) {
    console.log('[Signal2Service] WS message:', data.type);

    switch (data.type) {
      case 'new_message':
        this.onMessageReceived?.(data.message);
        break;
      case 'channel_update':
        this.onChannelUpdate?.(data.channel);
        break;
      case 'notification':
        this.onNotification?.(data);
        break;
      case 'mentioned':
        this.onNotification?.(data);
        break;
    }
  }

  subscribeToChannel(channelId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[Signal2Service] WebSocket not ready');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'subscribe',
      channel_id: channelId
    }));
  }

  unsubscribeFromChannel(channelId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({
      type: 'unsubscribe',
      channel_id: channelId
    }));
  }

  // ========== OFFLINE SUPPORT ==========

  private handleOnline() {
    console.log('[Signal2Service] Back online');
    this.isOnline = true;
    this.connectWebSocket();
    this.processOfflineQueue();
    this.onConnectionChange?.(true);
  }

  private handleOffline() {
    console.log('[Signal2Service] Going offline');
    this.isOnline = false;
    this.onConnectionChange?.(false);
  }

  private async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    console.log(`[Signal2Service] Processing ${this.offlineQueue.length} offline actions`);

    const remaining: OfflineAction[] = [];

    for (const action of this.offlineQueue) {
      try {
        switch (action.type) {
          case 'send_message': {
            const { channelId, content, mentions } = action.data;
            const msg = await this.sendMessage(channelId, content, mentions);
            if (!msg) {
              remaining.push(action);
            }
            break;
          }
          case 'react': {
            const { messageId, emoji } = action.data;
            const ok = await this.addReaction(messageId, emoji);
            if (!ok) {
              remaining.push(action);
            }
            break;
          }
        }
      } catch (e) {
        console.error('[Signal2Service] Error processing offline action:', e);
        remaining.push(action);
      }
    }

    this.offlineQueue = remaining;
  }

  // ========== EVENT LISTENERS ==========

  onMessage(callback: (msg: Signal2Message) => void) {
    this.onMessageReceived = callback;
  }

  onChannel(callback: (channel: Signal2Channel) => void) {
    this.onChannelUpdate = callback;
  }

  onNotify(callback: (notif: Signal2Notification) => void) {
    this.onNotification = callback;
  }

  onConnected(callback: (isConnected: boolean) => void) {
    this.onConnectionChange = callback;
  }

  // ========== UTILITIES ==========

  setUserId(userId: string) {
    this.userId = userId;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getCachedChannels(): Signal2Channel[] {
    return this.cache.channels;
  }

  getCachedGuilds(): Signal2Guild[] {
    return this.cache.guilds;
  }

  getCachedNotifications(): Signal2Notification[] {
    return this.cache.notifications;
  }

  getOfflineQueueSize(): number {
    return this.offlineQueue.length;
  }
}

// ========== SINGLETON INSTANCE ==========

let serviceInstance: Signal2MessengerService | null = null;

export function getSignal2Service(baseUrl?: string, userId?: string): Signal2MessengerService {
  if (!serviceInstance) {
    serviceInstance = new Signal2MessengerService(baseUrl, userId);
  }
  return serviceInstance;
}

export function resetSignal2Service() {
  if (serviceInstance) {
    serviceInstance.destroy();
    serviceInstance = null;
  }
}
