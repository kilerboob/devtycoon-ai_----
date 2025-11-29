/**
 * Corporation Service
 * LAYER 5: Manages the 5 major corporations and player reputation
 * LAYER 28: ANG Vers S-Tier Social Corporation
 */

import { Corporation, CorporationId, CorporationReputation, CorporationTier } from '../types';

// Corporation tier influence multipliers
export const TIER_MULTIPLIERS: Record<CorporationTier, number> = {
  'D': 0.5,
  'C': 0.75,
  'B': 1.0,
  'A': 1.5,
  'S': 2.5  // S-Tier = максимальное влияние
};

// The 5 major corporations of CyberNation + ANG Vers (S-Tier)
export const CORPORATIONS: (Corporation & { tier: CorporationTier })[] = [
  // ============================================
  // S-TIER: ANG Vers (LAYER 28)
  // ============================================
  {
    id: 'ang_vers' as CorporationId,
    name: 'ANG Vers',
    logo: '🌐',
    color: '#8B5CF6', // Deep Purple
    description: 'Корпорация-монолит социальной инфраструктуры CyberNation. Владеет цифровыми профилями всех игроков, связями, рейтингами, контрактами и всеми коммуникациями планеты. Единственная мирная корпорация, но и самая опасная.',
    specialty: 'Социальные профили, коммуникации, контракты, репутация, гильдии, студии',
    headquarters: 'Глобальная сеть (везде)',
    ceo: 'Совет Директоров ANG',
    influence: 100,  // Максимальное влияние
    tier: 'S'
  },
  // ============================================
  // A-TIER Corporations
  // ============================================
  {
    id: 'titan',
    name: 'TITAN Industries',
    logo: '⚙️',
    color: '#3B82F6', // Blue
    description: 'Мировой лидер в производстве процессоров и AI-чипов. Контролирует 60% рынка CPU.',
    specialty: 'CPU, AI-чипы, нейропроцессоры',
    headquarters: 'Нью-Йорк, США',
    ceo: 'Александр Стоун',
    influence: 85,
    tier: 'A'
  },
  {
    id: 'orbitron',
    name: 'Orbitron SpaceWorks',
    logo: '🛰️',
    color: '#06B6D4', // Cyan
    description: 'Владеет спутниковой сетью CyberLink. Контролирует глобальный интернет.',
    specialty: 'Спутники, глобальная сеть, инфраструктура',
    headquarters: 'Токио, Япония',
    ceo: 'Ямада Кейджи',
    influence: 78,
    tier: 'A'
  },
  // ============================================
  // B-TIER Corporations
  // ============================================
  {
    id: 'novatek',
    name: 'NovaTek Labs',
    logo: '💾',
    color: '#A855F7', // Purple
    description: 'Пионеры в области хранения данных. Их квантовые SSD — стандарт индустрии.',
    specialty: 'SSD, RAM, системы хранения',
    headquarters: 'Сеул, Южная Корея',
    ceo: 'Ким Сон Хи',
    influence: 72,
    tier: 'B'
  },
  {
    id: 'cyberforge',
    name: 'CyberForge Systems',
    logo: '🔧',
    color: '#F59E0B', // Orange
    description: 'Производитель премиальных корпусов и систем охлаждения для дата-центров.',
    specialty: 'Корпуса, охлаждение, серверные блоки',
    headquarters: 'Берлин, Германия',
    ceo: 'Ганс Мюллер',
    influence: 58,
    tier: 'B'
  },
  // ============================================
  // C-TIER (Shadow)
  // ============================================
  {
    id: 'blacksun',
    name: 'BlackSun Dynamics',
    logo: '☠️',
    color: '#EF4444', // Red
    description: 'Официально — кибербезопасность. Неофициально — крупнейший поставщик кибероружия.',
    specialty: 'Кибероружие, вирусы, эксплойты',
    headquarters: 'Неизвестно (DarkNet)',
    ceo: '???',
    influence: 45,
    isEvil: true,
    tier: 'C'
  },
];

class CorporationService {
  /**
   * Get all corporations
   */
  getCorporations(): Corporation[] {
    return CORPORATIONS;
  }

  /**
   * Get corporation by ID
   */
  getCorporation(id: CorporationId): Corporation | undefined {
    return CORPORATIONS.find(c => c.id === id);
  }

  /**
   * Initialize reputation for a new player
   */
  initializeReputations(): CorporationReputation[] {
    return CORPORATIONS.map(corp => ({
      corporationId: corp.id,
      reputation: 0,
      rank: 'нейтрал',
      totalContracts: 0,
      lastInteraction: Date.now(),
    }));
  }

  /**
   * Calculate rank based on reputation
   */
  calculateRank(reputation: number): CorporationReputation['rank'] {
    if (reputation <= -50) return 'враг';
    if (reputation < 10) return 'нейтрал';
    if (reputation < 30) return 'знакомый';
    if (reputation < 60) return 'партнёр';
    if (reputation < 90) return 'союзник';
    return 'элита';
  }

  /**
   * Update reputation with a corporation
   */
  updateReputation(
    reps: CorporationReputation[],
    corporationId: CorporationId,
    delta: number
  ): CorporationReputation[] {
    return reps.map(rep => {
      if (rep.corporationId !== corporationId) return rep;
      
      const newRep = Math.max(-100, Math.min(100, rep.reputation + delta));
      return {
        ...rep,
        reputation: newRep,
        rank: this.calculateRank(newRep),
        lastInteraction: Date.now(),
      };
    });
  }

  /**
   * Complete a contract and update reputation
   */
  completeContract(
    reps: CorporationReputation[],
    corporationId: CorporationId,
    success: boolean
  ): CorporationReputation[] {
    const delta = success ? 5 : -3;
    return reps.map(rep => {
      if (rep.corporationId !== corporationId) return rep;
      
      const newRep = Math.max(-100, Math.min(100, rep.reputation + delta));
      return {
        ...rep,
        reputation: newRep,
        rank: this.calculateRank(newRep),
        totalContracts: rep.totalContracts + 1,
        lastInteraction: Date.now(),
      };
    });
  }

  /**
   * Get player's standing with a corporation
   */
  getStanding(reps: CorporationReputation[], corporationId: CorporationId): CorporationReputation | undefined {
    return reps.find(r => r.corporationId === corporationId);
  }

  /**
   * Get corporations sorted by player reputation
   */
  getSortedByReputation(reps: CorporationReputation[]): (Corporation & { rep: CorporationReputation })[] {
    return [...reps]
      .sort((a, b) => b.reputation - a.reputation)
      .map(rep => ({
        ...this.getCorporation(rep.corporationId)!,
        rep,
      }));
  }

  /**
   * Check if player can access corporation's exclusive content
   */
  canAccessExclusive(reps: CorporationReputation[], corporationId: CorporationId, requiredRank: CorporationReputation['rank']): boolean {
    const standing = this.getStanding(reps, corporationId);
    if (!standing) return false;

    const rankOrder: CorporationReputation['rank'][] = ['враг', 'нейтрал', 'знакомый', 'партнёр', 'союзник', 'элита'];
    return rankOrder.indexOf(standing.rank) >= rankOrder.indexOf(requiredRank);
  }
}

export const corporationService = new CorporationService();
