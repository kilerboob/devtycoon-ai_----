/**
 * Blueprint Service
 * LAYER 7: Manages blueprints - schematics for crafting hardware
 */

import { Blueprint, BlueprintType, BlueprintTier, CorporationId, SkillLevel } from '../types';
import { devFsService } from './devFsService';
import { v4 as uuidv4 } from 'uuid';

// Tier configuration
export const TIER_CONFIG: Record<BlueprintTier, { 
  name: string; 
  color: string; 
  multiplier: number;
  minLevel: SkillLevel;
}> = {
  'T1': { name: 'Common', color: '#9CA3AF', multiplier: 1, minLevel: SkillLevel.INTERN },
  'T2': { name: 'Advanced', color: '#22C55E', multiplier: 1.5, minLevel: SkillLevel.JUNIOR },
  'T3': { name: 'Rare', color: '#3B82F6', multiplier: 2.5, minLevel: SkillLevel.MIDDLE },
  'T4': { name: 'Prototype', color: '#A855F7', multiplier: 4, minLevel: SkillLevel.SENIOR },
  'T5': { name: 'Legendary', color: '#F59E0B', multiplier: 7, minLevel: SkillLevel.LEAD },
  'T6': { name: 'Experimental', color: '#EF4444', multiplier: 12, minLevel: SkillLevel.ARCHITECT },
};

// Blueprint type configuration
export const BLUEPRINT_TYPES: Record<BlueprintType, {
  name: string;
  icon: string;
  basePrice: number;
  category: 'compute' | 'storage' | 'cooling' | 'structure' | 'advanced';
}> = {
  'cpu': { name: 'Процессор', icon: '🔲', basePrice: 500, category: 'compute' },
  'gpu': { name: 'Видеокарта', icon: '🎮', basePrice: 800, category: 'compute' },
  'ram': { name: 'Память', icon: '📊', basePrice: 200, category: 'storage' },
  'ssd': { name: 'Накопитель', icon: '💿', basePrice: 300, category: 'storage' },
  'cooler': { name: 'Охлаждение', icon: '❄️', basePrice: 150, category: 'cooling' },
  'case': { name: 'Корпус', icon: '🖥️', basePrice: 250, category: 'structure' },
  'ai-core': { name: 'AI Ядро', icon: '🧠', basePrice: 2000, category: 'advanced' },
  'quantum-node': { name: 'Квантовый узел', icon: '⚛️', basePrice: 5000, category: 'advanced' },
  'neural-chip': { name: 'Нейрочип', icon: '🔮', basePrice: 3500, category: 'advanced' },
};

// Starter blueprints available to all players
const STARTER_BLUEPRINTS: Omit<Blueprint, 'id' | 'unlockedAt'>[] = [
  {
    name: 'Basic CPU v1',
    type: 'cpu',
    tier: 'T1',
    rarity: 'common',
    source: 'market',
    corporationId: 'titan',
    stats: { power: 10, efficiency: 50, durability: 80, complexity: 10 },
    craftingCost: { money: 100, skillRequired: SkillLevel.INTERN },
    marketValue: 150,
    darkHubValue: 80,
    description: 'Базовый процессор для начинающих. Надёжный, но медленный.',
    icon: '🔲',
  },
  {
    name: 'Entry SSD',
    type: 'ssd',
    tier: 'T1',
    rarity: 'common',
    source: 'market',
    corporationId: 'novatek',
    stats: { power: 8, efficiency: 60, durability: 90, complexity: 5 },
    craftingCost: { money: 80, skillRequired: SkillLevel.INTERN },
    marketValue: 120,
    darkHubValue: 60,
    description: 'Простой SSD на 256GB. Хватит для начала.',
    icon: '💿',
  },
  {
    name: 'Basic Cooler',
    type: 'cooler',
    tier: 'T1',
    rarity: 'common',
    source: 'market',
    corporationId: 'cyberforge',
    stats: { power: 5, efficiency: 70, durability: 95, complexity: 3 },
    craftingCost: { money: 50, skillRequired: SkillLevel.INTERN },
    marketValue: 75,
    darkHubValue: 40,
    description: 'Стандартный кулер. Тихий и надёжный.',
    icon: '❄️',
  },
];

// Advanced blueprints (unlockable)
const ADVANCED_BLUEPRINTS: Omit<Blueprint, 'id' | 'unlockedAt'>[] = [
  {
    name: 'TITAN X-Core 9000',
    type: 'cpu',
    tier: 'T4',
    rarity: 'prototype',
    source: 'lab',
    corporationId: 'titan',
    stats: { power: 85, efficiency: 75, durability: 70, complexity: 75 },
    craftingCost: { money: 5000, shadowCredits: 200, skillRequired: SkillLevel.SENIOR },
    marketValue: 8000,
    darkHubValue: 12000,
    description: 'Экспериментальный 128-ядерный процессор. Мощь следующего поколения.',
    icon: '⚙️',
  },
  {
    name: 'NovaTek Quantum SSD',
    type: 'ssd',
    tier: 'T5',
    rarity: 'legendary',
    source: 'lab',
    corporationId: 'novatek',
    stats: { power: 95, efficiency: 90, durability: 60, complexity: 90 },
    craftingCost: { money: 15000, shadowCredits: 500, skillRequired: SkillLevel.LEAD },
    marketValue: 25000,
    darkHubValue: 40000,
    description: 'Квантовое хранилище на 100PB. Скорость света.',
    icon: '💎',
  },
  {
    name: 'BlackSun Neural Implant',
    type: 'neural-chip',
    tier: 'T6',
    rarity: 'experimental',
    source: 'stolen',
    corporationId: 'blacksun',
    stats: { power: 100, efficiency: 40, durability: 30, complexity: 100 },
    craftingCost: { money: 50000, shadowCredits: 2000, skillRequired: SkillLevel.ARCHITECT },
    marketValue: 0, // Illegal, can't sell legally
    darkHubValue: 100000,
    description: 'ЗАПРЕЩЕНО. Нелегальный нейроинтерфейс для прямого подключения к сети.',
    icon: '☠️',
    isStolen: true,
  },
  {
    name: 'Orbitron Satellite Link',
    type: 'quantum-node',
    tier: 'T5',
    rarity: 'legendary',
    source: 'reward',
    corporationId: 'orbitron',
    stats: { power: 80, efficiency: 95, durability: 85, complexity: 85 },
    craftingCost: { money: 20000, skillRequired: SkillLevel.LEAD },
    marketValue: 35000,
    darkHubValue: 30000,
    description: 'Прямое подключение к спутниковой сети Orbitron. Ping 1ms по всему миру.',
    icon: '🛰️',
  },
  {
    name: 'CyberForge Cryo Chamber',
    type: 'cooler',
    tier: 'T4',
    rarity: 'prototype',
    source: 'market',
    corporationId: 'cyberforge',
    stats: { power: 70, efficiency: 85, durability: 75, complexity: 60 },
    craftingCost: { money: 3000, skillRequired: SkillLevel.SENIOR },
    marketValue: 5000,
    darkHubValue: 4000,
    description: 'Криогенное охлаждение. Температура -40°C под нагрузкой.',
    icon: '🧊',
  },
];

class BlueprintService {
  private readonly BLUEPRINTS_PATH = '/blueprints';

  /**
   * Get starter blueprints for new players
   */
  getStarterBlueprints(): Blueprint[] {
    return STARTER_BLUEPRINTS.map(bp => ({
      ...bp,
      id: uuidv4(),
      unlockedAt: Date.now(),
    }));
  }

  /**
   * Get all available blueprints (for shop/discovery)
   */
  getAllBlueprints(): Omit<Blueprint, 'id' | 'unlockedAt'>[] {
    return [...STARTER_BLUEPRINTS, ...ADVANCED_BLUEPRINTS];
  }

  /**
   * Generate a random blueprint based on tier
   */
  generateBlueprint(tier: BlueprintTier, source: Blueprint['source'] = 'market'): Blueprint {
    const types = Object.keys(BLUEPRINT_TYPES) as BlueprintType[];
    const type = types[Math.floor(Math.random() * types.length)];
    const typeInfo = BLUEPRINT_TYPES[type];
    const tierInfo = TIER_CONFIG[tier];

    const rarities: Blueprint['rarity'][] = ['common', 'advanced', 'rare', 'prototype', 'legendary', 'experimental'];
    const tierIndex = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'].indexOf(tier);
    const rarity = rarities[Math.min(tierIndex, rarities.length - 1)];

    const corporations: CorporationId[] = ['titan', 'novatek', 'cyberforge', 'blacksun', 'orbitron'];
    const corpId = corporations[Math.floor(Math.random() * corporations.length)];

    const basePower = Math.floor(20 + tierIndex * 15 + Math.random() * 10);
    
    return {
      id: uuidv4(),
      name: `${tierInfo.name} ${typeInfo.name} Mk.${Math.floor(Math.random() * 9) + 1}`,
      type,
      tier,
      rarity,
      source,
      corporationId: corpId,
      stats: {
        power: basePower,
        efficiency: Math.floor(40 + Math.random() * 50),
        durability: Math.floor(50 + Math.random() * 40),
        complexity: Math.floor(tierIndex * 15 + Math.random() * 20),
      },
      craftingCost: {
        money: Math.floor(typeInfo.basePrice * tierInfo.multiplier),
        shadowCredits: tier === 'T5' || tier === 'T6' ? Math.floor(100 * tierInfo.multiplier) : undefined,
        skillRequired: tierInfo.minLevel,
      },
      marketValue: Math.floor(typeInfo.basePrice * tierInfo.multiplier * 1.5),
      darkHubValue: Math.floor(typeInfo.basePrice * tierInfo.multiplier * (source === 'stolen' ? 2.5 : 1.2)),
      description: `${tierInfo.name} ${typeInfo.name} от разных производителей.`,
      icon: typeInfo.icon,
      unlockedAt: Date.now(),
      isStolen: source === 'stolen',
    };
  }

  /**
   * Save blueprint to DevFS
   */
  async saveBlueprint(blueprint: Blueprint): Promise<void> {
    const path = `${this.BLUEPRINTS_PATH}/${blueprint.id}.json`;
    await devFsService.init();
    
    // Ensure blueprints folder exists
    const folder = await devFsService.getEntry(this.BLUEPRINTS_PATH);
    if (!folder) {
      await devFsService.createFolder(this.BLUEPRINTS_PATH);
    }

    await devFsService.createFile(path, JSON.stringify(blueprint, null, 2));
  }

  /**
   * Load all blueprints from DevFS
   */
  async loadBlueprints(): Promise<Blueprint[]> {
    await devFsService.init();
    
    const folder = await devFsService.getEntry(this.BLUEPRINTS_PATH);
    if (!folder || folder.type !== 'folder') {
      return [];
    }

    const entries = await devFsService.listFolder(this.BLUEPRINTS_PATH);
    const blueprints: Blueprint[] = [];

    for (const entry of entries) {
      if (entry.type === 'file' && entry.name.endsWith('.json')) {
        try {
          const file = await devFsService.getEntry(`${this.BLUEPRINTS_PATH}/${entry.name}`);
          if (file && 'content' in file) {
            blueprints.push(JSON.parse(file.content));
          }
        } catch (e) {
          console.warn('[BlueprintService] Failed to load blueprint:', entry.name, e);
        }
      }
    }

    return blueprints;
  }

  /**
   * Get tier info
   */
  getTierInfo(tier: BlueprintTier) {
    return TIER_CONFIG[tier];
  }

  /**
   * Get type info
   */
  getTypeInfo(type: BlueprintType) {
    return BLUEPRINT_TYPES[type];
  }

  /**
   * Calculate crafting success chance
   */
  calculateCraftingChance(blueprint: Blueprint, playerLevel: SkillLevel): number {
    const levelOrder = Object.values(SkillLevel);
    const playerIndex = levelOrder.indexOf(playerLevel);
    const requiredIndex = levelOrder.indexOf(blueprint.craftingCost.skillRequired);
    
    const diff = playerIndex - requiredIndex;
    
    if (diff < 0) return Math.max(10, 50 + diff * 20); // Below required level
    if (diff === 0) return 70; // At required level
    return Math.min(98, 70 + diff * 10); // Above required level
  }

  /**
   * Check if player can craft a blueprint
   */
  canCraft(blueprint: Blueprint, money: number, shadowCredits: number, playerLevel: SkillLevel): {
    canCraft: boolean;
    reason?: string;
  } {
    if (money < blueprint.craftingCost.money) {
      return { canCraft: false, reason: 'Недостаточно денег' };
    }
    
    if (blueprint.craftingCost.shadowCredits && shadowCredits < blueprint.craftingCost.shadowCredits) {
      return { canCraft: false, reason: 'Недостаточно ShadowCredits' };
    }

    const levelOrder = Object.values(SkillLevel);
    if (levelOrder.indexOf(playerLevel) < levelOrder.indexOf(blueprint.craftingCost.skillRequired)) {
      return { canCraft: false, reason: `Требуется уровень: ${blueprint.craftingCost.skillRequired}` };
    }

    return { canCraft: true };
  }
}

export const blueprintService = new BlueprintService();
