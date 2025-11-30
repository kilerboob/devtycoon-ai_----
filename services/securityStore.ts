/**
 * LAYER 15: Security Store Service
 * Управление безопасностью DeVOS
 * Firewall, IDS, Honeypots, Security Events
 */

// Уровни защиты файрвола
export type FirewallLevel = 'OFF' | 'BASIC' | 'STRONG' | 'CORPORATE';

// Типы угроз
export type ThreatType = 
  | 'hack_attempt'      // Попытка взлома
  | 'virus_detected'    // Вирус обнаружен
  | 'intrusion'         // Вторжение
  | 'ddos_attack'       // DDoS атака
  | 'data_breach'       // Утечка данных
  | 'honeypot_triggered' // Ловушка активирована
  | 'suspicious_activity' // Подозрительная активность
  | 'malware'           // Вредоносное ПО
  | 'brute_force'       // Брутфорс атака
  | 'phishing';         // Фишинг

// Уровень опасности угрозы
export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

// Статус угрозы
export type ThreatStatus = 'detected' | 'blocked' | 'analyzing' | 'resolved' | 'active';

// Интерфейс события безопасности
export interface SecurityEvent {
  id: string;
  type: ThreatType;
  severity: ThreatSeverity;
  status: ThreatStatus;
  timestamp: number;
  sourceId?: string;      // ID атакующего (игрок, NPC, корпорация)
  sourceName?: string;    // Имя атакующего
  targetPath?: string;    // Путь к атакованному ресурсу
  description: string;
  blocked: boolean;
  damageDealt?: number;   // Урон если не заблокировано
  honeypotId?: string;    // ID ловушки если активирована
}

// Конфигурация ловушки (honeypot)
export interface Honeypot {
  id: string;
  name: string;
  type: 'folder' | 'lab' | 'blueprint' | 'file' | 'server';
  path?: string;          // Путь в DevFS если это файл/папка
  isActive: boolean;
  triggeredCount: number;
  lastTriggered?: number;
  rewards: {
    reputation: number;   // Репутация за поимку хакера
    intel: number;        // Интел о хакере
  };
}

// Настройки IDS (Intrusion Detection System)
export interface IDSConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high' | 'paranoid';
  autoBlock: boolean;           // Автоматическая блокировка
  notifyOnDetection: boolean;   // Уведомления при обнаружении
  logRetentionDays: number;     // Сколько дней хранить логи
  whitelistedIds: string[];     // ID игроков в белом списке
  blacklistedIds: string[];     // ID заблокированных игроков
}

// Главное состояние безопасности
export interface SecurityState {
  firewallLevel: FirewallLevel;
  firewallEnabled: boolean;
  idsConfig: IDSConfig;
  events: SecurityEvent[];
  honeypots: Honeypot[];
  threatLevel: number;          // 0-100 общий уровень угрозы
  blockedAttacks: number;       // Всего заблокировано атак
  successfulBreaches: number;   // Успешных взломов (прошли защиту)
  lastScanTime: number;
  isUnderAttack: boolean;
  activeThreats: number;
}

// Конфигурация уровней файрвола
const FIREWALL_CONFIG: Record<FirewallLevel, {
  blockRate: number;        // Шанс блокировки (0-1)
  detectRate: number;       // Шанс обнаружения (0-1)
  energyCost: number;       // Расход энергии в час
  moneyCost: number;        // Стоимость в час
  description: string;
}> = {
  OFF: {
    blockRate: 0,
    detectRate: 0.1,
    energyCost: 0,
    moneyCost: 0,
    description: 'Защита отключена. Вы полностью уязвимы.'
  },
  BASIC: {
    blockRate: 0.3,
    detectRate: 0.5,
    energyCost: 1,
    moneyCost: 10,
    description: 'Базовая защита. Блокирует простые атаки.'
  },
  STRONG: {
    blockRate: 0.7,
    detectRate: 0.85,
    energyCost: 3,
    moneyCost: 50,
    description: 'Усиленная защита. Эффективна против большинства угроз.'
  },
  CORPORATE: {
    blockRate: 0.95,
    detectRate: 0.99,
    energyCost: 10,
    moneyCost: 200,
    description: 'Корпоративный уровень. Максимальная безопасность.'
  }
};

// Дефолтное состояние безопасности
const DEFAULT_SECURITY_STATE: SecurityState = {
  firewallLevel: 'BASIC',
  firewallEnabled: true,
  idsConfig: {
    enabled: true,
    sensitivity: 'medium',
    autoBlock: true,
    notifyOnDetection: true,
    logRetentionDays: 30,
    whitelistedIds: [],
    blacklistedIds: []
  },
  events: [],
  honeypots: [],
  threatLevel: 0,
  blockedAttacks: 0,
  successfulBreaches: 0,
  lastScanTime: Date.now(),
  isUnderAttack: false,
  activeThreats: 0
};

// Дефолтные ловушки
const DEFAULT_HONEYPOTS: Honeypot[] = [
  {
    id: 'hp_secret_folder',
    name: 'TOP_SECRET_DATA',
    type: 'folder',
    path: '/system/TOP_SECRET_DATA',
    isActive: true,
    triggeredCount: 0,
    rewards: { reputation: 50, intel: 25 }
  },
  {
    id: 'hp_fake_lab',
    name: 'Quantum Research Lab X',
    type: 'lab',
    isActive: true,
    triggeredCount: 0,
    rewards: { reputation: 100, intel: 50 }
  },
  {
    id: 'hp_fake_blueprint',
    name: 'Neural Interface v3.0',
    type: 'blueprint',
    isActive: true,
    triggeredCount: 0,
    rewards: { reputation: 75, intel: 40 }
  },
  {
    id: 'hp_admin_creds',
    name: 'admin_credentials.txt',
    type: 'file',
    path: '/config/admin_credentials.txt',
    isActive: true,
    triggeredCount: 0,
    rewards: { reputation: 60, intel: 30 }
  }
];

class SecurityStore {
  private state: SecurityState;
  private listeners: Set<(state: SecurityState) => void> = new Set();

  constructor() {
    this.state = {
      ...DEFAULT_SECURITY_STATE,
      honeypots: [...DEFAULT_HONEYPOTS]
    };
  }

  // Получить текущее состояние
  getState(): SecurityState {
    return { ...this.state };
  }

  // Подписка на изменения
  subscribe(listener: (state: SecurityState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(l => l(this.getState()));
  }

  // Получить конфиг уровня файрвола
  getFirewallConfig(level?: FirewallLevel) {
    return FIREWALL_CONFIG[level || this.state.firewallLevel];
  }

  // Установить уровень файрвола
  setFirewallLevel(level: FirewallLevel): void {
    this.state.firewallLevel = level;
    this.notify();
  }

  // Включить/выключить файрвол
  toggleFirewall(enabled: boolean): void {
    this.state.firewallEnabled = enabled;
    this.notify();
  }

  // Обновить конфиг IDS
  updateIDSConfig(config: Partial<IDSConfig>): void {
    this.state.idsConfig = { ...this.state.idsConfig, ...config };
    this.notify();
  }

  // Проверить входящий пакет/событие на угрозу
  checkIncomingThreat(
    type: ThreatType,
    severity: ThreatSeverity,
    sourceId?: string,
    sourceName?: string,
    targetPath?: string
  ): { blocked: boolean; detected: boolean; event: SecurityEvent } {
    const config = this.getFirewallConfig();
    const idsConfig = this.state.idsConfig;

    // Базовые шансы
    let blockChance = this.state.firewallEnabled ? config.blockRate : 0;
    let detectChance = idsConfig.enabled ? config.detectRate : 0.1;

    // Модификаторы по чувствительности IDS
    const sensitivityMod: Record<string, number> = {
      low: 0.8,
      medium: 1.0,
      high: 1.2,
      paranoid: 1.5
    };
    detectChance *= sensitivityMod[idsConfig.sensitivity];

    // Модификаторы по серьёзности угрозы
    const severityMod: Record<ThreatSeverity, number> = {
      low: 1.2,
      medium: 1.0,
      high: 0.8,
      critical: 0.6
    };
    blockChance *= severityMod[severity];

    // Белый/чёрный список
    if (sourceId && idsConfig.whitelistedIds.includes(sourceId)) {
      blockChance = 0;
    }
    if (sourceId && idsConfig.blacklistedIds.includes(sourceId)) {
      blockChance = 1;
      detectChance = 1;
    }

    const detected = Math.random() < detectChance;
    const blocked = detected && (idsConfig.autoBlock || Math.random() < blockChance);

    // Создаём событие
    const event: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      severity,
      status: blocked ? 'blocked' : detected ? 'detected' : 'active',
      timestamp: Date.now(),
      sourceId,
      sourceName,
      targetPath,
      description: this.generateEventDescription(type, severity, sourceName, targetPath),
      blocked,
      damageDealt: blocked ? 0 : this.calculateDamage(severity)
    };

    // Обновляем состояние
    this.state.events.unshift(event);
    if (this.state.events.length > 100) {
      this.state.events = this.state.events.slice(0, 100); // Храним последние 100
    }

    if (blocked) {
      this.state.blockedAttacks++;
    } else if (detected) {
      this.state.successfulBreaches++;
    }

    this.state.activeThreats = this.state.events.filter(e => e.status === 'active').length;
    this.state.isUnderAttack = this.state.activeThreats > 0;
    this.state.threatLevel = Math.min(100, this.state.activeThreats * 20 + (blocked ? 0 : severity === 'critical' ? 40 : severity === 'high' ? 25 : 10));

    this.notify();

    return { blocked, detected, event };
  }

  // Генерация описания события
  private generateEventDescription(
    type: ThreatType,
    severity: ThreatSeverity,
    sourceName?: string,
    targetPath?: string
  ): string {
    const source = sourceName || 'Неизвестный источник';
    const target = targetPath ? ` на ${targetPath}` : '';
    
    const descriptions: Record<ThreatType, string> = {
      hack_attempt: `Попытка взлома от ${source}${target}`,
      virus_detected: `Обнаружен вирус${target}. Источник: ${source}`,
      intrusion: `Несанкционированный доступ от ${source}${target}`,
      ddos_attack: `DDoS атака от ${source}. Серверы перегружены`,
      data_breach: `Утечка данных${target}. Атакующий: ${source}`,
      honeypot_triggered: `Ловушка активирована! ${source} попался${target}`,
      suspicious_activity: `Подозрительная активность от ${source}${target}`,
      malware: `Вредоносное ПО обнаружено${target}`,
      brute_force: `Брутфорс атака на систему от ${source}`,
      phishing: `Фишинговая атака от ${source}`
    };

    return `[${severity.toUpperCase()}] ${descriptions[type]}`;
  }

  // Расчёт урона от угрозы
  private calculateDamage(severity: ThreatSeverity): number {
    const baseDamage: Record<ThreatSeverity, number> = {
      low: 5,
      medium: 15,
      high: 30,
      critical: 50
    };
    return baseDamage[severity] + Math.floor(Math.random() * 10);
  }

  // Активировать ловушку
  triggerHoneypot(
    honeypotId: string,
    attackerId: string,
    attackerName: string
  ): { success: boolean; honeypot?: Honeypot; event?: SecurityEvent } {
    const honeypot = this.state.honeypots.find(h => h.id === honeypotId);
    if (!honeypot || !honeypot.isActive) {
      return { success: false };
    }

    honeypot.triggeredCount++;
    honeypot.lastTriggered = Date.now();

    // Создаём событие ловушки
    const { event } = this.checkIncomingThreat(
      'honeypot_triggered',
      'high',
      attackerId,
      attackerName,
      honeypot.path
    );

    if (event) {
      event.honeypotId = honeypotId;
    }

    // Добавляем в чёрный список
    if (!this.state.idsConfig.blacklistedIds.includes(attackerId)) {
      this.state.idsConfig.blacklistedIds.push(attackerId);
    }

    this.notify();

    return { success: true, honeypot, event };
  }

  // Добавить ловушку
  addHoneypot(honeypot: Omit<Honeypot, 'id' | 'triggeredCount'>): Honeypot {
    const newHoneypot: Honeypot = {
      ...honeypot,
      id: `hp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      triggeredCount: 0
    };
    this.state.honeypots.push(newHoneypot);
    this.notify();
    return newHoneypot;
  }

  // Удалить ловушку
  removeHoneypot(id: string): boolean {
    const index = this.state.honeypots.findIndex(h => h.id === id);
    if (index === -1) return false;
    this.state.honeypots.splice(index, 1);
    this.notify();
    return true;
  }

  // Разрешить угрозу
  resolveEvent(eventId: string): void {
    const event = this.state.events.find(e => e.id === eventId);
    if (event) {
      event.status = 'resolved';
      this.state.activeThreats = this.state.events.filter(e => e.status === 'active').length;
      this.state.isUnderAttack = this.state.activeThreats > 0;
      this.state.threatLevel = Math.max(0, this.state.threatLevel - 20);
      this.notify();
    }
  }

  // Очистить старые события
  clearOldEvents(maxAgeDays: number = 30): number {
    const cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    const initialLength = this.state.events.length;
    this.state.events = this.state.events.filter(e => e.timestamp > cutoff);
    this.notify();
    return initialLength - this.state.events.length;
  }

  // Сканирование системы
  runSecurityScan(): { threats: SecurityEvent[]; cleanStatus: boolean } {
    this.state.lastScanTime = Date.now();
    const activeThreats = this.state.events.filter(e => e.status === 'active' || e.status === 'detected');
    this.notify();
    return {
      threats: activeThreats,
      cleanStatus: activeThreats.length === 0
    };
  }

  // Получить статистику
  getStats() {
    return {
      totalEvents: this.state.events.length,
      blockedAttacks: this.state.blockedAttacks,
      successfulBreaches: this.state.successfulBreaches,
      activeThreats: this.state.activeThreats,
      threatLevel: this.state.threatLevel,
      honeypotTriggered: this.state.honeypots.reduce((sum, h) => sum + h.triggeredCount, 0),
      blockRate: this.state.blockedAttacks > 0 
        ? (this.state.blockedAttacks / (this.state.blockedAttacks + this.state.successfulBreaches) * 100).toFixed(1)
        : '100'
    };
  }

  // Сохранить состояние
  saveState(): SecurityState {
    return this.getState();
  }

  // Загрузить состояние
  loadState(state: Partial<SecurityState>): void {
    this.state = {
      ...DEFAULT_SECURITY_STATE,
      ...state,
      honeypots: state.honeypots || [...DEFAULT_HONEYPOTS]
    };
    this.notify();
  }

  // Сбросить к дефолту
  reset(): void {
    this.state = {
      ...DEFAULT_SECURITY_STATE,
      honeypots: [...DEFAULT_HONEYPOTS]
    };
    this.notify();
  }
}

// Синглтон
export const securityStore = new SecurityStore();
export default securityStore;
