/**
 * Shard Service - LAYER 4: Shards & Network
 * 
 * Система серверов (шардов) для игры.
 * Каждый шард = отдельный сервер с уникальными характеристиками.
 */

import { dbService } from './dbService';

// === ТИПЫ ===

export type ShardStatus = 'online' | 'maintenance' | 'full' | 'offline';
export type ShardRegion = 'EU-West' | 'EU-East' | 'US-East' | 'US-West' | 'Asia-Pacific' | 'RU-Moscow' | 'RU-SPb';

export interface Shard {
  id: string;
  name: string;
  region: ShardRegion;
  status: ShardStatus;
  population: number;        // Текущее население
  maxPopulation: number;     // Максимум игроков
  ping: number;              // Пинг в мс
  economyMultiplier: number; // Множитель экономики (1.0 = стандарт)
  xpMultiplier: number;      // Множитель опыта
  isPvP: boolean;            // PvP разрешён
  isHardcore: boolean;       // Хардкор режим (потеря прогресса при смерти)
  createdAt: number;         // Когда сервер создан
  description: string;       // Описание сервера
  features: string[];        // Особенности сервера
}

export interface ShardSelection {
  shardId: string;
  selectedAt: number;
  characterName?: string;
}

// === НАЧАЛЬНЫЕ ШАРДЫ ===

const INITIAL_SHARDS: Shard[] = [
  {
    id: 'shard_genesis',
    name: 'Genesis',
    region: 'EU-West',
    status: 'online',
    population: 847,
    maxPopulation: 2000,
    ping: 35,
    economyMultiplier: 1.0,
    xpMultiplier: 1.0,
    isPvP: false,
    isHardcore: false,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 год назад
    description: 'Стабильный сервер для новичков. Идеально для изучения механик.',
    features: ['Защита новичков', 'Обучающие квесты', 'Дружелюбное сообщество']
  },
  {
    id: 'shard_cyberia',
    name: 'Cyberia',
    region: 'RU-Moscow',
    status: 'online',
    population: 1245,
    maxPopulation: 1500,
    ping: 15,
    economyMultiplier: 1.2,
    xpMultiplier: 1.1,
    isPvP: true,
    isHardcore: false,
    createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    description: 'Главный русскоязычный сервер. Усиленная экономика и PvP.',
    features: ['PvP арены', 'Усиленная экономика +20%', 'Турниры']
  },
  {
    id: 'shard_neon_district',
    name: 'Neon District',
    region: 'US-East',
    status: 'online',
    population: 632,
    maxPopulation: 1000,
    ping: 120,
    economyMultiplier: 0.9,
    xpMultiplier: 1.5,
    isPvP: false,
    isHardcore: false,
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    description: 'Ускоренная прокачка. Идеально для быстрого старта.',
    features: ['XP бонус +50%', 'Быстрые проекты', 'Недельные ивенты']
  },
  {
    id: 'shard_dark_web',
    name: 'Dark Web',
    region: 'EU-East',
    status: 'online',
    population: 412,
    maxPopulation: 500,
    ping: 45,
    economyMultiplier: 2.0,
    xpMultiplier: 0.8,
    isPvP: true,
    isHardcore: true,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    description: '⚠️ ХАРДКОР. Двойная экономика, но смерть = потеря 50% денег.',
    features: ['Экономика x2', 'Хардкор режим', 'Криминальный контент', 'Войны корпораций']
  },
  {
    id: 'shard_quantum',
    name: 'Quantum',
    region: 'Asia-Pacific',
    status: 'online',
    population: 289,
    maxPopulation: 800,
    ping: 180,
    economyMultiplier: 1.1,
    xpMultiplier: 1.3,
    isPvP: false,
    isHardcore: false,
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    description: 'Технологический сервер. Бонусы к крафту и исследованиям.',
    features: ['Крафт бонус +30%', 'Уникальные чертежи', 'Научное сообщество']
  },
  {
    id: 'shard_sandbox',
    name: 'Sandbox (BETA)',
    region: 'EU-West',
    status: 'maintenance',
    population: 0,
    maxPopulation: 100,
    ping: 50,
    economyMultiplier: 5.0,
    xpMultiplier: 10.0,
    isPvP: true,
    isHardcore: false,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    description: '🧪 Тестовый сервер. Всё усилено. Может быть нестабилен.',
    features: ['XP x10', 'Экономика x5', 'Новые фичи', 'Может вайпнуться']
  }
];

// === СЕРВИС ===

class ShardService {
  private shards: Shard[] = [...INITIAL_SHARDS];
  private currentSelection: ShardSelection | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Загружаем выбранный шард из IndexedDB
      const saved = await dbService.get<ShardSelection>('shards', 'current_selection');
      if (saved) {
        this.currentSelection = saved;
      }
      this.initialized = true;
    } catch (error) {
      console.warn('[ShardService] Init failed:', error);
      this.initialized = true;
    }
  }

  /**
   * Получить список всех шардов
   */
  getShards(): Shard[] {
    return this.shards.map(s => ({
      ...s,
      // Симуляция изменения пинга и населения
      ping: s.ping + Math.floor(Math.random() * 20 - 10),
      population: Math.min(s.maxPopulation, Math.max(0, s.population + Math.floor(Math.random() * 50 - 25)))
    }));
  }

  /**
   * Получить шард по ID
   */
  getShard(id: string): Shard | undefined {
    return this.shards.find(s => s.id === id);
  }

  /**
   * Получить текущий выбранный шард
   */
  getCurrentSelection(): ShardSelection | null {
    return this.currentSelection;
  }

  /**
   * Получить текущий шард (объект)
   */
  getCurrentShard(): Shard | undefined {
    if (!this.currentSelection) return undefined;
    return this.getShard(this.currentSelection.shardId);
  }

  /**
   * Выбрать шард
   */
  async selectShard(shardId: string, characterName?: string): Promise<boolean> {
    const shard = this.getShard(shardId);
    if (!shard) {
      console.error('[ShardService] Shard not found:', shardId);
      return false;
    }

    if (shard.status !== 'online') {
      console.error('[ShardService] Shard is not online:', shard.status);
      return false;
    }

    if (shard.population >= shard.maxPopulation) {
      console.error('[ShardService] Shard is full');
      return false;
    }

    const selection: ShardSelection = {
      shardId,
      selectedAt: Date.now(),
      characterName
    };

    try {
      await dbService.add('shards', { id: 'current_selection', ...selection });
      this.currentSelection = selection;
      return true;
    } catch (error) {
      console.error('[ShardService] Failed to save selection:', error);
      return false;
    }
  }

  /**
   * Очистить выбор шарда (при выходе/перезапуске)
   */
  async clearSelection(): Promise<void> {
    try {
      await dbService.delete('shards', 'current_selection');
      this.currentSelection = null;
    } catch (error) {
      console.warn('[ShardService] Failed to clear selection:', error);
    }
  }

  /**
   * Проверить, выбран ли шард
   */
  hasSelectedShard(): boolean {
    return this.currentSelection !== null;
  }

  /**
   * Получить мультипликаторы текущего шарда
   */
  getMultipliers(): { economy: number; xp: number } {
    const shard = this.getCurrentShard();
    if (!shard) {
      return { economy: 1.0, xp: 1.0 };
    }
    return {
      economy: shard.economyMultiplier,
      xp: shard.xpMultiplier
    };
  }

  /**
   * Получить статус региона (для UI)
   */
  getRegionEmoji(region: ShardRegion): string {
    const emojis: Record<ShardRegion, string> = {
      'EU-West': '🇪🇺',
      'EU-East': '🇪🇺',
      'US-East': '🇺🇸',
      'US-West': '🇺🇸',
      'Asia-Pacific': '🌏',
      'RU-Moscow': '🇷🇺',
      'RU-SPb': '🇷🇺'
    };
    return emojis[region] || '🌐';
  }

  /**
   * Получить цвет статуса
   */
  getStatusColor(status: ShardStatus): string {
    const colors: Record<ShardStatus, string> = {
      'online': '#4ade80',      // Зелёный
      'maintenance': '#fbbf24', // Жёлтый
      'full': '#f97316',        // Оранжевый
      'offline': '#ef4444'      // Красный
    };
    return colors[status] || '#9ca3af';
  }

  /**
   * Получить текст статуса на русском
   */
  getStatusText(status: ShardStatus): string {
    const texts: Record<ShardStatus, string> = {
      'online': 'Онлайн',
      'maintenance': 'Техработы',
      'full': 'Переполнен',
      'offline': 'Оффлайн'
    };
    return texts[status] || status;
  }

  /**
   * Получить класс для пинга
   */
  getPingClass(ping: number): string {
    if (ping < 50) return 'text-green-400';
    if (ping < 100) return 'text-yellow-400';
    if (ping < 150) return 'text-orange-400';
    return 'text-red-400';
  }
}

export const shardService = new ShardService();
