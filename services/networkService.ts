/**
 * Network Service
 * Manages server shards, regions, and network simulation for MMO preparation
 */

export interface Shard {
  id: string;
  name: string;
  region: string;
  flag: string;
  ping: number; // simulated latency in ms
  load: number; // 0-100 server load percentage
  status: 'online' | 'maintenance' | 'offline';
  playerCount: number;
  maxPlayers: number;
}

export interface NetworkStats {
  currentShard: Shard | null;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  packetLoss: number; // percentage
  jitter: number; // ms
  lastPing: number;
}

// Available shards
const SHARDS: Shard[] = [
  {
    id: 'eu-west',
    name: 'EU West',
    region: 'Frankfurt',
    flag: '🇩🇪',
    ping: 25,
    load: 65,
    status: 'online',
    playerCount: 12453,
    maxPlayers: 20000,
  },
  {
    id: 'eu-east',
    name: 'EU East',
    region: 'Warsaw',
    flag: '🇵🇱',
    ping: 35,
    load: 45,
    status: 'online',
    playerCount: 8234,
    maxPlayers: 15000,
  },
  {
    id: 'us-east',
    name: 'US East',
    region: 'New York',
    flag: '🇺🇸',
    ping: 85,
    load: 78,
    status: 'online',
    playerCount: 18932,
    maxPlayers: 25000,
  },
  {
    id: 'us-west',
    name: 'US West',
    region: 'Los Angeles',
    flag: '🇺🇸',
    ping: 120,
    load: 55,
    status: 'online',
    playerCount: 9876,
    maxPlayers: 20000,
  },
  {
    id: 'ua',
    name: 'Ukraine',
    region: 'Kyiv',
    flag: '🇺🇦',
    ping: 15,
    load: 82,
    status: 'online',
    playerCount: 5432,
    maxPlayers: 10000,
  },
  {
    id: 'asia',
    name: 'Asia Pacific',
    region: 'Singapore',
    flag: '🇸🇬',
    ping: 180,
    load: 40,
    status: 'online',
    playerCount: 15678,
    maxPlayers: 30000,
  },
  {
    id: 'ru',
    name: 'Russia',
    region: 'Moscow',
    flag: '🇷🇺',
    ping: 45,
    load: 70,
    status: 'online',
    playerCount: 11234,
    maxPlayers: 15000,
  },
  {
    id: 'br',
    name: 'South America',
    region: 'São Paulo',
    flag: '🇧🇷',
    ping: 150,
    load: 35,
    status: 'online',
    playerCount: 4567,
    maxPlayers: 10000,
  },
];

class NetworkService {
  private currentShard: Shard | null = null;
  private pingHistory: number[] = [];
  private listeners: Set<(stats: NetworkStats) => void> = new Set();
  private updateInterval: number | null = null;

  /**
   * Get all available shards
   */
  getShards(): Shard[] {
    // Add some randomization to simulate live data
    return SHARDS.map(shard => ({
      ...shard,
      ping: shard.ping + Math.floor(Math.random() * 20) - 10,
      load: Math.min(100, Math.max(10, shard.load + Math.floor(Math.random() * 10) - 5)),
      playerCount: shard.playerCount + Math.floor(Math.random() * 500) - 250,
    }));
  }

  /**
   * Get shard by ID
   */
  getShard(id: string): Shard | undefined {
    return SHARDS.find(s => s.id === id);
  }

  /**
   * Connect to a shard
   */
  async connect(shardId: string): Promise<boolean> {
    const shard = this.getShard(shardId);
    if (!shard) {
      console.error('[NetworkService] Shard not found:', shardId);
      return false;
    }

    if (shard.status !== 'online') {
      console.error('[NetworkService] Shard is not online:', shardId);
      return false;
    }

    // Simulate connection delay based on ping
    await this.simulateLatency(shard.ping * 2);

    this.currentShard = shard;
    this.pingHistory = [];
    
    // Start ping simulation
    this.startPingSimulation();

    console.info('[NetworkService] Connected to shard:', shard.name);
    return true;
  }

  /**
   * Disconnect from current shard
   */
  disconnect(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.currentShard = null;
    this.pingHistory = [];
    console.info('[NetworkService] Disconnected');
  }

  /**
   * Get current shard
   */
  getCurrentShard(): Shard | null {
    return this.currentShard;
  }

  /**
   * Get network statistics
   */
  getStats(): NetworkStats {
    const avgPing = this.pingHistory.length > 0 
      ? this.pingHistory.reduce((a, b) => a + b, 0) / this.pingHistory.length 
      : 0;

    let connectionQuality: NetworkStats['connectionQuality'] = 'excellent';
    if (avgPing > 150) connectionQuality = 'poor';
    else if (avgPing > 80) connectionQuality = 'fair';
    else if (avgPing > 40) connectionQuality = 'good';

    return {
      currentShard: this.currentShard,
      connectionQuality,
      packetLoss: Math.random() > 0.95 ? Math.random() * 2 : 0,
      jitter: Math.floor(Math.random() * 15),
      lastPing: this.pingHistory[this.pingHistory.length - 1] || 0,
    };
  }

  /**
   * Subscribe to network updates
   */
  subscribe(callback: (stats: NetworkStats) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Simulate network latency for async operations
   */
  async simulateLatency(baseMs?: number): Promise<void> {
    const ms = baseMs ?? (this.currentShard?.ping ?? 50);
    const jitter = Math.floor(Math.random() * 30) - 15;
    await new Promise(r => setTimeout(r, Math.max(10, ms + jitter)));
  }

  /**
   * Simulate a network request with potential failure
   */
  async simulateRequest<T>(
    operation: () => Promise<T>,
    options?: { timeout?: number; retries?: number }
  ): Promise<T> {
    const timeout = options?.timeout ?? 5000;
    const retries = options?.retries ?? 2;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.simulateLatency();

        // Simulate occasional failures
        if (Math.random() < 0.05) {
          throw new Error('Network timeout');
        }

        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          ),
        ]);

        return result;
      } catch (e) {
        if (attempt === retries) throw e;
        await this.simulateLatency(500); // Wait before retry
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Get recommended shard based on location (simulated)
   */
  getRecommendedShard(): Shard {
    // Sort by ping (lower is better) and load (lower is better)
    const sorted = this.getShards()
      .filter(s => s.status === 'online')
      .sort((a, b) => {
        const scoreA = a.ping + a.load * 0.5;
        const scoreB = b.ping + b.load * 0.5;
        return scoreA - scoreB;
      });
    
    return sorted[0] || SHARDS[0];
  }

  // Private methods

  private startPingSimulation(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = window.setInterval(() => {
      if (!this.currentShard) return;

      const basePing = this.currentShard.ping;
      const variation = Math.floor(Math.random() * 20) - 10;
      const currentPing = Math.max(5, basePing + variation);

      this.pingHistory.push(currentPing);
      if (this.pingHistory.length > 30) {
        this.pingHistory.shift();
      }

      // Notify listeners
      const stats = this.getStats();
      this.listeners.forEach(cb => cb(stats));
    }, 1000);
  }
}

export const networkService = new NetworkService();
