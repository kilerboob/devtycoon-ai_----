export enum SkillLevel {
  INTERN = 'Стажер',
  JUNIOR = 'Junior',
  MIDDLE = 'Middle',
  SENIOR = 'Senior',
  LEAD = 'Team Lead',
  ARCHITECT = 'System Architect',
  CTO = 'CTO'
}

export type ProgrammingLanguage = 'javascript' | 'python' | 'cpp' | 'rust' | 'go' | 'sql' | 'lua';
export type Language = 'en' | 'ru' | 'uk';

export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'ai' | 'warn';
  timestamp: number;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  type: 'web' | 'mobile' | 'game' | 'ai';
  minLevel: SkillLevel;
  difficulty: number;
  linesNeeded: number;
  baseRevenue: number; // Passive income per day
}

export interface ActiveProject extends ProjectTemplate {
  progress: number; // 0 to linesNeeded
  bugs: number;
  stage: 'dev' | 'polish' | 'released';
  releasedAt?: number;
}

export type Project = ActiveProject;

export interface Quest {
  id: number;
  title: string;
  description: string;
  story: string;
  task: string;
  solutionRegex: RegExp;
  rewardMoney: number;
  rewardExp: number;
  hint: string;
  explanation: string;
}

export type HardwareType = 'case' | 'monitor' | 'keyboard' | 'mouse' | 'mousepad' | 'decor' | 'cpu' | 'gpu' | 'ram' | 'storage' | 'wall' | 'poster' | 'cooler' | 'chair' | 'desk' | 'window' | 'headphones' | 'speakers';

export interface HardwareItem {
  id: string;
  type: HardwareType;
  name: string;
  cost: number; // Price in USD
  shadowCost?: number; // Price in ShadowCredits (if illegal)
  description: string;
  visualClass: string;

  // AAA Economy Stats
  isIllegal?: boolean;
  isStolen?: boolean; // Default state when bought from DarkHub
  traceSignature?: number; // 0-100 Risk factor
  heatOutput?: number; // Watts
  resaleValue?: number; // Estimated CyberBay price
  rarity?: 'common' | 'uncommon' | 'rare' | 'prototype' | 'legendary';
  storageCap?: number; // Capacity in GB (for storage items)

  effect: {
    type: 'click_power' | 'auto_code' | 'luck' | 'bug_resist' | 'heat' | 'cooling' | 'comfort' | 'sound';
    value: number;
  };
}

// Instance of an item owned by the player
export interface InventoryItem {
  uid: string;      // Unique Instance ID (UUID)
  itemId: string;   // Reference to HardwareItem.id
  isStolen: boolean;
  durability: number; // 0-100
}

export interface Message {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: number;
  isRead: boolean;
  replies?: { text: string; action: () => void }[];
}

// --- ONLINE / CHAT TYPES ---
export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  channel: 'general' | 'trade' | 'shadow_net';
  timestamp: number;
  isSystem?: boolean;
  isMe?: boolean;
}

export type ServerRegion = 'US-East' | 'EU-West' | 'Asia-Pacific' | 'RU-Moscow';

export interface OnlineProfile {
  username: string;
  level: number;
  rank: number;
}

// --- VISUAL SCRIPTING TYPES ---
export type VisualNodeType =
  | 'event_start'
  | 'event_click'
  | 'action_alert'
  | 'action_log'
  | 'action_spawn'
  | 'action_move'
  | 'action_sound'
  | 'var_set'
  | 'var_get'
  | 'math_add'
  | 'math_sub'
  | 'logic_if'
  | 'logic_timer'
  | 'logic_loop'
  | 'io_print'
  | 'io_input'
  | 'ui_button'
  | 'ui_input'
  | 'ui_text';

export interface GraphNode {
  id: string;
  type: VisualNodeType;
  x: number;
  y: number;
  data: {
    label?: string;
    value?: string | number;
    color?: string;
    variableName?: string;
    elementID?: string; // For UI elements
    operator?: string; // >, <, ==
  };
}

export interface GraphConnection {
  id: string;
  fromNode: string;
  toNode: string;
  sourceHandle?: string; // 'output', 'true', 'false', 'flow', 'click'
}

export interface UserApp {
  id: string;
  name: string;
  domain?: string; // e.g. "casino" -> ang://casino
  icon: string; // Emoji char
  code: string; // HTML/JS content
  createdAt: number;
  visualGraph?: { nodes: GraphNode[], connections: GraphConnection[] };

  // New Economy Stats
  trafficStats?: {
    dailyVisitors: number;
    totalRevenue: number;
  };
}

export interface SkillPerk {
  id: string;
  name: string;
  cost: number; // Reputation cost
  description: string;
  icon: string;
  effect: {
    type: 'energy_save' | 'passive_income' | 'bug_reduction' | 'click_boost' | 'xp_boost';
    value: number;
  };
}

// --- FILE SYSTEM TYPES ---
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string; // Only for files
  language?: ProgrammingLanguage;
  children?: FileNode[]; // Only for folders
  createdAt: number;
}

// --- DESKTOP ITEM ---
export interface DesktopItem {
  id: string;
  type: 'app' | 'folder';
  x: number;
  y: number;
  title: string;
  icon: string;
  appId?: string; // If type is app
  children?: DesktopItem[]; // If type is folder
}

// --- BANKING TYPES ---
export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: number; // Day number
  isPaid: boolean;
  type: 'electricity' | 'internet' | 'server' | 'fine';
}

export interface BankTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: number; // Timestamp
}

// --- LIVING WORLD TYPES ---
export interface NewsArticle {
  id: string;
  headline: string;
  content: string;
  category: 'HARDWARE' | 'CRYPTO' | 'SECURITY' | 'WORLD' | 'TECH' | 'FINANCE';
  impact: 'inflation' | 'deflation' | 'neutral';
  targetType?: string; // e.g. 'gpu', 'cpu'
  timestamp: number;
}

export interface Email {
  id: string;
  sender: string;
  subject: string;
  body: string;
  type: 'job' | 'spam' | 'bill' | 'story' | 'system' | 'threat';
  isRead: boolean;
  timestamp: number;
  reward?: number;
}

// --- NOTIFICATION SYSTEM ---
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement';
  title: string;
  message: string;
  icon?: string; // Emoji
  timestamp: number;
  duration?: number; // Auto-dismiss time in ms (default 5000)
}

// --- ACHIEVEMENT SYSTEM ---
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji
  category: 'economy' | 'coding' | 'hacking' | 'hardware' | 'story';
  condition: (state: GameState) => boolean; // Check function
  reward?: {
    money?: number;
    reputation?: number;
    shadowCredits?: number;
  };
  hidden?: boolean; // Don't show until unlocked
}


export interface GameState {
  language: Language;
  username: string;
  serverRegion?: ServerRegion;
  money: number;
  shadowCredits: number; // New: DarkHub Currency
  reputation: number;
  linesOfCode: number;
  bugs: number;
  level: SkillLevel;

  // LAYER 8: Player Role & Tier
  playerRole?: PlayerRole;
  playerTier: PlayerTier;

  // LAYER 5: Corporation Reputation
  corporationReps: CorporationReputation[];

  // LAYER 7: Blueprints owned
  blueprints: Blueprint[];

  clickPower: number;
  autoCodePerSecond: number;
  bugChance: number;

  energy: number;
  timeOfDay: number;
  day: number;
  temperature: number;

  // Economy State
  globalHeat: number; // 0-100, affects ShadowCredit exchange rate
  tracePercent: number; // 0-100, risk of raid
  marketTrends?: Record<string, number>; // Maps HardwareType to price multiplier

  // Banking State
  bills: Bill[];
  transactions: BankTransaction[];
  loanDebt: number;
  creditScore: number; // 300-850

  // Living World
  news: NewsArticle[];
  emails: Email[];

  // Signal & Access
  signalEndTime?: number; // Timestamp when signal disappears
  shadowAccessExpiry?: number; // Timestamp when DarkHub access is revoked

  currentQuestIndex: number;
  isShadowMarketUnlocked: boolean;

  activeProject: ActiveProject | null;
  releasedProjects: ActiveProject[];
  userApps: UserApp[];
  unlockedPerks: string[];

  // File System
  fileSystem: FileNode; // Root node

  inventory: InventoryItem[]; // Changed from string[] to InventoryItem[]

  // Equipped slots now hold the UID of the item, not the itemId
  equipped: {
    case: string;
    monitor: string;
    keyboard: string;
    mouse: string;
    mousepad: string;
    decor: string;
    cpu: string;
    gpu: string;
    ram: string;
    storage: string;
    cooler: string;

    wall: string;
    poster: string;
    desk: string;
    chair: string;
    window: string;
    headphones: string;
    speakers: string;
  };
  hasUnreadMessages: boolean;
  isGameWon: boolean;

  // Notification \u0026 Achievement System
  notifications: Notification[];
  unlockedAchievements: string[]; // Achievement IDs
}

export type AppId = 'ide' | 'browser' | 'messenger' | 'video' | 'projects' | 'skills' | 'music' | 'chat' | 'leaderboard' | 'storage' | 'settings' | 'bank' | 'devfs' | 'blueprints' | 'corporations' | 'profile' | string;

// LAYER 1: DevFS Types
export interface DevFile {
  id: string;
  name: string;
  content: string;
  type: 'file';
  parentId: string | null; // ID of the parent folder
  createdAt: number;
  updatedAt: number;
}

export interface DevFolder {
  id: string;
  name:string;
  type: 'folder';
  parentId: string | null; // ID of the parent folder
  createdAt: number;
  updatedAt: number;
}

export type DevFSEntry = DevFile | DevFolder;

// DevFS Versioning
export interface DevFSVersion {
  id: string; // uuid
  filePath: string; // path of the file the version belongs to
  timestamp: number; // when version was captured
  content: string; // previous content snapshot
  reason?: string; // optional reason like 'update' | 'manual-rollback'
}

// ============================================
// LAYER 5: Corporations
// ============================================
export type CorporationId = 'titan' | 'novatek' | 'cyberforge' | 'blacksun' | 'orbitron';

export interface Corporation {
  id: CorporationId;
  name: string;
  logo: string; // Emoji
  color: string; // Brand color (hex)
  description: string;
  specialty: string; // What they're known for
  headquarters: string; // Location
  ceo: string; // NPC name
  influence: number; // 0-100 global influence
  isEvil?: boolean; // For lore
}

export interface CorporationReputation {
  corporationId: CorporationId;
  reputation: number; // -100 to +100
  rank: 'враг' | 'нейтрал' | 'знакомый' | 'партнёр' | 'союзник' | 'элита';
  totalContracts: number;
  lastInteraction: number; // timestamp
}

// ============================================
// LAYER 7: Blueprint System
// ============================================
export type BlueprintType = 'cpu' | 'gpu' | 'ram' | 'ssd' | 'cooler' | 'case' | 'ai-core' | 'quantum-node' | 'neural-chip';

export type BlueprintTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';

export interface Blueprint {
  id: string;
  name: string;
  type: BlueprintType;
  tier: BlueprintTier;
  rarity: 'common' | 'advanced' | 'rare' | 'prototype' | 'legendary' | 'experimental';
  
  // Source info
  source: 'market' | 'lab' | 'crafted' | 'stolen' | 'reward';
  corporationId?: CorporationId; // Which corp made it
  
  // Stats
  stats: {
    power: number; // Performance boost
    efficiency: number; // Power consumption
    durability: number; // How long it lasts
    complexity: number; // Skill required to craft
  };
  
  // Crafting requirements
  craftingCost: {
    money: number;
    shadowCredits?: number;
    materials?: string[]; // Other blueprint IDs needed
    skillRequired: SkillLevel;
  };
  
  // Market value
  marketValue: number;
  darkHubValue: number;
  
  // Metadata
  description: string;
  icon: string; // Emoji
  isStolen?: boolean;
  unlockedAt?: number; // When player got it
}

// ============================================
// LAYER 8: Player Roles
// ============================================
export type PlayerRole = 'programmer' | 'engineer' | 'hacker' | 'security' | 'trader';

export interface PlayerRoleInfo {
  id: PlayerRole;
  name: string;
  icon: string;
  color: string;
  description: string;
  bonuses: {
    type: 'coding_speed' | 'hardware_discount' | 'hack_power' | 'defense' | 'trade_bonus';
    value: number;
    description: string;
  }[];
  startingPerks: string[]; // Skill IDs unlocked at start
  preferredCorporations: CorporationId[];
}

// ============================================
// LAYER 9: Player Tiers (Career)
// ============================================
export type PlayerTier = 'trainee' | 'junior' | 'middle' | 'senior' | 'architect';

export interface PlayerTierInfo {
  id: PlayerTier;
  name: string;
  minReputation: number;
  benefits: string[];
  icon: string;
}