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
  
  // LAYER 5+: Corporation Membership & Social
  corpMembership?: CorpMembership; // Active corporation membership (can only be member of one)
  activeCorpQuests: CorpQuest[]; // Currently active corp quests
  completedCorpQuests: string[]; // IDs of completed quests

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

  // LAYER 0: Desktop Layout Persistence
  desktopLayout?: DesktopItem[]; // Saved icon positions

  // LAYER 28: ANG Vers Social State
  angVersState?: ANGVersState;
}

export type AppId = 'ide' | 'browser' | 'messenger' | 'video' | 'projects' | 'skills' | 'music' | 'chat' | 'leaderboard' | 'storage' | 'settings' | 'bank' | 'devfs' | 'blueprints' | 'corporations' | 'tutorial' | 'journal' | 'profile' | 'social' | string;

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
// LAYER 28: ANG Vers (S-Tier)
// ============================================
export type CorporationId = 'titan' | 'novatek' | 'cyberforge' | 'blacksun' | 'orbitron' | 'ang_vers';

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
  tier?: CorporationTier; // S/A/B/C/D tier
}

export interface CorporationReputation {
  corporationId: CorporationId;
  reputation: number; // -100 to +100
  rank: 'враг' | 'нейтрал' | 'знакомый' | 'партнёр' | 'союзник' | 'элита';
  totalContracts: number;
  lastInteraction: number; // timestamp
}

// ============================================
// LAYER 5+: Corporation Membership & Social System
// ============================================
export type CorpMemberRank = 'recruit' | 'member' | 'specialist' | 'manager' | 'director' | 'executive';

export interface CorpMembership {
  corporationId: CorporationId;
  joinedAt: number; // timestamp
  rank: CorpMemberRank;
  xp: number; // XP within corporation
  monthlyDuesPaid: boolean;
  privileges: CorpPrivilege[];
  contributions: number; // Total contributions to corp
  questsCompleted: number;
  isActive: boolean;
}

export type CorpPrivilege = 
  | 'access_labs'           // Access to corporation labs
  | 'access_blueprints'     // Access to blueprint vault
  | 'access_ai_cores'       // Use AI cores
  | 'access_contracts'      // Take contracts
  | 'access_exclusive_shop' // Buy exclusive items
  | 'voting_rights'         // Vote on corp decisions
  | 'start_projects'        // Start corp research projects
  | 'manage_members'        // Manage lower rank members
  | 'war_participation'     // Participate in corp wars
  | 'dividend_share';       // Get share of corp profits

// Corporation Quest System
export type CorpQuestType = 'daily' | 'weekly' | 'story' | 'elite' | 'war';
export type CorpQuestStatus = 'available' | 'active' | 'completed' | 'failed' | 'expired';

export interface CorpQuestReward {
  money?: number;
  shadowCredits?: number;
  reputation?: number;
  xp?: number;
  blueprintId?: string;
  itemId?: string;
  privilege?: CorpPrivilege;
}

export interface CorpQuest {
  id: string;
  corporationId: CorporationId;
  type: CorpQuestType;
  title: string;
  description: string;
  icon: string;
  
  // Requirements
  requiredRank: CorpMemberRank;
  requiredReputation: number;
  requiredSkills?: { skillId: string; level: number }[];
  
  // Objectives
  objectives: {
    type: 'code_lines' | 'complete_projects' | 'earn_money' | 'craft_items' | 'hack_systems' | 'recruit_members' | 'sabotage' | 'defend' | 'custom';
    target: number;
    current: number;
    description: string;
  }[];
  
  // Rewards
  rewards: CorpQuestReward;
  bonusRewards?: CorpQuestReward; // For perfect completion
  
  // Timing
  expiresAt?: number; // For daily/weekly quests
  cooldown?: number; // Minutes until available again
  
  // Status
  status: CorpQuestStatus;
  startedAt?: number;
  completedAt?: number;
}

// Corporation Labs & Research
export type LabType = 'research' | 'manufacturing' | 'ai_development' | 'quantum' | 'cybersecurity';
export type LabTier = 1 | 2 | 3 | 4 | 5;

export interface CorpLab {
  id: string;
  corporationId: CorporationId;
  type: LabType;
  name: string;
  tier: LabTier;
  icon: string;
  
  // Capacity
  aiCores: AICore[];
  maxCores: number;
  blueprintVault: string[]; // Blueprint IDs stored here
  maxBlueprints: number;
  
  // Current research
  activeResearch?: ResearchProject;
  completedResearch: string[];
  
  // Stats
  efficiency: number; // 0-100
  securityLevel: number; // 0-100
  powerConsumption: number;
  
  // Access
  requiredRank: CorpMemberRank;
  isLocked: boolean;
}

export interface AICore {
  id: string;
  name: string;
  type: 'basic' | 'advanced' | 'quantum' | 'neural' | 'experimental';
  tier: BlueprintTier;
  power: number; // Processing power
  efficiency: number; // Energy efficiency
  specialization?: 'coding' | 'research' | 'security' | 'trading' | 'general';
  isActive: boolean;
  installedAt: number;
  corporationId: CorporationId;
}

export interface ResearchProject {
  id: string;
  labId: string;
  name: string;
  description: string;
  type: 'blueprint' | 'upgrade' | 'ai_improvement' | 'secret_tech' | 'weapon';
  
  // Progress
  progress: number; // 0-100
  totalTime: number; // Minutes to complete
  startedAt: number;
  
  // Requirements
  requiredCores: number;
  requiredBlueprints: string[];
  cost: { money: number; shadowCredits?: number };
  
  // Rewards
  rewardBlueprint?: Omit<Blueprint, 'id' | 'unlockedAt'>;
  rewardUpgrade?: { type: string; value: number };
  
  // Contributors
  contributors: { playerId: string; contribution: number }[];
}

// Corporation Wars & Competition
export type WarStatus = 'pending' | 'active' | 'ceasefire' | 'ended';
export type WarType = 'influence' | 'territory' | 'resource' | 'annihilation';

export interface CorpWar {
  id: string;
  type: WarType;
  status: WarStatus;
  
  // Combatants
  attackerId: CorporationId;
  defenderId: CorporationId;
  
  // Scores
  attackerScore: number;
  defenderScore: number;
  
  // Participants
  attackerMembers: string[];
  defenderMembers: string[];
  
  // Timeline
  declaredAt: number;
  startedAt?: number;
  endsAt?: number;
  
  // Stakes
  stakes: {
    territory?: string;
    influence?: number;
    blueprints?: string[];
    credits?: number;
  };
  
  // Events
  events: WarEvent[];
}

export interface WarEvent {
  id: string;
  warId: string;
  timestamp: number;
  type: 'attack' | 'defend' | 'sabotage' | 'hack' | 'steal' | 'recruit' | 'alliance';
  actorId: string; // Player ID
  actorCorp: CorporationId;
  targetCorp: CorporationId;
  points: number;
  description: string;
}

// Corporation Alliance System
export interface CorpAlliance {
  id: string;
  name: string;
  foundedAt: number;
  members: CorporationId[];
  leader: CorporationId;
  
  // Benefits
  sharedResearch: boolean;
  tradingBonus: number;
  defenseBonus: number;
  
  // Requirements
  minimumTier: CorporationTier;
  membershipFee: number;
}

// Extended Corporation Interface (full data)
export interface CorporationFull extends Corporation {
  // Membership
  memberCount: number;
  maxMembers: number;
  membershipFee: number; // Monthly dues
  recruitmentOpen: boolean;
  
  // Labs
  labs: CorpLab[];
  totalAICores: number;
  researchSpeed: number;
  
  // Quests
  activeQuests: CorpQuest[];
  questRefreshTime: number;
  
  // Wars
  activeWars: string[]; // War IDs
  warScore: number;
  warRank: number;
  
  // Economy
  treasury: number;
  weeklyIncome: number;
  dividendPool: number;
  
  // Alliance
  allianceId?: string;
  allies: CorporationId[];
  enemies: CorporationId[];
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

// ============================================
// LAYER 28: ANG Vers Social Corporation
// ============================================

// Corporation Tiers (S-Class = максимальный уровень влияния)
export type CorporationTier = 'D' | 'C' | 'B' | 'A' | 'S';

// Типы социальных связей
export type SocialConnectionType = 
  | 'friend' 
  | 'colleague' 
  | 'rival' 
  | 'enemy' 
  | 'blocked' 
  | 'guild_member' 
  | 'studio_partner' 
  | 'contractor' 
  | 'employer';

// Статус социального профиля
export type SocialStatus = 
  | 'active' 
  | 'suspended' 
  | 'banned' 
  | 'under_investigation' 
  | 'verified' 
  | 'elite';

// Социальный профиль игрока (управляется ANG Vers)
export interface SocialProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string; // Emoji or URL
  status: SocialStatus;
  
  // Рейтинги
  socialRating: number; // 0-1000 (общий социальный рейтинг)
  trustScore: number; // 0-100 (доверие системы)
  employerRating: number; // 1-5 stars
  freelancerRating: number; // 1-5 stars
  
  // Статистика
  totalConnections: number;
  contractsCompleted: number;
  contractsFailed: number;
  complaintsReceived: number;
  complaintsResolved: number;
  
  // Членство
  guildId?: string;
  studioId?: string;
  corporationAffiliations: string[]; // Corporation IDs
  
  // Безопасность
  verificationLevel: 0 | 1 | 2 | 3; // 0=none, 3=full KYC
  securityIncidents: number;
  lastSecurityScan: number;
  
  // Метаданные
  createdAt: number;
  lastActiveAt: number;
}

// Социальная связь между двумя профилями
export interface SocialConnection {
  id: string;
  fromProfileId: string;
  toProfileId: string;
  type: SocialConnectionType;
  strength: number; // 0-100 (сила связи)
  createdAt: number;
  lastInteraction: number;
  
  // Взаимные данные
  mutualGuilds: string[];
  mutualFriends: number;
  sharedContracts: number;
}

// Гильдия (управляется ANG Vers)
export interface Guild {
  id: string;
  name: string;
  tag: string; // Short tag like [ANG]
  logo: string; // Emoji
  type: 'hacker' | 'security' | 'trader' | 'developer' | 'engineer' | 'mixed';
  
  leaderId: string;
  memberIds: string[];
  maxMembers: number;
  
  // Статистика
  reputation: number;
  totalContracts: number;
  successRate: number;
  
  // Экономика
  treasury: number;
  weeklyIncome: number;
  
  // ANG Vers License
  license: 'basic' | 'standard' | 'premium' | 'elite';
  licenseExpiry: number;
  
  createdAt: number;
}

// Студия разработки (управляется ANG Vers)
export interface Studio {
  id: string;
  name: string;
  logo: string;
  ownerId: string;
  memberIds: string[];
  
  // Специализация
  specialization: 'games' | 'apps' | 'web' | 'ai' | 'security' | 'mixed';
  
  // Рейтинги
  clientRating: number; // 1-5
  projectsCompleted: number;
  projectsInProgress: number;
  
  // Финансы
  revenue: number;
  expenses: number;
  
  // Лицензия ANG Vers
  license: 'indie' | 'pro' | 'enterprise';
  verified: boolean;
  
  createdAt: number;
}

// Контракт на социальном рынке
export interface SocialContract {
  id: string;
  type: 'hire' | 'freelance' | 'collaboration' | 'guild_job' | 'studio_project';
  
  // Стороны
  clientId: string;
  contractorId?: string; // Может быть пустым если открыт
  
  // Детали
  title: string;
  description: string;
  requirements: string[];
  
  // Оплата
  payment: number;
  paymentType: 'fixed' | 'hourly' | 'revenue_share';
  escrowHeld: number; // Сколько заморожено в эскроу
  
  // Статус
  status: 'open' | 'in_progress' | 'completed' | 'disputed' | 'cancelled';
  
  // Сроки
  deadline: number;
  createdAt: number;
  completedAt?: number;
  
  // Рейтинг после завершения
  clientRating?: number;
  contractorRating?: number;
}

// Жалоба (обрабатывается ANG Vers)
export interface SocialComplaint {
  id: string;
  complainantId: string;
  defendantId: string;
  
  type: 'fraud' | 'harassment' | 'breach_of_contract' | 'theft' | 'spam' | 'other';
  description: string;
  evidence: string[]; // File IDs or logs
  
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  resolution?: string;
  penalty?: {
    type: 'warning' | 'fine' | 'suspension' | 'ban';
    amount?: number;
    duration?: number; // days
  };
  
  createdAt: number;
  resolvedAt?: number;
  arbitratorId?: string;
}

// Уведомление от ANG Vers
export interface SystemNotification {
  id: string;
  recipientId: string;
  
  type: 'info' | 'warning' | 'alert' | 'threat' | 'government' | 'corporate';
  priority: 'low' | 'normal' | 'high' | 'critical';
  
  title: string;
  message: string;
  
  // Источник
  source: 'ang_vers' | 'government' | 'corporation' | 'guild' | 'npc' | 'system';
  sourceId?: string;
  
  // Действия
  actions?: {
    label: string;
    action: string; // Action ID
  }[];
  
  isRead: boolean;
  createdAt: number;
  expiresAt?: number;
}

// Социальный рынок услуг
export interface MarketListing {
  id: string;
  sellerId: string;
  
  type: 'service' | 'product' | 'contract' | 'membership';
  category: 'development' | 'design' | 'security' | 'hacking' | 'consulting' | 'other';
  
  title: string;
  description: string;
  
  price: number;
  priceType: 'fixed' | 'negotiable' | 'auction';
  currency: 'usd' | 'shadow_credits';
  
  // Для услуг
  deliveryTime?: number; // days
  revisions?: number;
  
  // Статистика
  views: number;
  purchases: number;
  rating: number;
  
  isActive: boolean;
  isFeatured: boolean; // Продвижение через ANG Vers
  
  createdAt: number;
}

// Угроза от NPC (логируется ANG Vers)
export interface ThreatLog {
  id: string;
  targetId: string;
  sourceNpcId: string;
  
  type: 'warning' | 'threat' | 'blackmail' | 'ultimatum' | 'attack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  message: string;
  demands?: string;
  deadline?: number;
  
  status: 'active' | 'resolved' | 'escalated' | 'ignored';
  reportedToSecurity: boolean;
  
  createdAt: number;
}

// Общее состояние ANG Vers для игрока
export interface ANGVersState {
  // Личный профиль
  profile: SocialProfile;
  
  // Связи
  connections: SocialConnection[];
  pendingRequests: string[]; // Входящие запросы в друзья
  
  // Организации
  guild?: Guild;
  studio?: Studio;
  
  // Контракты
  activeContracts: SocialContract[];
  contractHistory: string[]; // Contract IDs
  
  // Жалобы
  pendingComplaints: SocialComplaint[];
  
  // Уведомления
  notifications: SystemNotification[];
  unreadCount: number;
  
  // Угрозы
  activeThreats: ThreatLog[];
  
  // Рыночные листинги
  myListings: MarketListing[];
  
  // Социальные очки (влияние в системе)
  socialInfluence: number; // 0-1000
  angVersStanding: 'hostile' | 'neutral' | 'friendly' | 'partner' | 'elite';
}