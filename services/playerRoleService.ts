/**
 * Player Role Service
 * LAYER 8: Manages player roles and their bonuses
 */

import { PlayerRole, PlayerRoleInfo, PlayerTier, PlayerTierInfo, CorporationId } from '../types';

// Player Roles Configuration
export const PLAYER_ROLES: PlayerRoleInfo[] = [
  {
    id: 'programmer',
    name: 'Программист',
    icon: '💻',
    color: '#3B82F6', // Blue
    description: 'Мастер кода. Создаёт ПО, сайты и приложения быстрее других.',
    bonuses: [
      { type: 'coding_speed', value: 25, description: '+25% скорость написания кода' },
    ],
    startingPerks: ['syntax_master', 'quick_debug'],
    preferredCorporations: ['titan', 'orbitron'],
  },
  {
    id: 'engineer',
    name: 'Инженер',
    icon: '🔧',
    color: '#F59E0B', // Orange
    description: 'Эксперт по железу. Собирает и оптимизирует ПК лучше всех.',
    bonuses: [
      { type: 'hardware_discount', value: 15, description: '-15% цена на оборудование' },
    ],
    startingPerks: ['hardware_guru', 'efficient_cooling'],
    preferredCorporations: ['cyberforge', 'novatek'],
  },
  {
    id: 'hacker',
    name: 'Хакер',
    icon: '👾',
    color: '#EF4444', // Red
    description: 'Мастер взлома. Проникает в системы и крадёт данные.',
    bonuses: [
      { type: 'hack_power', value: 30, description: '+30% сила взлома' },
    ],
    startingPerks: ['shadow_access', 'trace_cleaner'],
    preferredCorporations: ['blacksun'],
  },
  {
    id: 'security',
    name: 'Безопасник',
    icon: '🛡️',
    color: '#22C55E', // Green
    description: 'Защитник систем. Отражает атаки и расследует инциденты.',
    bonuses: [
      { type: 'defense', value: 40, description: '+40% защита от взлома' },
    ],
    startingPerks: ['firewall_expert', 'intrusion_detection'],
    preferredCorporations: ['titan', 'orbitron'],
  },
  {
    id: 'trader',
    name: 'Торговец',
    icon: '💰',
    color: '#A855F7', // Purple
    description: 'Мастер рынка. Покупает дёшево, продаёт дорого.',
    bonuses: [
      { type: 'trade_bonus', value: 20, description: '+20% прибыль от торговли' },
    ],
    startingPerks: ['market_sense', 'bargain_hunter'],
    preferredCorporations: ['novatek', 'cyberforge'],
  },
];

// Player Tiers Configuration
export const PLAYER_TIERS: PlayerTierInfo[] = [
  {
    id: 'trainee',
    name: 'Стажёр',
    icon: '🌱',
    minReputation: 0,
    benefits: [
      'Доступ к базовым контрактам',
      'Стартовые чертежи T1',
    ],
  },
  {
    id: 'junior',
    name: 'Junior',
    icon: '📗',
    minReputation: 100,
    benefits: [
      'Доступ к контрактам уровня Junior',
      'Чертежи до T2',
      'Вступление в студии',
    ],
  },
  {
    id: 'middle',
    name: 'Middle',
    icon: '📘',
    minReputation: 500,
    benefits: [
      'Контракты Middle уровня',
      'Чертежи до T3',
      'Создание своей студии',
      'Доступ к корпоративным заказам',
    ],
  },
  {
    id: 'senior',
    name: 'Senior',
    icon: '📙',
    minReputation: 2000,
    benefits: [
      'Элитные контракты',
      'Чертежи до T4',
      'Лидерство в гильдиях',
      'Доступ к лабораториям',
    ],
  },
  {
    id: 'architect',
    name: 'Архитектор',
    icon: '👑',
    minReputation: 10000,
    benefits: [
      'Все контракты',
      'Все чертежи (T1-T6)',
      'Создание гильдий',
      'Влияние на корпорации',
      'Доступ к секретным проектам',
    ],
  },
];

class PlayerRoleService {
  /**
   * Get all available roles
   */
  getRoles(): PlayerRoleInfo[] {
    return PLAYER_ROLES;
  }

  /**
   * Get role by ID
   */
  getRole(roleId: PlayerRole): PlayerRoleInfo | undefined {
    return PLAYER_ROLES.find(r => r.id === roleId);
  }

  /**
   * Get all tiers
   */
  getTiers(): PlayerTierInfo[] {
    return PLAYER_TIERS;
  }

  /**
   * Get tier by ID
   */
  getTier(tierId: PlayerTier): PlayerTierInfo | undefined {
    return PLAYER_TIERS.find(t => t.id === tierId);
  }

  /**
   * Calculate player tier based on reputation
   */
  calculateTier(reputation: number): PlayerTier {
    const sortedTiers = [...PLAYER_TIERS].sort((a, b) => b.minReputation - a.minReputation);
    for (const tier of sortedTiers) {
      if (reputation >= tier.minReputation) {
        return tier.id;
      }
    }
    return 'trainee';
  }

  /**
   * Get next tier info
   */
  getNextTier(currentTier: PlayerTier): PlayerTierInfo | null {
    const tierOrder: PlayerTier[] = ['trainee', 'junior', 'middle', 'senior', 'architect'];
    const currentIndex = tierOrder.indexOf(currentTier);
    
    if (currentIndex >= tierOrder.length - 1) {
      return null; // Already at max tier
    }
    
    return this.getTier(tierOrder[currentIndex + 1]) || null;
  }

  /**
   * Calculate progress to next tier
   */
  getTierProgress(reputation: number, currentTier: PlayerTier): {
    current: number;
    required: number;
    percentage: number;
  } {
    const nextTier = this.getNextTier(currentTier);
    const currentTierInfo = this.getTier(currentTier);
    
    if (!nextTier || !currentTierInfo) {
      return { current: reputation, required: reputation, percentage: 100 };
    }

    const current = reputation - currentTierInfo.minReputation;
    const required = nextTier.minReputation - currentTierInfo.minReputation;
    const percentage = Math.min(100, Math.floor((current / required) * 100));

    return { current, required, percentage };
  }

  /**
   * Apply role bonuses to a value
   */
  applyRoleBonus(
    value: number,
    role: PlayerRole | undefined,
    bonusType: PlayerRoleInfo['bonuses'][0]['type']
  ): number {
    if (!role) return value;
    
    const roleInfo = this.getRole(role);
    if (!roleInfo) return value;

    const bonus = roleInfo.bonuses.find(b => b.type === bonusType);
    if (!bonus) return value;

    return value * (1 + bonus.value / 100);
  }

  /**
   * Check if role prefers a corporation
   */
  prefersCorpation(role: PlayerRole, corpId: CorporationId): boolean {
    const roleInfo = this.getRole(role);
    return roleInfo?.preferredCorporations.includes(corpId) ?? false;
  }

  /**
   * Get starting perks for a role
   */
  getStartingPerks(role: PlayerRole): string[] {
    const roleInfo = this.getRole(role);
    return roleInfo?.startingPerks ?? [];
  }
}

export const playerRoleService = new PlayerRoleService();
