/**
 * Corporation Service Extended
 * LAYER 5: Full Corporation Social System
 * - Membership management
 * - Quest system
 * - Labs & AI Cores
 * - Corp Wars
 */

import {
  Corporation,
  CorporationId,
  CorporationReputation,
  CorporationTier,
  CorporationFull,
  CorpMembership,
  CorpMemberRank,
  CorpPrivilege,
  CorpQuest,
  CorpQuestType,
  CorpQuestReward,
  CorpLab,
  LabType,
  LabTier,
  AICore,
  ResearchProject,
  CorpWar,
  WarEvent,
  CorpAlliance,
  Blueprint,
  SkillLevel,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// RANK CONFIGURATION
// ============================================
export const RANK_CONFIG: Record<CorpMemberRank, {
  name: string;
  xpRequired: number;
  privileges: CorpPrivilege[];
  monthlyDues: number;
  color: string;
  icon: string;
}> = {
  'recruit': {
    name: 'Рекрут',
    xpRequired: 0,
    privileges: ['access_contracts'],
    monthlyDues: 100,
    color: '#6B7280',
    icon: '🔰'
  },
  'member': {
    name: 'Сотрудник',
    xpRequired: 500,
    privileges: ['access_contracts', 'access_labs'],
    monthlyDues: 250,
    color: '#22C55E',
    icon: '👤'
  },
  'specialist': {
    name: 'Специалист',
    xpRequired: 2000,
    privileges: ['access_contracts', 'access_labs', 'access_blueprints', 'access_ai_cores'],
    monthlyDues: 500,
    color: '#3B82F6',
    icon: '⭐'
  },
  'manager': {
    name: 'Менеджер',
    xpRequired: 5000,
    privileges: ['access_contracts', 'access_labs', 'access_blueprints', 'access_ai_cores', 'start_projects', 'war_participation'],
    monthlyDues: 1000,
    color: '#A855F7',
    icon: '💎'
  },
  'director': {
    name: 'Директор',
    xpRequired: 15000,
    privileges: ['access_contracts', 'access_labs', 'access_blueprints', 'access_ai_cores', 'start_projects', 'war_participation', 'manage_members', 'voting_rights'],
    monthlyDues: 2500,
    color: '#F59E0B',
    icon: '👑'
  },
  'executive': {
    name: 'Руководитель',
    xpRequired: 50000,
    privileges: ['access_contracts', 'access_labs', 'access_blueprints', 'access_ai_cores', 'access_exclusive_shop', 'start_projects', 'war_participation', 'manage_members', 'voting_rights', 'dividend_share'],
    monthlyDues: 5000,
    color: '#EF4444',
    icon: '🏆'
  }
};

// ============================================
// QUEST TEMPLATES PER CORPORATION
// ============================================
export const QUEST_TEMPLATES: Record<CorporationId, Omit<CorpQuest, 'id' | 'status' | 'startedAt' | 'completedAt'>[]> = {
  'titan': [
    {
      corporationId: 'titan',
      type: 'daily',
      title: 'Оптимизация кода',
      description: 'Напишите 500 строк оптимизированного кода для проекта TITAN',
      icon: '⚙️',
      requiredRank: 'recruit',
      requiredReputation: 0,
      objectives: [{ type: 'code_lines', target: 500, current: 0, description: 'Написать 500 строк кода' }],
      rewards: { money: 500, reputation: 3, xp: 100 },
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    },
    {
      corporationId: 'titan',
      type: 'weekly',
      title: 'Разработка AI-модуля',
      description: 'Завершите проект с AI-компонентом для TITAN Industries',
      icon: '🤖',
      requiredRank: 'member',
      requiredReputation: 10,
      objectives: [
        { type: 'complete_projects', target: 1, current: 0, description: 'Завершить 1 проект' },
        { type: 'code_lines', target: 2000, current: 0, description: 'Написать 2000 строк' }
      ],
      rewards: { money: 3000, reputation: 10, xp: 500, blueprintId: 'titan_cpu_t2' },
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
    {
      corporationId: 'titan',
      type: 'story',
      title: 'Проект "Нейросеть"',
      description: 'Помогите TITAN создать новое поколение нейропроцессоров',
      icon: '🧠',
      requiredRank: 'specialist',
      requiredReputation: 30,
      objectives: [
        { type: 'complete_projects', target: 3, current: 0, description: 'Завершить 3 проекта' },
        { type: 'craft_items', target: 2, current: 0, description: 'Создать 2 AI-ядра' }
      ],
      rewards: { money: 15000, shadowCredits: 100, reputation: 25, xp: 2000 },
      bonusRewards: { blueprintId: 'titan_neural_t4' }
    }
  ],
  'orbitron': [
    {
      corporationId: 'orbitron',
      type: 'daily',
      title: 'Мониторинг сети',
      description: 'Проверьте стабильность спутниковых соединений',
      icon: '🛰️',
      requiredRank: 'recruit',
      requiredReputation: 0,
      objectives: [{ type: 'code_lines', target: 300, current: 0, description: 'Написать 300 строк кода' }],
      rewards: { money: 400, reputation: 2, xp: 80 },
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    },
    {
      corporationId: 'orbitron',
      type: 'weekly',
      title: 'Обновление протоколов',
      description: 'Разработайте новые протоколы связи для CyberLink',
      icon: '📡',
      requiredRank: 'member',
      requiredReputation: 10,
      objectives: [
        { type: 'complete_projects', target: 2, current: 0, description: 'Завершить 2 проекта' }
      ],
      rewards: { money: 2500, reputation: 8, xp: 400 },
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }
  ],
  'novatek': [
    {
      corporationId: 'novatek',
      type: 'daily',
      title: 'Тестирование GPU',
      description: 'Проведите стресс-тесты новых видеокарт NovaTek',
      icon: '🎮',
      requiredRank: 'recruit',
      requiredReputation: 0,
      objectives: [{ type: 'code_lines', target: 400, current: 0, description: 'Написать тестовый код' }],
      rewards: { money: 450, reputation: 2, xp: 90 },
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    }
  ],
  'cyberforge': [
    {
      corporationId: 'cyberforge',
      type: 'daily',
      title: 'Проект охлаждения',
      description: 'Оптимизируйте систему охлаждения CyberCool',
      icon: '❄️',
      requiredRank: 'recruit',
      requiredReputation: 0,
      objectives: [{ type: 'code_lines', target: 350, current: 0, description: 'Код для термодатчиков' }],
      rewards: { money: 400, reputation: 2, xp: 75 },
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    },
    {
      corporationId: 'cyberforge',
      type: 'weekly',
      title: 'Сборка прототипа',
      description: 'Соберите прототип нового корпуса с инновационным охлаждением',
      icon: '🖥️',
      requiredRank: 'specialist',
      requiredReputation: 20,
      objectives: [
        { type: 'craft_items', target: 3, current: 0, description: 'Создать 3 компонента' }
      ],
      rewards: { money: 2000, reputation: 8, xp: 350, blueprintId: 'cyberforge_cooler_t3' },
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }
  ],
  'blacksun': [
    {
      corporationId: 'blacksun',
      type: 'daily',
      title: 'Теневая операция',
      description: 'Проведите разведку конкурентов BlackSun',
      icon: '🌑',
      requiredRank: 'recruit',
      requiredReputation: -20, // Even enemies can do this
      objectives: [{ type: 'hack_systems', target: 1, current: 0, description: 'Взломать 1 систему' }],
      rewards: { shadowCredits: 20, reputation: 3, xp: 100 },
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    },
    {
      corporationId: 'blacksun',
      type: 'elite',
      title: 'Проект "Чёрное солнце"',
      description: 'Секретная операция по саботажу TITAN Industries',
      icon: '☠️',
      requiredRank: 'manager',
      requiredReputation: 40,
      objectives: [
        { type: 'sabotage', target: 3, current: 0, description: 'Саботировать 3 проекта TITAN' },
        { type: 'hack_systems', target: 5, current: 0, description: 'Взломать 5 систем' }
      ],
      rewards: { shadowCredits: 500, reputation: 30, xp: 2500 },
      bonusRewards: { blueprintId: 'blacksun_virus_t5' }
    }
  ],
  'ang_vers': [
    {
      corporationId: 'ang_vers',
      type: 'daily',
      title: 'Социальная активность',
      description: 'Помогите другим игрокам в чате ANG Vers',
      icon: '💬',
      requiredRank: 'recruit',
      requiredReputation: 0,
      objectives: [{ type: 'custom', target: 10, current: 0, description: 'Отправить 10 сообщений в чат' }],
      rewards: { money: 300, reputation: 5, xp: 150 },
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    },
    {
      corporationId: 'ang_vers',
      type: 'weekly',
      title: 'Рекрутинг',
      description: 'Привлеките новых участников в ANG Vers',
      icon: '👥',
      requiredRank: 'member',
      requiredReputation: 20,
      objectives: [{ type: 'recruit_members', target: 3, current: 0, description: 'Пригласить 3 игроков' }],
      rewards: { money: 2000, reputation: 15, xp: 600, privilege: 'voting_rights' },
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
    {
      corporationId: 'ang_vers',
      type: 'story',
      title: 'Основание Студии',
      description: 'Создайте собственную игровую студию под эгидой ANG Vers',
      icon: '🏢',
      requiredRank: 'director',
      requiredReputation: 70,
      objectives: [
        { type: 'earn_money', target: 100000, current: 0, description: 'Заработать $100,000' },
        { type: 'complete_projects', target: 10, current: 0, description: 'Завершить 10 проектов' },
        { type: 'recruit_members', target: 10, current: 0, description: 'Собрать команду из 10 человек' }
      ],
      rewards: { money: 50000, shadowCredits: 500, reputation: 50, xp: 10000 },
      bonusRewards: { itemId: 'ang_vers_studio_license' }
    }
  ]
};

// ============================================
// LAB CONFIGURATIONS PER CORPORATION
// ============================================
export const CORP_LABS: Record<CorporationId, Omit<CorpLab, 'id' | 'aiCores' | 'blueprintVault' | 'activeResearch' | 'completedResearch'>[]> = {
  'titan': [
    {
      corporationId: 'titan',
      type: 'research',
      name: 'TITAN R&D Center',
      tier: 3,
      icon: '🔬',
      maxCores: 8,
      maxBlueprints: 50,
      efficiency: 85,
      securityLevel: 90,
      powerConsumption: 500,
      requiredRank: 'specialist',
      isLocked: false
    },
    {
      corporationId: 'titan',
      type: 'ai_development',
      name: 'Neural Processing Lab',
      tier: 4,
      icon: '🧠',
      maxCores: 12,
      maxBlueprints: 30,
      efficiency: 95,
      securityLevel: 95,
      powerConsumption: 1000,
      requiredRank: 'manager',
      isLocked: false
    },
    {
      corporationId: 'titan',
      type: 'quantum',
      name: 'Quantum Core Facility',
      tier: 5,
      icon: '⚛️',
      maxCores: 16,
      maxBlueprints: 20,
      efficiency: 99,
      securityLevel: 99,
      powerConsumption: 2000,
      requiredRank: 'director',
      isLocked: true
    }
  ],
  'orbitron': [
    {
      corporationId: 'orbitron',
      type: 'research',
      name: 'Orbital Research Station',
      tier: 3,
      icon: '🛰️',
      maxCores: 6,
      maxBlueprints: 40,
      efficiency: 80,
      securityLevel: 85,
      powerConsumption: 400,
      requiredRank: 'specialist',
      isLocked: false
    }
  ],
  'novatek': [
    {
      corporationId: 'novatek',
      type: 'manufacturing',
      name: 'GPU Foundry',
      tier: 3,
      icon: '🏭',
      maxCores: 10,
      maxBlueprints: 60,
      efficiency: 90,
      securityLevel: 80,
      powerConsumption: 600,
      requiredRank: 'member',
      isLocked: false
    }
  ],
  'cyberforge': [
    {
      corporationId: 'cyberforge',
      type: 'manufacturing',
      name: 'CyberForge Assembly',
      tier: 2,
      icon: '🔧',
      maxCores: 4,
      maxBlueprints: 30,
      efficiency: 75,
      securityLevel: 70,
      powerConsumption: 300,
      requiredRank: 'member',
      isLocked: false
    }
  ],
  'blacksun': [
    {
      corporationId: 'blacksun',
      type: 'cybersecurity',
      name: 'Shadow Operations Center',
      tier: 4,
      icon: '🕵️',
      maxCores: 8,
      maxBlueprints: 25,
      efficiency: 90,
      securityLevel: 99,
      powerConsumption: 800,
      requiredRank: 'manager',
      isLocked: true
    }
  ],
  'ang_vers': [
    {
      corporationId: 'ang_vers',
      type: 'research',
      name: 'Social Network Lab',
      tier: 5,
      icon: '🌐',
      maxCores: 20,
      maxBlueprints: 100,
      efficiency: 95,
      securityLevel: 95,
      powerConsumption: 1500,
      requiredRank: 'member',
      isLocked: false
    },
    {
      corporationId: 'ang_vers',
      type: 'ai_development',
      name: 'ANG AI Core',
      tier: 5,
      icon: '🤖',
      maxCores: 30,
      maxBlueprints: 50,
      efficiency: 99,
      securityLevel: 99,
      powerConsumption: 3000,
      requiredRank: 'director',
      isLocked: false
    }
  ]
};

// ============================================
// CORPORATION SERVICE CLASS
// ============================================
class CorporationServiceExtended {
  
  // ============================================
  // MEMBERSHIP MANAGEMENT
  // ============================================
  
  /**
   * Join a corporation
   */
  joinCorporation(
    corporationId: CorporationId,
    currentMembership: CorpMembership | undefined,
    reputation: number
  ): { success: boolean; membership?: CorpMembership; error?: string } {
    // Check if already in a corp
    if (currentMembership?.isActive) {
      return { success: false, error: 'Вы уже состоите в корпорации. Сначала выйдите.' };
    }
    
    // Check reputation requirement (neutral or better)
    if (reputation < -10) {
      return { success: false, error: 'Ваша репутация слишком низкая для вступления.' };
    }
    
    const membership: CorpMembership = {
      corporationId,
      joinedAt: Date.now(),
      rank: 'recruit',
      xp: 0,
      monthlyDuesPaid: true, // First month free
      privileges: RANK_CONFIG['recruit'].privileges,
      contributions: 0,
      questsCompleted: 0,
      isActive: true
    };
    
    return { success: true, membership };
  }
  
  /**
   * Leave a corporation
   */
  leaveCorporation(
    membership: CorpMembership
  ): { success: boolean; reputationPenalty: number } {
    // Leaving has reputation penalty based on rank
    const rankIndex = Object.keys(RANK_CONFIG).indexOf(membership.rank);
    const penalty = (rankIndex + 1) * -5; // -5 to -30
    
    return { success: true, reputationPenalty: penalty };
  }
  
  /**
   * Add XP to membership and check for rank up
   */
  addMembershipXP(
    membership: CorpMembership,
    xpGained: number
  ): { membership: CorpMembership; rankedUp: boolean; newRank?: CorpMemberRank } {
    const newXP = membership.xp + xpGained;
    const ranks = Object.keys(RANK_CONFIG) as CorpMemberRank[];
    const currentRankIndex = ranks.indexOf(membership.rank);
    
    // Check if can rank up
    let newRank = membership.rank;
    for (let i = currentRankIndex + 1; i < ranks.length; i++) {
      if (newXP >= RANK_CONFIG[ranks[i]].xpRequired) {
        newRank = ranks[i];
      } else {
        break;
      }
    }
    
    const rankedUp = newRank !== membership.rank;
    
    return {
      membership: {
        ...membership,
        xp: newXP,
        rank: newRank,
        privileges: RANK_CONFIG[newRank].privileges
      },
      rankedUp,
      newRank: rankedUp ? newRank : undefined
    };
  }
  
  /**
   * Check if player has a specific privilege
   */
  hasPrivilege(membership: CorpMembership | undefined, privilege: CorpPrivilege): boolean {
    if (!membership?.isActive) return false;
    return membership.privileges.includes(privilege);
  }
  
  /**
   * Get monthly dues for current rank
   */
  getMonthlyDues(membership: CorpMembership): number {
    return RANK_CONFIG[membership.rank].monthlyDues;
  }
  
  /**
   * Pay monthly dues
   */
  payDues(
    membership: CorpMembership,
    playerMoney: number
  ): { success: boolean; newMoney: number; membership: CorpMembership; error?: string } {
    const dues = this.getMonthlyDues(membership);
    
    if (playerMoney < dues) {
      return { success: false, newMoney: playerMoney, membership, error: 'Недостаточно средств' };
    }
    
    return {
      success: true,
      newMoney: playerMoney - dues,
      membership: { ...membership, monthlyDuesPaid: true, contributions: membership.contributions + dues }
    };
  }
  
  // ============================================
  // QUEST MANAGEMENT
  // ============================================
  
  /**
   * Get available quests for a corporation
   */
  getAvailableQuests(
    corporationId: CorporationId,
    membership: CorpMembership | undefined,
    reputation: number,
    completedQuestIds: string[]
  ): CorpQuest[] {
    const templates = QUEST_TEMPLATES[corporationId] || [];
    
    return templates
      .filter(template => {
        // Check rank requirement
        if (membership) {
          const ranks = Object.keys(RANK_CONFIG) as CorpMemberRank[];
          const playerRankIndex = ranks.indexOf(membership.rank);
          const requiredRankIndex = ranks.indexOf(template.requiredRank);
          if (playerRankIndex < requiredRankIndex) return false;
        } else if (template.requiredRank !== 'recruit') {
          return false;
        }
        
        // Check reputation
        if (reputation < template.requiredReputation) return false;
        
        return true;
      })
      .map(template => ({
        ...template,
        id: uuidv4(),
        status: 'available' as const
      }));
  }
  
  /**
   * Start a quest
   */
  startQuest(quest: CorpQuest): CorpQuest {
    return {
      ...quest,
      status: 'active',
      startedAt: Date.now()
    };
  }
  
  /**
   * Update quest progress
   */
  updateQuestProgress(
    quest: CorpQuest,
    objectiveType: CorpQuest['objectives'][0]['type'],
    progress: number
  ): CorpQuest {
    const updatedObjectives = quest.objectives.map(obj => {
      if (obj.type === objectiveType) {
        return { ...obj, current: Math.min(obj.current + progress, obj.target) };
      }
      return obj;
    });
    
    // Check if all objectives completed
    const allCompleted = updatedObjectives.every(obj => obj.current >= obj.target);
    
    return {
      ...quest,
      objectives: updatedObjectives,
      status: allCompleted ? 'completed' : quest.status,
      completedAt: allCompleted ? Date.now() : undefined
    };
  }
  
  /**
   * Collect quest rewards
   */
  collectQuestRewards(
    quest: CorpQuest,
    perfect: boolean = false
  ): CorpQuestReward {
    const baseRewards = quest.rewards;
    const bonusRewards = perfect && quest.bonusRewards ? quest.bonusRewards : {};
    
    return {
      money: (baseRewards.money || 0) + (bonusRewards.money || 0),
      shadowCredits: (baseRewards.shadowCredits || 0) + (bonusRewards.shadowCredits || 0),
      reputation: (baseRewards.reputation || 0) + (bonusRewards.reputation || 0),
      xp: (baseRewards.xp || 0) + (bonusRewards.xp || 0),
      blueprintId: bonusRewards.blueprintId || baseRewards.blueprintId,
      itemId: bonusRewards.itemId || baseRewards.itemId,
      privilege: bonusRewards.privilege || baseRewards.privilege
    };
  }
  
  // ============================================
  // LABS & AI CORES
  // ============================================
  
  /**
   * Get labs for a corporation
   */
  getCorpLabs(corporationId: CorporationId): CorpLab[] {
    const templates = CORP_LABS[corporationId] || [];
    
    return templates.map(template => ({
      ...template,
      id: uuidv4(),
      aiCores: [],
      blueprintVault: [],
      completedResearch: []
    }));
  }
  
  /**
   * Check if player can access a lab
   */
  canAccessLab(lab: CorpLab, membership: CorpMembership | undefined): boolean {
    if (!membership?.isActive) return false;
    if (!this.hasPrivilege(membership, 'access_labs')) return false;
    if (lab.isLocked) return false;
    
    const ranks = Object.keys(RANK_CONFIG) as CorpMemberRank[];
    const playerRankIndex = ranks.indexOf(membership.rank);
    const requiredRankIndex = ranks.indexOf(lab.requiredRank);
    
    return playerRankIndex >= requiredRankIndex;
  }
  
  /**
   * Install AI Core in lab
   */
  installAICore(
    lab: CorpLab,
    core: AICore
  ): { success: boolean; lab: CorpLab; error?: string } {
    if (lab.aiCores.length >= lab.maxCores) {
      return { success: false, lab, error: 'Лаборатория заполнена' };
    }
    
    return {
      success: true,
      lab: {
        ...lab,
        aiCores: [...lab.aiCores, { ...core, installedAt: Date.now(), corporationId: lab.corporationId }]
      }
    };
  }
  
  /**
   * Store blueprint in vault
   */
  storeBlueprint(
    lab: CorpLab,
    blueprintId: string
  ): { success: boolean; lab: CorpLab; error?: string } {
    if (lab.blueprintVault.length >= lab.maxBlueprints) {
      return { success: false, lab, error: 'Хранилище заполнено' };
    }
    
    if (lab.blueprintVault.includes(blueprintId)) {
      return { success: false, lab, error: 'Чертёж уже в хранилище' };
    }
    
    return {
      success: true,
      lab: {
        ...lab,
        blueprintVault: [...lab.blueprintVault, blueprintId]
      }
    };
  }
  
  /**
   * Start research project
   */
  startResearch(
    lab: CorpLab,
    project: Omit<ResearchProject, 'id' | 'progress' | 'startedAt' | 'contributors'>
  ): { success: boolean; lab: CorpLab; project?: ResearchProject; error?: string } {
    if (lab.activeResearch) {
      return { success: false, lab, error: 'Уже идёт исследование' };
    }
    
    if (lab.aiCores.filter(c => c.isActive).length < project.requiredCores) {
      return { success: false, lab, error: 'Недостаточно активных AI-ядер' };
    }
    
    const newProject: ResearchProject = {
      ...project,
      id: uuidv4(),
      labId: lab.id,
      progress: 0,
      startedAt: Date.now(),
      contributors: []
    };
    
    return {
      success: true,
      lab: { ...lab, activeResearch: newProject },
      project: newProject
    };
  }
  
  /**
   * Update research progress
   */
  updateResearchProgress(lab: CorpLab, minutesPassed: number): CorpLab {
    if (!lab.activeResearch) return lab;
    
    const activeCores = lab.aiCores.filter(c => c.isActive);
    const totalPower = activeCores.reduce((sum, core) => sum + core.power, 0);
    const efficiencyBonus = lab.efficiency / 100;
    
    // Progress per minute = (totalPower * efficiency) / totalTime * 100
    const progressPerMinute = (totalPower * efficiencyBonus) / lab.activeResearch.totalTime;
    const newProgress = Math.min(100, lab.activeResearch.progress + progressPerMinute * minutesPassed);
    
    const updatedResearch: ResearchProject = {
      ...lab.activeResearch,
      progress: newProgress
    };
    
    // Check if completed
    if (newProgress >= 100) {
      return {
        ...lab,
        activeResearch: undefined,
        completedResearch: [...lab.completedResearch, updatedResearch.id]
      };
    }
    
    return { ...lab, activeResearch: updatedResearch };
  }
  
  // ============================================
  // CORP WARS
  // ============================================
  
  /**
   * Get active wars for a corporation
   */
  getActiveWars(corporationId: CorporationId, allWars: CorpWar[]): CorpWar[] {
    return allWars.filter(
      war => 
        war.status === 'active' &&
        (war.attackerId === corporationId || war.defenderId === corporationId)
    );
  }
  
  /**
   * Declare war on another corporation
   */
  declareWar(
    attackerId: CorporationId,
    defenderId: CorporationId,
    stakes: CorpWar['stakes']
  ): CorpWar {
    return {
      id: uuidv4(),
      type: 'influence',
      status: 'pending',
      attackerId,
      defenderId,
      attackerScore: 0,
      defenderScore: 0,
      attackerMembers: [],
      defenderMembers: [],
      declaredAt: Date.now(),
      stakes,
      events: []
    };
  }
  
  /**
   * Add war event
   */
  addWarEvent(
    war: CorpWar,
    event: Omit<WarEvent, 'id' | 'warId' | 'timestamp'>
  ): CorpWar {
    const newEvent: WarEvent = {
      ...event,
      id: uuidv4(),
      warId: war.id,
      timestamp: Date.now()
    };
    
    // Update scores
    const isAttacker = event.actorCorp === war.attackerId;
    
    return {
      ...war,
      attackerScore: isAttacker ? war.attackerScore + event.points : war.attackerScore,
      defenderScore: !isAttacker ? war.defenderScore + event.points : war.defenderScore,
      events: [...war.events, newEvent]
    };
  }
  
  /**
   * End war and determine winner
   */
  endWar(war: CorpWar): { war: CorpWar; winnerId: CorporationId; loserId: CorporationId } {
    const winnerId = war.attackerScore > war.defenderScore ? war.attackerId : war.defenderId;
    const loserId = winnerId === war.attackerId ? war.defenderId : war.attackerId;
    
    return {
      war: { ...war, status: 'ended' },
      winnerId,
      loserId
    };
  }
  
  // ============================================
  // ALLIANCE MANAGEMENT
  // ============================================
  
  /**
   * Create alliance
   */
  createAlliance(
    name: string,
    founderId: CorporationId,
    minimumTier: CorporationTier
  ): CorpAlliance {
    return {
      id: uuidv4(),
      name,
      foundedAt: Date.now(),
      members: [founderId],
      leader: founderId,
      sharedResearch: false,
      tradingBonus: 5,
      defenseBonus: 10,
      minimumTier,
      membershipFee: 10000
    };
  }
  
  /**
   * Join alliance
   */
  joinAlliance(
    alliance: CorpAlliance,
    corporationId: CorporationId,
    corpTier: CorporationTier
  ): { success: boolean; alliance: CorpAlliance; error?: string } {
    const tierOrder: CorporationTier[] = ['D', 'C', 'B', 'A', 'S'];
    
    if (tierOrder.indexOf(corpTier) < tierOrder.indexOf(alliance.minimumTier)) {
      return { success: false, alliance, error: 'Корпорация не соответствует минимальному уровню' };
    }
    
    if (alliance.members.includes(corporationId)) {
      return { success: false, alliance, error: 'Уже в альянсе' };
    }
    
    return {
      success: true,
      alliance: {
        ...alliance,
        members: [...alliance.members, corporationId]
      }
    };
  }
}

export const corporationServiceExtended = new CorporationServiceExtended();
