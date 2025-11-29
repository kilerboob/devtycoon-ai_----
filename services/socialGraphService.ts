/**
 * ============================================
 * Social Graph Service
 * ============================================
 * 
 * Управление социальным графом CyberNation через ANG Vers:
 * - Связи между игроками (друзья, враги, коллеги)
 * - Гильдии и их иерархии
 * - Студии и партнёрства
 * - Блокировки и ограничения
 * - Рекомендации на основе связей
 */

import { 
  SocialProfile, 
  SocialConnection, 
  SocialConnectionType,
  Guild,
  Studio
} from '../types';

// ============================================
// Connection Weights (влияние на социальный граф)
// ============================================
export const CONNECTION_WEIGHTS: Record<SocialConnectionType, number> = {
  friend: 10,
  colleague: 5,
  guild_member: 8,
  studio_partner: 7,
  contractor: 3,
  employer: 4,
  rival: -3,
  enemy: -10,
  blocked: -20
};

// ============================================
// Типы событий социального графа
// ============================================
export type SocialGraphEvent = 
  | { type: 'connection_created'; fromId: string; toId: string; connectionType: SocialConnectionType }
  | { type: 'connection_removed'; connectionId: string }
  | { type: 'guild_joined'; profileId: string; guildId: string }
  | { type: 'guild_left'; profileId: string; guildId: string }
  | { type: 'studio_joined'; profileId: string; studioId: string }
  | { type: 'profile_blocked'; blockerId: string; blockedId: string }
  | { type: 'friendship_request'; fromId: string; toId: string };

// ============================================
// Генерация NPC профилей
// ============================================
const NPC_NAMES = [
  'Alex_Dev', 'CyberNinja', 'CodeMaster', 'HackerX', 'SecureBot',
  'PixelArtist', 'DataMiner', 'CloudRunner', 'NetWalker', 'ByteCrusher',
  'ShadowCoder', 'NeonHacker', 'CryptoKing', 'AIWhisper', 'QuantumDev',
  'RustMaster', 'GoGuru', 'PyWizard', 'JSNinja', 'CppLord',
  'Darknet_Pro', 'WhiteHat_01', 'ZeroDay', 'Exploit_X', 'Firewall_Kid'
];

const NPC_AVATARS = ['👨‍💻', '👩‍💻', '🤖', '👾', '🎮', '💀', '🦊', '🐱', '🦁', '🐺'];

// ============================================
// Social Graph Service
// ============================================
class SocialGraphService {
  
  // ==========================================
  // Connection Analysis
  // ==========================================
  
  /**
   * Получить все связи профиля
   */
  getProfileConnections(profileId: string, connections: SocialConnection[]): SocialConnection[] {
    return connections.filter(c => 
      c.fromProfileId === profileId || c.toProfileId === profileId
    );
  }
  
  /**
   * Получить друзей профиля
   */
  getFriends(profileId: string, connections: SocialConnection[]): string[] {
    return connections
      .filter(c => c.type === 'friend' && (c.fromProfileId === profileId || c.toProfileId === profileId))
      .map(c => c.fromProfileId === profileId ? c.toProfileId : c.fromProfileId);
  }
  
  /**
   * Получить врагов профиля
   */
  getEnemies(profileId: string, connections: SocialConnection[]): string[] {
    return connections
      .filter(c => (c.type === 'enemy' || c.type === 'rival') && 
        (c.fromProfileId === profileId || c.toProfileId === profileId))
      .map(c => c.fromProfileId === profileId ? c.toProfileId : c.fromProfileId);
  }
  
  /**
   * Проверить, заблокирован ли пользователь
   */
  isBlocked(blockerId: string, blockedId: string, connections: SocialConnection[]): boolean {
    return connections.some(c => 
      c.type === 'blocked' && 
      c.fromProfileId === blockerId && 
      c.toProfileId === blockedId
    );
  }
  
  /**
   * Найти общих друзей
   */
  getMutualFriends(profileId1: string, profileId2: string, connections: SocialConnection[]): string[] {
    const friends1 = this.getFriends(profileId1, connections);
    const friends2 = this.getFriends(profileId2, connections);
    return friends1.filter(f => friends2.includes(f));
  }
  
  /**
   * Рассчитать социальное расстояние между профилями
   * (количество "прыжков" через друзей)
   */
  calculateSocialDistance(
    fromId: string, 
    toId: string, 
    connections: SocialConnection[],
    maxDepth: number = 6
  ): number {
    if (fromId === toId) return 0;
    
    const visited = new Set<string>();
    let queue: { id: string; depth: number }[] = [{ id: fromId, depth: 0 }];
    
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      
      if (depth >= maxDepth) continue;
      if (visited.has(id)) continue;
      visited.add(id);
      
      const friends = this.getFriends(id, connections);
      
      for (const friendId of friends) {
        if (friendId === toId) return depth + 1;
        if (!visited.has(friendId)) {
          queue.push({ id: friendId, depth: depth + 1 });
        }
      }
    }
    
    return -1; // Не связаны
  }
  
  // ==========================================
  // Network Metrics
  // ==========================================
  
  /**
   * Рассчитать "центральность" профиля в сети
   */
  calculateCentrality(profileId: string, connections: SocialConnection[]): number {
    const profileConns = this.getProfileConnections(profileId, connections);
    let score = 0;
    
    for (const conn of profileConns) {
      const weight = CONNECTION_WEIGHTS[conn.type] || 0;
      const strengthMult = conn.strength / 100;
      score += weight * strengthMult;
    }
    
    return Math.max(0, score);
  }
  
  /**
   * Получить "влиятельность" профиля
   * (количество входящих связей высокой силы)
   */
  getInfluenceScore(profileId: string, connections: SocialConnection[]): number {
    const incoming = connections.filter(c => 
      c.toProfileId === profileId && 
      c.strength > 50 &&
      (c.type === 'friend' || c.type === 'colleague' || c.type === 'guild_member')
    );
    
    return incoming.reduce((sum, c) => sum + c.strength, 0);
  }
  
  // ==========================================
  // Guild Graph
  // ==========================================
  
  /**
   * Получить всех членов гильдии
   */
  getGuildMembers(guildId: string, profiles: SocialProfile[]): SocialProfile[] {
    return profiles.filter(p => p.guildId === guildId);
  }
  
  /**
   * Получить гильдии-союзники (много взаимных связей)
   */
  getAlliedGuilds(
    guildId: string, 
    guilds: Guild[], 
    connections: SocialConnection[],
    profiles: SocialProfile[]
  ): Guild[] {
    const myMembers = this.getGuildMembers(guildId, profiles).map(p => p.id);
    const allyScores: Record<string, number> = {};
    
    for (const conn of connections) {
      if (conn.type !== 'friend' && conn.type !== 'guild_member') continue;
      
      const isFromMy = myMembers.includes(conn.fromProfileId);
      const isToMy = myMembers.includes(conn.toProfileId);
      
      if (isFromMy && !isToMy) {
        const otherProfile = profiles.find(p => p.id === conn.toProfileId);
        if (otherProfile?.guildId && otherProfile.guildId !== guildId) {
          allyScores[otherProfile.guildId] = (allyScores[otherProfile.guildId] || 0) + conn.strength;
        }
      }
      
      if (isToMy && !isFromMy) {
        const otherProfile = profiles.find(p => p.id === conn.fromProfileId);
        if (otherProfile?.guildId && otherProfile.guildId !== guildId) {
          allyScores[otherProfile.guildId] = (allyScores[otherProfile.guildId] || 0) + conn.strength;
        }
      }
    }
    
    // Отфильтровать гильдии с высоким "союзническим" счётом
    const allyGuildIds = Object.entries(allyScores)
      .filter(([_, score]) => score > 100)
      .map(([id]) => id);
    
    return guilds.filter(g => allyGuildIds.includes(g.id));
  }
  
  /**
   * Получить гильдии-соперники
   */
  getRivalGuilds(
    guildId: string,
    guilds: Guild[],
    connections: SocialConnection[],
    profiles: SocialProfile[]
  ): Guild[] {
    const myMembers = this.getGuildMembers(guildId, profiles).map(p => p.id);
    const rivalScores: Record<string, number> = {};
    
    for (const conn of connections) {
      if (conn.type !== 'rival' && conn.type !== 'enemy') continue;
      
      const isFromMy = myMembers.includes(conn.fromProfileId);
      const isToMy = myMembers.includes(conn.toProfileId);
      
      if (isFromMy || isToMy) {
        const otherId = isFromMy ? conn.toProfileId : conn.fromProfileId;
        const otherProfile = profiles.find(p => p.id === otherId);
        
        if (otherProfile?.guildId && otherProfile.guildId !== guildId) {
          const weight = Math.abs(CONNECTION_WEIGHTS[conn.type]);
          rivalScores[otherProfile.guildId] = (rivalScores[otherProfile.guildId] || 0) + weight;
        }
      }
    }
    
    const rivalGuildIds = Object.entries(rivalScores)
      .filter(([_, score]) => score > 20)
      .map(([id]) => id);
    
    return guilds.filter(g => rivalGuildIds.includes(g.id));
  }
  
  // ==========================================
  // NPC Generation
  // ==========================================
  
  /**
   * Генерировать NPC профиль
   */
  generateNPCProfile(forceType?: 'friendly' | 'hostile' | 'neutral'): SocialProfile {
    const name = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
    const avatar = NPC_AVATARS[Math.floor(Math.random() * NPC_AVATARS.length)];
    
    // Случайный рейтинг в зависимости от типа
    let rating: number;
    let trustScore: number;
    
    switch (forceType) {
      case 'friendly':
        rating = 400 + Math.floor(Math.random() * 400);
        trustScore = 60 + Math.floor(Math.random() * 40);
        break;
      case 'hostile':
        rating = Math.floor(Math.random() * 200);
        trustScore = Math.floor(Math.random() * 30);
        break;
      default:
        rating = 200 + Math.floor(Math.random() * 300);
        trustScore = 40 + Math.floor(Math.random() * 30);
    }
    
    return {
      id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: name,
      displayName: name,
      avatar,
      status: 'active',
      socialRating: rating,
      trustScore,
      employerRating: 3 + Math.random() * 2,
      freelancerRating: 3 + Math.random() * 2,
      totalConnections: Math.floor(Math.random() * 50),
      contractsCompleted: Math.floor(Math.random() * 20),
      contractsFailed: Math.floor(Math.random() * 3),
      complaintsReceived: Math.floor(Math.random() * 5),
      complaintsResolved: Math.floor(Math.random() * 3),
      corporationAffiliations: [],
      verificationLevel: Math.floor(Math.random() * 3) as 0 | 1 | 2,
      securityIncidents: Math.floor(Math.random() * 3),
      lastSecurityScan: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      createdAt: Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000),
      lastActiveAt: Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)
    };
  }
  
  /**
   * Генерировать NPC гильдию
   */
  generateNPCGuild(): Guild {
    const types: Guild['type'][] = ['hacker', 'security', 'trader', 'developer', 'engineer', 'mixed'];
    const prefixes = ['Dark', 'Cyber', 'Neo', 'Shadow', 'Alpha', 'Omega', 'Elite', 'Core'];
    const suffixes = ['Legion', 'Force', 'Squad', 'Crew', 'Team', 'Clan', 'Order', 'Alliance'];
    
    const name = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    const tag = name.split(' ').map(w => w[0]).join('').toUpperCase();
    const type = types[Math.floor(Math.random() * types.length)];
    const logos = ['⚔️', '🛡️', '💀', '🔥', '⚡', '🌟', '🎯', '🦾'];
    
    return {
      id: `npc_guild_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      tag,
      logo: logos[Math.floor(Math.random() * logos.length)],
      type,
      leaderId: `npc_leader_${Math.random().toString(36).substr(2, 9)}`,
      memberIds: [],
      maxMembers: 10 + Math.floor(Math.random() * 40),
      reputation: Math.floor(Math.random() * 500),
      totalContracts: Math.floor(Math.random() * 100),
      successRate: 0.7 + Math.random() * 0.25,
      treasury: Math.floor(Math.random() * 50000),
      weeklyIncome: Math.floor(Math.random() * 5000),
      license: 'standard',
      licenseExpiry: Date.now() + 30 * 24 * 60 * 60 * 1000,
      createdAt: Date.now() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)
    };
  }
  
  // ==========================================
  // Recommendations
  // ==========================================
  
  /**
   * Рекомендовать друзей на основе взаимных связей
   */
  recommendFriends(
    profileId: string, 
    connections: SocialConnection[], 
    allProfiles: SocialProfile[],
    limit: number = 5
  ): SocialProfile[] {
    const myFriends = this.getFriends(profileId, connections);
    const recommendations: Record<string, number> = {};
    
    // Друзья друзей
    for (const friendId of myFriends) {
      const friendsOfFriend = this.getFriends(friendId, connections);
      for (const fofId of friendsOfFriend) {
        if (fofId !== profileId && !myFriends.includes(fofId)) {
          recommendations[fofId] = (recommendations[fofId] || 0) + 1;
        }
      }
    }
    
    // Сортировать по количеству общих друзей
    const sorted = Object.entries(recommendations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
    
    return allProfiles.filter(p => sorted.includes(p.id));
  }
  
  /**
   * Рекомендовать гильдии
   */
  recommendGuilds(
    profileId: string,
    profile: SocialProfile,
    guilds: Guild[],
    connections: SocialConnection[],
    allProfiles: SocialProfile[]
  ): Guild[] {
    const myFriends = this.getFriends(profileId, connections);
    const guildScores: Record<string, number> = {};
    
    // Гильдии, где есть друзья
    for (const friendId of myFriends) {
      const friendProfile = allProfiles.find(p => p.id === friendId);
      if (friendProfile?.guildId && friendProfile.guildId !== profile.guildId) {
        guildScores[friendProfile.guildId] = (guildScores[friendProfile.guildId] || 0) + 10;
      }
    }
    
    // Бонус за репутацию гильдии
    for (const guild of guilds) {
      if (guild.id !== profile.guildId) {
        guildScores[guild.id] = (guildScores[guild.id] || 0) + guild.reputation * 0.01;
      }
    }
    
    const sorted = Object.entries(guildScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);
    
    return guilds.filter(g => sorted.includes(g.id));
  }
}

export const socialGraphService = new SocialGraphService();
