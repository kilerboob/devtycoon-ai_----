/**
 * Redis Pub/Sub Adapter - LAYER 4: Cross-Node Messaging
 * 
 * Обеспечивает синхронизацию между несколькими инстансами WS сервера
 * через Redis Pub/Sub для горизонтального масштабирования.
 */

import Redis from 'ioredis';
import { SyncEvent } from './types';

type MessageHandler = (channel: string, event: SyncEvent) => void;

export class RedisAdapter {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private redisUrl: string;
  private nodeId: string;
  private messageHandler: MessageHandler | null = null;
  private subscribedChannels: Set<string> = new Set();
  private isShuttingDown = false;

  constructor(redisUrl: string, nodeId: string) {
    this.redisUrl = redisUrl;
    this.nodeId = nodeId;
  }

  /**
   * Initialize Redis connections
   */
  async init(): Promise<void> {
    try {
      // Create publisher connection
      this.publisher = new Redis(this.redisUrl, {
        retryStrategy: (times) => Math.min(times * 100, 3000),
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      // Create subscriber connection (separate connection required for subscribe mode)
      this.subscriber = new Redis(this.redisUrl, {
        retryStrategy: (times) => Math.min(times * 100, 3000),
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      await this.publisher.connect();
      await this.subscriber.connect();

      // Setup subscriber message handler
      this.subscriber.on('message', (channel: string, message: string) => {
        this.handleMessage(channel, message);
      });

      // Subscribe to default channels
      await this.subscribe('global');
      await this.subscribe('corporations');
      await this.subscribe('leaderboard');

      // Handle connection errors
      this.publisher.on('error', (err) => {
        if (!this.isShuttingDown) {
          console.error('[RedisAdapter] Publisher error:', err.message);
        }
      });

      this.subscriber.on('error', (err) => {
        if (!this.isShuttingDown) {
          console.error('[RedisAdapter] Subscriber error:', err.message);
        }
      });

      console.log(`[RedisAdapter] Initialized for node ${this.nodeId}`);
    } catch (error) {
      console.error('[RedisAdapter] Init failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channel: string): Promise<void> {
    if (!this.subscriber || this.subscribedChannels.has(channel)) return;

    await this.subscriber.subscribe(channel);
    this.subscribedChannels.add(channel);
    console.log(`[RedisAdapter] Subscribed to channel: ${channel}`);
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel: string): Promise<void> {
    if (!this.subscriber || !this.subscribedChannels.has(channel)) return;

    await this.subscriber.unsubscribe(channel);
    this.subscribedChannels.delete(channel);
    console.log(`[RedisAdapter] Unsubscribed from channel: ${channel}`);
  }

  /**
   * Publish event to channel
   */
  async publish(channel: string, event: SyncEvent): Promise<void> {
    if (!this.publisher) {
      console.warn('[RedisAdapter] Publisher not initialized');
      return;
    }

    try {
      const message = JSON.stringify({
        sourceNode: this.nodeId,
        event
      });

      await this.publisher.publish(channel, message);
    } catch (error) {
      console.error(`[RedisAdapter] Publish to ${channel} failed:`, error);
    }
  }

  /**
   * Set message handler callback
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  /**
   * Handle incoming message from Redis
   */
  private handleMessage(channel: string, messageStr: string): void {
    try {
      const { sourceNode, event } = JSON.parse(messageStr) as { sourceNode: string; event: SyncEvent };

      // Ignore messages from this node (prevent echo)
      if (sourceNode === this.nodeId) {
        return;
      }

      // Call handler
      if (this.messageHandler) {
        this.messageHandler(channel, event);
      }
    } catch (error) {
      console.error('[RedisAdapter] Message parse error:', error);
    }
  }

  /**
   * Publish shard-specific event
   */
  async publishToShard(shardId: string, event: SyncEvent): Promise<void> {
    const channel = `shard:${shardId}`;
    
    // Subscribe to shard channel if not already
    if (!this.subscribedChannels.has(channel)) {
      await this.subscribe(channel);
    }

    await this.publish(channel, event);
  }

  /**
   * Get subscriber count for a channel (for stats)
   */
  async getSubscriberCount(channel: string): Promise<number> {
    if (!this.publisher) return 0;

    try {
      const result = await this.publisher.pubsub('NUMSUB', channel);
      return typeof result[1] === 'number' ? result[1] : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Health check
   */
  async ping(): Promise<boolean> {
    try {
      if (this.publisher) {
        await this.publisher.ping();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    console.log('[RedisAdapter] Shutting down...');

    try {
      if (this.subscriber) {
        // Unsubscribe from all channels
        for (const channel of this.subscribedChannels) {
          await this.subscriber.unsubscribe(channel);
        }
        this.subscriber.disconnect();
      }

      if (this.publisher) {
        this.publisher.disconnect();
      }
    } catch (error) {
      console.error('[RedisAdapter] Shutdown error:', error);
    }

    console.log('[RedisAdapter] Shutdown complete');
  }
}

// Optional: In-memory fallback for development without Redis
export class InMemoryPubSub {
  private channels: Map<string, Set<MessageHandler>> = new Map();
  private nodeId: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }

  async init(): Promise<void> {
    console.log(`[InMemoryPubSub] Initialized for node ${this.nodeId} (single-node mode)`);
  }

  async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(handler);
  }

  async unsubscribe(channel: string, handler: MessageHandler): Promise<void> {
    this.channels.get(channel)?.delete(handler);
  }

  async publish(channel: string, event: SyncEvent): Promise<void> {
    const handlers = this.channels.get(channel);
    if (handlers) {
      for (const handler of handlers) {
        // Async emit to avoid blocking
        setTimeout(() => handler(channel, event), 0);
      }
    }
  }

  async shutdown(): Promise<void> {
    this.channels.clear();
  }
}
