/**
 * ============================================
 * LAYER 28: ANG Vers Social Corporation
 * ============================================
 * 
 * ANG Vers — S-Tier корпорация, управляющая всей социальной 
 * инфраструктурой CyberNation:
 * 
 * - Цифровые профили всех игроков
 * - Социальные связи (друзья, враги, коллеги)
 * - Гильдии и студии
 * - Рейтинги и репутация
 * - Контракты и найм
 * - Социальные рынки
 * - Уведомления и коммуникации
 * - Социальная безопасность
 * 
 * Это ЕДИНСТВЕННАЯ мирная корпорация, но и самая опасная —
 * она владеет людьми, информацией и связями.
 */

import { 
  SocialProfile, 
  SocialConnection, 
  SocialConnectionType,
  SocialStatus,
  Guild, 
  Studio,
  SocialContract,
  SocialComplaint,
  SystemNotification,
  MarketListing,
  ThreatLog,
  ANGVersState,
  CorporationTier
} from '../types';

// ============================================
// ANG Vers Corporation Data
// ============================================
export const ANG_VERS_CORP = {
  id: 'ang_vers',
  name: 'ANG Vers',
  fullName: 'ANG Vers Social Infrastructure Corporation',
  logo: '🌐',
  tier: 'S' as CorporationTier,
  color: '#8B5CF6', // Purple - власть и тайна
  
  motto: 'Connecting the Digital World',
  description: 'Корпорация-монолит социальной инфраструктуры CyberNation. Владеет цифровыми профилями, связями, рейтингами, контрактами и всеми коммуникациями планеты.',
  
  // Сферы влияния
  domains: [
    'Social Profiles',
    'Communication Networks', 
    'Contract Markets',
    'Guild & Studio Licensing',
    'Reputation Systems',
    'Social Security'
  ],
  
  // Контролируемые системы
  controlledSystems: [
    'Messenger (Signal 2.0)',
    'DeVCall (Voice/Video)',
    'Social Markets',
    'Guild Registry',
    'Studio Licensing',
    'Threat Detection',
    'Arbitration Courts'
  ],
  
  // Базовые тарифы
  fees: {
    guildLicenseBasic: 500,
    guildLicenseStandard: 2000,
    guildLicensePremium: 10000,
    guildLicenseElite: 50000,
    studioLicenseIndie: 1000,
    studioLicensePro: 5000,
    studioLicenseEnterprise: 25000,
    contractEscrowFee: 0.05, // 5%
    marketListingFee: 50,
    featuredListingFee: 500,
    verificationLevel1: 100,
    verificationLevel2: 500,
    verificationLevel3: 2000,
  }
};

// ============================================
// Social Rating Thresholds
// ============================================
export const SOCIAL_RATING_THRESHOLDS = {
  pariah: 0,      // Изгой
  untrusted: 100, // Ненадёжный
  newcomer: 200,  // Новичок
  member: 350,    // Участник
  trusted: 500,   // Доверенный
  respected: 650, // Уважаемый
  influential: 800, // Влиятельный
  elite: 950      // Элита
};

export const TRUST_SCORE_EFFECTS = {
  0: { contractAccess: false, guildAccess: false, marketAccess: false },
  25: { contractAccess: true, guildAccess: false, marketAccess: false },
  50: { contractAccess: true, guildAccess: true, marketAccess: true },
  75: { contractAccess: true, guildAccess: true, marketAccess: true, premiumAccess: true },
  100: { contractAccess: true, guildAccess: true, marketAccess: true, premiumAccess: true, eliteAccess: true }
};

// ============================================
// ANG Vers Service
// ============================================
class ANGVersService {
  
  // ==========================================
  // Profile Management
  // ==========================================
  
  /**
   * Создать новый социальный профиль
   */
  createProfile(username: string, displayName?: string): SocialProfile {
    return {
      id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username,
      displayName: displayName || username,
      avatar: '👤',
      status: 'active',
      
      socialRating: 200, // Начальный рейтинг новичка
      trustScore: 50,
      employerRating: 0,
      freelancerRating: 0,
      
      totalConnections: 0,
      contractsCompleted: 0,
      contractsFailed: 0,
      complaintsReceived: 0,
      complaintsResolved: 0,
      
      corporationAffiliations: [],
      verificationLevel: 0,
      securityIncidents: 0,
      lastSecurityScan: Date.now(),
      
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    };
  }
  
  /**
   * Обновить социальный рейтинг
   */
  updateSocialRating(profile: SocialProfile, delta: number): SocialProfile {
    const newRating = Math.max(0, Math.min(1000, profile.socialRating + delta));
    return { ...profile, socialRating: newRating };
  }
  
  /**
   * Получить статус по рейтингу
   */
  getRatingStatus(rating: number): string {
    if (rating >= SOCIAL_RATING_THRESHOLDS.elite) return 'Элита';
    if (rating >= SOCIAL_RATING_THRESHOLDS.influential) return 'Влиятельный';
    if (rating >= SOCIAL_RATING_THRESHOLDS.respected) return 'Уважаемый';
    if (rating >= SOCIAL_RATING_THRESHOLDS.trusted) return 'Доверенный';
    if (rating >= SOCIAL_RATING_THRESHOLDS.member) return 'Участник';
    if (rating >= SOCIAL_RATING_THRESHOLDS.newcomer) return 'Новичок';
    if (rating >= SOCIAL_RATING_THRESHOLDS.untrusted) return 'Ненадёжный';
    return 'Изгой';
  }
  
  /**
   * Верифицировать профиль
   */
  verifyProfile(profile: SocialProfile, level: 1 | 2 | 3, money: number): { profile: SocialProfile; cost: number; success: boolean } {
    const costs = {
      1: ANG_VERS_CORP.fees.verificationLevel1,
      2: ANG_VERS_CORP.fees.verificationLevel2,
      3: ANG_VERS_CORP.fees.verificationLevel3
    };
    
    const cost = costs[level];
    if (money < cost) {
      return { profile, cost, success: false };
    }
    
    // Верификация повышает доверие
    const trustBonus = level * 10;
    const ratingBonus = level * 25;
    
    return {
      profile: {
        ...profile,
        verificationLevel: level,
        trustScore: Math.min(100, profile.trustScore + trustBonus),
        socialRating: Math.min(1000, profile.socialRating + ratingBonus)
      },
      cost,
      success: true
    };
  }
  
  // ==========================================
  // Connection Management
  // ==========================================
  
  /**
   * Создать социальную связь
   */
  createConnection(fromId: string, toId: string, type: SocialConnectionType): SocialConnection {
    return {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromProfileId: fromId,
      toProfileId: toId,
      type,
      strength: type === 'friend' ? 50 : type === 'colleague' ? 30 : 10,
      createdAt: Date.now(),
      lastInteraction: Date.now(),
      mutualGuilds: [],
      mutualFriends: 0,
      sharedContracts: 0
    };
  }
  
  /**
   * Усилить связь (взаимодействие)
   */
  strengthenConnection(connection: SocialConnection, amount: number = 5): SocialConnection {
    return {
      ...connection,
      strength: Math.min(100, connection.strength + amount),
      lastInteraction: Date.now()
    };
  }
  
  /**
   * Ослабить связь (неактивность)
   */
  weakenConnection(connection: SocialConnection, daysPassed: number): SocialConnection {
    const decay = daysPassed * 0.5;
    return {
      ...connection,
      strength: Math.max(0, connection.strength - decay)
    };
  }
  
  // ==========================================
  // Guild Management
  // ==========================================
  
  /**
   * Создать гильдию
   */
  createGuild(
    name: string, 
    tag: string, 
    leaderId: string, 
    type: Guild['type'],
    license: Guild['license'] = 'basic'
  ): { guild: Guild; cost: number } {
    const licenseCosts: Record<Guild['license'], number> = {
      basic: ANG_VERS_CORP.fees.guildLicenseBasic,
      standard: ANG_VERS_CORP.fees.guildLicenseStandard,
      premium: ANG_VERS_CORP.fees.guildLicensePremium,
      elite: ANG_VERS_CORP.fees.guildLicenseElite
    };
    
    const maxMembers: Record<Guild['license'], number> = {
      basic: 10,
      standard: 25,
      premium: 50,
      elite: 100
    };
    
    const guild: Guild = {
      id: `guild_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      tag,
      logo: '⚔️',
      type,
      leaderId,
      memberIds: [leaderId],
      maxMembers: maxMembers[license],
      reputation: 0,
      totalContracts: 0,
      successRate: 0,
      treasury: 0,
      weeklyIncome: 0,
      license,
      licenseExpiry: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 дней
      createdAt: Date.now()
    };
    
    return { guild, cost: licenseCosts[license] };
  }
  
  /**
   * Обновить лицензию гильдии
   */
  renewGuildLicense(guild: Guild, days: number = 30): { guild: Guild; cost: number } {
    const dailyCost = ANG_VERS_CORP.fees.guildLicenseBasic / 30;
    const licenseMult: Record<Guild['license'], number> = {
      basic: 1,
      standard: 4,
      premium: 20,
      elite: 100
    };
    
    const cost = Math.floor(dailyCost * days * licenseMult[guild.license]);
    
    return {
      guild: {
        ...guild,
        licenseExpiry: guild.licenseExpiry + days * 24 * 60 * 60 * 1000
      },
      cost
    };
  }
  
  // ==========================================
  // Studio Management  
  // ==========================================
  
  /**
   * Создать студию
   */
  createStudio(
    name: string,
    ownerId: string,
    specialization: Studio['specialization'],
    license: Studio['license'] = 'indie'
  ): { studio: Studio; cost: number } {
    const licenseCosts: Record<Studio['license'], number> = {
      indie: ANG_VERS_CORP.fees.studioLicenseIndie,
      pro: ANG_VERS_CORP.fees.studioLicensePro,
      enterprise: ANG_VERS_CORP.fees.studioLicenseEnterprise
    };
    
    const studio: Studio = {
      id: `studio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      logo: '🏢',
      ownerId,
      memberIds: [ownerId],
      specialization,
      clientRating: 0,
      projectsCompleted: 0,
      projectsInProgress: 0,
      revenue: 0,
      expenses: 0,
      license,
      verified: license === 'enterprise',
      createdAt: Date.now()
    };
    
    return { studio, cost: licenseCosts[license] };
  }
  
  // ==========================================
  // Contract System
  // ==========================================
  
  /**
   * Создать контракт
   */
  createContract(
    clientId: string,
    title: string,
    description: string,
    payment: number,
    type: SocialContract['type'] = 'freelance',
    deadlineDays: number = 7
  ): SocialContract {
    return {
      id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      clientId,
      title,
      description,
      requirements: [],
      payment,
      paymentType: 'fixed',
      escrowHeld: 0,
      status: 'open',
      deadline: Date.now() + deadlineDays * 24 * 60 * 60 * 1000,
      createdAt: Date.now()
    };
  }
  
  /**
   * Принять контракт
   */
  acceptContract(contract: SocialContract, contractorId: string, clientMoney: number): { 
    contract: SocialContract; 
    escrowFee: number;
    success: boolean;
  } {
    const escrowAmount = contract.payment;
    const fee = Math.floor(escrowAmount * ANG_VERS_CORP.fees.contractEscrowFee);
    const totalRequired = escrowAmount + fee;
    
    if (clientMoney < totalRequired) {
      return { contract, escrowFee: fee, success: false };
    }
    
    return {
      contract: {
        ...contract,
        contractorId,
        status: 'in_progress',
        escrowHeld: escrowAmount
      },
      escrowFee: fee,
      success: true
    };
  }
  
  /**
   * Завершить контракт
   */
  completeContract(
    contract: SocialContract, 
    clientRating: number,
    contractorRating: number
  ): { contract: SocialContract; payout: number } {
    return {
      contract: {
        ...contract,
        status: 'completed',
        completedAt: Date.now(),
        clientRating,
        contractorRating
      },
      payout: contract.escrowHeld
    };
  }
  
  // ==========================================
  // Complaint System
  // ==========================================
  
  /**
   * Подать жалобу
   */
  fileComplaint(
    complainantId: string,
    defendantId: string,
    type: SocialComplaint['type'],
    description: string
  ): SocialComplaint {
    return {
      id: `complaint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      complainantId,
      defendantId,
      type,
      description,
      evidence: [],
      status: 'pending',
      createdAt: Date.now()
    };
  }
  
  /**
   * Разрешить жалобу
   */
  resolveComplaint(
    complaint: SocialComplaint,
    resolution: string,
    penalty?: SocialComplaint['penalty']
  ): SocialComplaint {
    return {
      ...complaint,
      status: 'resolved',
      resolution,
      penalty,
      resolvedAt: Date.now()
    };
  }
  
  // ==========================================
  // Notification System
  // ==========================================
  
  /**
   * Отправить уведомление
   */
  sendNotification(
    recipientId: string,
    type: SystemNotification['type'],
    title: string,
    message: string,
    source: SystemNotification['source'] = 'ang_vers',
    priority: SystemNotification['priority'] = 'normal'
  ): SystemNotification {
    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipientId,
      type,
      priority,
      title,
      message,
      source,
      isRead: false,
      createdAt: Date.now()
    };
  }
  
  /**
   * Отправить системное предупреждение
   */
  sendWarning(recipientId: string, reason: string): SystemNotification {
    return this.sendNotification(
      recipientId,
      'warning',
      '⚠️ Предупреждение ANG Vers',
      reason,
      'ang_vers',
      'high'
    );
  }
  
  /**
   * Отправить угрозу от NPC
   */
  sendThreat(recipientId: string, npcName: string, message: string): SystemNotification {
    return this.sendNotification(
      recipientId,
      'threat',
      `🔴 Угроза от ${npcName}`,
      message,
      'npc',
      'critical'
    );
  }
  
  // ==========================================
  // Threat Logging
  // ==========================================
  
  /**
   * Зарегистрировать угрозу
   */
  logThreat(
    targetId: string,
    sourceNpcId: string,
    type: ThreatLog['type'],
    message: string,
    severity: ThreatLog['severity'] = 'medium'
  ): ThreatLog {
    return {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      targetId,
      sourceNpcId,
      type,
      severity,
      message,
      status: 'active',
      reportedToSecurity: false,
      createdAt: Date.now()
    };
  }
  
  /**
   * Сообщить об угрозе в службу безопасности
   */
  reportThreatToSecurity(threat: ThreatLog): ThreatLog {
    return {
      ...threat,
      reportedToSecurity: true,
      status: 'escalated'
    };
  }
  
  // ==========================================
  // Market Listings
  // ==========================================
  
  /**
   * Создать листинг на рынке
   */
  createListing(
    sellerId: string,
    title: string,
    description: string,
    price: number,
    type: MarketListing['type'] = 'service',
    category: MarketListing['category'] = 'development'
  ): { listing: MarketListing; fee: number } {
    const fee = ANG_VERS_CORP.fees.marketListingFee;
    
    return {
      listing: {
        id: `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sellerId,
        type,
        category,
        title,
        description,
        price,
        priceType: 'fixed',
        currency: 'usd',
        views: 0,
        purchases: 0,
        rating: 0,
        isActive: true,
        isFeatured: false,
        createdAt: Date.now()
      },
      fee
    };
  }
  
  /**
   * Продвинуть листинг (Featured)
   */
  featureListing(listing: MarketListing): { listing: MarketListing; cost: number } {
    return {
      listing: { ...listing, isFeatured: true },
      cost: ANG_VERS_CORP.fees.featuredListingFee
    };
  }
  
  // ==========================================
  // Social Influence
  // ==========================================
  
  /**
   * Рассчитать социальное влияние
   */
  calculateInfluence(profile: SocialProfile, connections: SocialConnection[], guild?: Guild, studio?: Studio): number {
    let influence = 0;
    
    // Базовое влияние от рейтинга
    influence += profile.socialRating * 0.3;
    
    // Влияние от связей
    const strongConnections = connections.filter(c => c.strength > 70).length;
    influence += strongConnections * 10;
    
    // Влияние от контрактов
    influence += profile.contractsCompleted * 5;
    
    // Влияние от верификации
    influence += profile.verificationLevel * 50;
    
    // Влияние от гильдии
    if (guild) {
      influence += guild.reputation * 0.2;
      if (guild.leaderId === profile.id) influence += 100;
    }
    
    // Влияние от студии
    if (studio) {
      influence += studio.projectsCompleted * 10;
      if (studio.ownerId === profile.id) influence += 150;
    }
    
    return Math.min(1000, Math.floor(influence));
  }
  
  /**
   * Получить статус отношений с ANG Vers
   */
  getANGVersStanding(influence: number, complaints: number, securityIncidents: number): ANGVersState['angVersStanding'] {
    const penalty = complaints * 50 + securityIncidents * 100;
    const effectiveInfluence = influence - penalty;
    
    if (effectiveInfluence < 0) return 'hostile';
    if (effectiveInfluence < 200) return 'neutral';
    if (effectiveInfluence < 500) return 'friendly';
    if (effectiveInfluence < 800) return 'partner';
    return 'elite';
  }
  
  // ==========================================
  // Initial State
  // ==========================================
  
  /**
   * Создать начальное состояние ANG Vers для игрока
   */
  createInitialState(username: string): ANGVersState {
    const profile = this.createProfile(username);
    
    return {
      profile,
      connections: [],
      pendingRequests: [],
      activeContracts: [],
      contractHistory: [],
      pendingComplaints: [],
      notifications: [
        this.sendNotification(
          profile.id,
          'info',
          '🌐 Добро пожаловать в ANG Vers',
          'Ваш социальный профиль создан. Теперь вы можете участвовать в социальной экономике CyberNation.',
          'ang_vers',
          'normal'
        )
      ],
      unreadCount: 1,
      activeThreats: [],
      myListings: [],
      socialInfluence: 0,
      angVersStanding: 'neutral'
    };
  }
}

export const angVersService = new ANGVersService();
