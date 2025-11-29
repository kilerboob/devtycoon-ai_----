/**
 * P2P Contract Service - LAYER 10-12
 * Peer-to-peer контракты между игроками
 */

import { ProgrammingLanguage } from '../types';

// Типы контрактов
export type ContractType = 
  | 'code_review'      // Проверка кода
  | 'bug_fix'          // Исправление багов
  | 'feature'          // Разработка фичи
  | 'mentoring'        // Менторство
  | 'security_audit'   // Аудит безопасности
  | 'optimization';    // Оптимизация

// Статус контракта
export type ContractStatus = 
  | 'open'             // Открыт для принятия
  | 'in_progress'      // В работе
  | 'review'           // На ревью
  | 'disputed'         // Спор
  | 'completed'        // Завершён
  | 'cancelled';       // Отменён

// P2P Контракт
export interface P2PContract {
  id: string;
  type: ContractType;
  title: string;
  description: string;
  
  // Участники
  creatorId: string;
  creatorName: string;
  executorId?: string;
  executorName?: string;
  
  // Требования
  requirements: {
    language?: ProgrammingLanguage;
    minLevel?: number;
    minReputation?: number;
    estimatedHours: number;
  };
  
  // Награда
  reward: {
    money: number;
    shadowCredits?: number;
    reputation: number;
    xp: number;
  };
  
  // Временные рамки
  createdAt: number;
  deadline?: number;
  completedAt?: number;
  
  // Статус
  status: ContractStatus;
  
  // Отзывы
  creatorRating?: number;
  executorRating?: number;
  
  // Escrow (заморозка средств)
  escrowAmount: number;
  isEscrowReleased: boolean;
}

// Гильдия
export interface Guild {
  id: string;
  name: string;
  tag: string;           // [TAG] перед именем
  icon: string;
  description: string;
  
  // Лидерство
  leaderId: string;
  leaderName: string;
  officerIds: string[];
  
  // Члены
  memberIds: string[];
  maxMembers: number;
  
  // Статистика
  totalXp: number;
  totalContracts: number;
  reputation: number;
  level: number;
  
  // Казна
  treasury: number;
  weeklyContribution: number;
  
  // Требования
  requirements: {
    minLevel: number;
    minReputation: number;
    applicationRequired: boolean;
  };
  
  // Бонусы
  bonuses: {
    xpMultiplier: number;
    reputationMultiplier: number;
    contractBonus: number;
  };
  
  // Мета
  createdAt: number;
  isRecruiting: boolean;
  tags: string[];
}

// Информация о типе контракта
const CONTRACT_TYPE_INFO: Record<ContractType, { name: string; icon: string; baseReward: number; xp: number }> = {
  'code_review': { name: 'Code Review', icon: '👁️', baseReward: 50, xp: 10 },
  'bug_fix': { name: 'Bug Fix', icon: '🐛', baseReward: 100, xp: 25 },
  'feature': { name: 'Feature Dev', icon: '⚡', baseReward: 300, xp: 50 },
  'mentoring': { name: 'Mentoring', icon: '🎓', baseReward: 150, xp: 30 },
  'security_audit': { name: 'Security Audit', icon: '🔒', baseReward: 500, xp: 75 },
  'optimization': { name: 'Optimization', icon: '🚀', baseReward: 200, xp: 40 },
};

class P2PContractService {
  private contracts: P2PContract[] = [];
  private guilds: Guild[] = [];
  
  constructor() {
    this.initializeTestData();
  }
  
  private initializeTestData() {
    // Тестовые контракты
    this.contracts = [
      {
        id: 'contract_1',
        type: 'bug_fix',
        title: 'Исправить memory leak в игровом движке',
        description: 'Нужно найти и исправить утечку памяти в модуле рендеринга. Профайлер показывает рост использования RAM на 50MB/час.',
        creatorId: 'user_alex',
        creatorName: 'Alex_Dev',
        requirements: {
          language: 'cpp',
          minLevel: 3,
          minReputation: 50,
          estimatedHours: 4,
        },
        reward: {
          money: 500,
          reputation: 15,
          xp: 100,
        },
        createdAt: Date.now() - 3600000,
        deadline: Date.now() + 86400000,
        status: 'open',
        escrowAmount: 500,
        isEscrowReleased: false,
      },
      {
        id: 'contract_2',
        type: 'code_review',
        title: 'Ревью Python скрипта для автоматизации',
        description: 'Написал скрипт для парсинга данных, нужен опытный глаз чтобы проверить код на ошибки и дать рекомендации.',
        creatorId: 'user_maria',
        creatorName: 'Maria_Py',
        requirements: {
          language: 'python',
          minLevel: 2,
          estimatedHours: 1,
        },
        reward: {
          money: 75,
          reputation: 5,
          xp: 20,
        },
        createdAt: Date.now() - 7200000,
        status: 'open',
        escrowAmount: 75,
        isEscrowReleased: false,
      },
      {
        id: 'contract_3',
        type: 'feature',
        title: 'Разработка модуля аутентификации',
        description: 'Нужен OAuth2 + JWT модуль для веб-приложения. TypeScript, Node.js backend.',
        creatorId: 'user_startup',
        creatorName: 'StartupCTO',
        executorId: 'user_john',
        executorName: 'John_Senior',
        requirements: {
          language: 'javascript',
          minLevel: 4,
          minReputation: 100,
          estimatedHours: 8,
        },
        reward: {
          money: 1200,
          shadowCredits: 50,
          reputation: 25,
          xp: 200,
        },
        createdAt: Date.now() - 86400000,
        deadline: Date.now() + 172800000,
        status: 'in_progress',
        escrowAmount: 1200,
        isEscrowReleased: false,
      },
    ];
    
    // Тестовые гильдии
    this.guilds = [
      {
        id: 'guild_1',
        name: 'Code Warriors',
        tag: 'CW',
        icon: '⚔️',
        description: 'Элитная гильдия программистов. Только лучшие из лучших.',
        leaderId: 'user_master',
        leaderName: 'MasterCoder',
        officerIds: ['user_officer1', 'user_officer2'],
        memberIds: ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'],
        maxMembers: 50,
        totalXp: 150000,
        totalContracts: 342,
        reputation: 950,
        level: 15,
        treasury: 25000,
        weeklyContribution: 100,
        requirements: {
          minLevel: 5,
          minReputation: 200,
          applicationRequired: true,
        },
        bonuses: {
          xpMultiplier: 1.15,
          reputationMultiplier: 1.1,
          contractBonus: 50,
        },
        createdAt: Date.now() - 30 * 86400000,
        isRecruiting: true,
        tags: ['competitive', 'elite', 'english'],
      },
      {
        id: 'guild_2',
        name: 'Новички Объединяйтесь',
        tag: 'НО',
        icon: '🌱',
        description: 'Дружественная гильдия для новичков. Помогаем расти!',
        leaderId: 'user_helper',
        leaderName: 'HelperBot',
        officerIds: [],
        memberIds: ['user_new1', 'user_new2', 'user_new3'],
        maxMembers: 100,
        totalXp: 5000,
        totalContracts: 23,
        reputation: 120,
        level: 3,
        treasury: 500,
        weeklyContribution: 0,
        requirements: {
          minLevel: 1,
          minReputation: 0,
          applicationRequired: false,
        },
        bonuses: {
          xpMultiplier: 1.05,
          reputationMultiplier: 1.0,
          contractBonus: 10,
        },
        createdAt: Date.now() - 7 * 86400000,
        isRecruiting: true,
        tags: ['beginner-friendly', 'russian', 'casual'],
      },
      {
        id: 'guild_3',
        name: 'Shadow Syndicate',
        tag: 'SS',
        icon: '🦇',
        description: 'Для тех, кто работает в тени. DarkHub специалисты.',
        leaderId: 'user_shadow',
        leaderName: 'ShadowMaster',
        officerIds: ['user_dark1'],
        memberIds: ['user_h1', 'user_h2'],
        maxMembers: 25,
        totalXp: 75000,
        totalContracts: 156,
        reputation: 500,
        level: 10,
        treasury: 15000,
        weeklyContribution: 200,
        requirements: {
          minLevel: 7,
          minReputation: 300,
          applicationRequired: true,
        },
        bonuses: {
          xpMultiplier: 1.2,
          reputationMultiplier: 1.25,
          contractBonus: 100,
        },
        createdAt: Date.now() - 60 * 86400000,
        isRecruiting: false,
        tags: ['shadow', 'elite', 'darkhub'],
      },
    ];
  }
  
  // Получить все открытые контракты
  getOpenContracts(): P2PContract[] {
    return this.contracts.filter(c => c.status === 'open');
  }
  
  // Получить контракты пользователя
  getUserContracts(userId: string): P2PContract[] {
    return this.contracts.filter(c => 
      c.creatorId === userId || c.executorId === userId
    );
  }
  
  // Создать контракт
  createContract(
    creatorId: string,
    creatorName: string,
    type: ContractType,
    title: string,
    description: string,
    requirements: P2PContract['requirements'],
    rewardMoney: number,
    rewardShadowCredits?: number
  ): P2PContract {
    const typeInfo = CONTRACT_TYPE_INFO[type];
    
    const contract: P2PContract = {
      id: `contract_${Date.now()}`,
      type,
      title,
      description,
      creatorId,
      creatorName,
      requirements,
      reward: {
        money: rewardMoney,
        shadowCredits: rewardShadowCredits,
        reputation: Math.floor(rewardMoney / 20),
        xp: typeInfo.xp * Math.ceil(requirements.estimatedHours / 2),
      },
      createdAt: Date.now(),
      deadline: Date.now() + requirements.estimatedHours * 3600000 * 2,
      status: 'open',
      escrowAmount: rewardMoney,
      isEscrowReleased: false,
    };
    
    this.contracts.push(contract);
    return contract;
  }
  
  // Принять контракт
  acceptContract(contractId: string, executorId: string, executorName: string): boolean {
    const contract = this.contracts.find(c => c.id === contractId);
    if (!contract || contract.status !== 'open') return false;
    
    contract.executorId = executorId;
    contract.executorName = executorName;
    contract.status = 'in_progress';
    
    return true;
  }
  
  // Завершить контракт
  completeContract(contractId: string): P2PContract | null {
    const contract = this.contracts.find(c => c.id === contractId);
    if (!contract || contract.status !== 'in_progress') return null;
    
    contract.status = 'completed';
    contract.completedAt = Date.now();
    contract.isEscrowReleased = true;
    
    return contract;
  }
  
  // Получить все гильдии
  getGuilds(): Guild[] {
    return this.guilds;
  }
  
  // Получить гильдию по ID
  getGuild(guildId: string): Guild | undefined {
    return this.guilds.find(g => g.id === guildId);
  }
  
  // Получить гильдии набирающие членов
  getRecruitingGuilds(): Guild[] {
    return this.guilds.filter(g => g.isRecruiting && g.memberIds.length < g.maxMembers);
  }
  
  // Проверить может ли игрок вступить в гильдию
  canJoinGuild(guild: Guild, playerLevel: number, playerReputation: number): { canJoin: boolean; reason?: string } {
    if (guild.memberIds.length >= guild.maxMembers) {
      return { canJoin: false, reason: 'Гильдия переполнена' };
    }
    if (!guild.isRecruiting) {
      return { canJoin: false, reason: 'Гильдия не набирает членов' };
    }
    if (playerLevel < guild.requirements.minLevel) {
      return { canJoin: false, reason: `Требуется уровень ${guild.requirements.minLevel}+` };
    }
    if (playerReputation < guild.requirements.minReputation) {
      return { canJoin: false, reason: `Требуется репутация ${guild.requirements.minReputation}+` };
    }
    return { canJoin: true };
  }
  
  // Получить информацию о типе контракта
  getContractTypeInfo(type: ContractType) {
    return CONTRACT_TYPE_INFO[type];
  }
  
  // Получить все типы контрактов
  getAllContractTypes(): ContractType[] {
    return Object.keys(CONTRACT_TYPE_INFO) as ContractType[];
  }
}

export const p2pContractService = new P2PContractService();
