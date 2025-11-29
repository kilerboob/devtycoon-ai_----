/**
 * LAYER 6: Labs Service
 * Независимые лаборатории на планете CyberNation
 * Квесты на взлом, прототипы, исследования
 */

// === TYPES ===

export type LabType = 'research' | 'manufacturing' | 'ai_development' | 'quantum' | 'cybersecurity' | 'biotech';
export type LabTier = 1 | 2 | 3 | 4 | 5;
export type LabStatus = 'active' | 'under_attack' | 'compromised' | 'offline' | 'fortified';

export interface IndependentLab {
    id: string;
    name: string;
    type: LabType;
    tier: LabTier;
    status: LabStatus;
    location: {
        zone: string;
        coordinates: { x: number; y: number };
    };
    security: {
        level: number; // 1-100
        firewalls: number;
        encryption: 'basic' | 'advanced' | 'military' | 'quantum';
        hasAI: boolean;
    };
    resources: {
        shadowCredits: number;
        blueprints: string[];
        prototypes: string[];
        dataFiles: number;
    };
    owner?: string; // Corporation ID or 'independent'
    reputation: number; // Player's reputation with this lab
    lastHackAttempt?: number;
    cooldownUntil?: number;
}

export interface LabQuest {
    id: string;
    labId: string;
    type: 'infiltrate' | 'steal_data' | 'sabotage' | 'extract_prototype' | 'plant_backdoor';
    title: string;
    description: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    requirements: {
        minLevel: number;
        minHackPower: number;
        requiredItems?: string[];
    };
    rewards: {
        money: number;
        shadowCredits: number;
        reputation: number;
        xp: number;
        blueprints?: string[];
        prototypes?: string[];
        items?: string[];
    };
    timeLimit?: number; // seconds
    isRepeatable: boolean;
    cooldown: number; // hours
    status: 'available' | 'in_progress' | 'completed' | 'failed' | 'cooldown';
}

export interface Prototype {
    id: string;
    name: string;
    type: 'hardware' | 'software' | 'ai_model' | 'quantum_chip' | 'neural_interface';
    tier: LabTier;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
    stats: {
        power: number;
        efficiency: number;
        stability: number;
    };
    blueprint?: string;
    requirements: {
        materials: { id: string; amount: number }[];
        labTier: LabTier;
        researchTime: number; // hours
    };
    effects: {
        type: string;
        value: number;
    }[];
    createdAt?: number;
    sourceLabId?: string;
}

export interface HackAttempt {
    id: string;
    labId: string;
    questId?: string;
    startTime: number;
    difficulty: number;
    progress: number; // 0-100
    status: 'in_progress' | 'success' | 'failed' | 'detected';
    rewards?: LabQuest['rewards'];
}

// === DATA ===

const LAB_ZONES = [
    'Neon District',
    'Industrial Sector',
    'Corporate Heights',
    'Underground',
    'Cyber Slums',
    'Tech Haven',
    'Black Market Zone',
    'Research Triangle'
];

const LAB_NAMES_BY_TYPE: Record<LabType, string[]> = {
    research: ['Nexus Research', 'Quantum Labs', 'Innovation Hub', 'Discovery Center', 'Frontier Science'],
    manufacturing: ['NeoForge', 'Precision Works', 'Assembly Prime', 'CyberCraft', 'MegaFactory'],
    ai_development: ['Neural Dynamics', 'Sentient Labs', 'AI Genesis', 'Cortex Institute', 'DeepMind Forge'],
    quantum: ['Quantum Realm', 'Entanglement Labs', 'Superposition Inc', 'Qubit Factory', 'Probability Fields'],
    cybersecurity: ['Firewall Fortress', 'Secure Haven', 'Crypto Castle', 'Shield Labs', 'Defense Matrix'],
    biotech: ['GeneSys Labs', 'BioMerge', 'Evolution Tech', 'Synthetic Life', 'Genome Works']
};

const TIER_MULTIPLIERS: Record<LabTier, number> = {
    1: 1.0,
    2: 1.5,
    3: 2.0,
    4: 3.0,
    5: 5.0
};

const QUEST_TEMPLATES: Omit<LabQuest, 'id' | 'labId' | 'status'>[] = [
    {
        type: 'infiltrate',
        title: 'Тихое проникновение',
        description: 'Незаметно проникни в систему лаборатории и собери информацию',
        difficulty: 1,
        requirements: { minLevel: 1, minHackPower: 10 },
        rewards: { money: 500, shadowCredits: 50, reputation: 10, xp: 100 },
        isRepeatable: true,
        cooldown: 1
    },
    {
        type: 'steal_data',
        title: 'Кража данных',
        description: 'Укради исследовательские данные из защищённых серверов',
        difficulty: 2,
        requirements: { minLevel: 5, minHackPower: 25 },
        rewards: { money: 1500, shadowCredits: 150, reputation: 25, xp: 300 },
        isRepeatable: true,
        cooldown: 2
    },
    {
        type: 'sabotage',
        title: 'Саботаж системы',
        description: 'Внедри вирус для замедления исследований конкурентов',
        difficulty: 3,
        requirements: { minLevel: 10, minHackPower: 50 },
        rewards: { money: 3000, shadowCredits: 300, reputation: 50, xp: 600 },
        isRepeatable: true,
        cooldown: 4
    },
    {
        type: 'extract_prototype',
        title: 'Извлечение прототипа',
        description: 'Найди и скопируй данные о секретном прототипе',
        difficulty: 4,
        requirements: { minLevel: 15, minHackPower: 75 },
        rewards: { money: 7500, shadowCredits: 500, reputation: 100, xp: 1200, prototypes: ['random_prototype'] },
        isRepeatable: false,
        cooldown: 24
    },
    {
        type: 'plant_backdoor',
        title: 'Установка бэкдора',
        description: 'Установи постоянный доступ к системам лаборатории',
        difficulty: 5,
        requirements: { minLevel: 20, minHackPower: 100 },
        rewards: { money: 15000, shadowCredits: 1000, reputation: 200, xp: 2500, blueprints: ['rare_blueprint'] },
        isRepeatable: false,
        cooldown: 48
    }
];

const PROTOTYPE_TEMPLATES: Omit<Prototype, 'id' | 'createdAt' | 'sourceLabId'>[] = [
    {
        name: 'Экспериментальный чип v1',
        type: 'hardware',
        tier: 1,
        rarity: 'common',
        stats: { power: 15, efficiency: 10, stability: 80 },
        requirements: { materials: [{ id: 'circuits', amount: 5 }], labTier: 1, researchTime: 1 },
        effects: [{ type: 'cpu_boost', value: 5 }]
    },
    {
        name: 'AI Ускоритель Alpha',
        type: 'ai_model',
        tier: 2,
        rarity: 'rare',
        stats: { power: 30, efficiency: 25, stability: 70 },
        requirements: { materials: [{ id: 'ai_cores', amount: 2 }, { id: 'neural_chips', amount: 1 }], labTier: 2, researchTime: 4 },
        effects: [{ type: 'auto_code_boost', value: 15 }]
    },
    {
        name: 'Квантовый процессор Beta',
        type: 'quantum_chip',
        tier: 3,
        rarity: 'epic',
        stats: { power: 60, efficiency: 50, stability: 60 },
        requirements: { materials: [{ id: 'quantum_cores', amount: 1 }, { id: 'rare_metals', amount: 5 }], labTier: 3, researchTime: 12 },
        effects: [{ type: 'hack_power', value: 25 }, { type: 'cpu_boost', value: 20 }]
    },
    {
        name: 'Нейроинтерфейс Omega',
        type: 'neural_interface',
        tier: 4,
        rarity: 'legendary',
        stats: { power: 100, efficiency: 80, stability: 50 },
        requirements: { materials: [{ id: 'neural_chips', amount: 5 }, { id: 'biotech_sample', amount: 3 }], labTier: 4, researchTime: 24 },
        effects: [{ type: 'xp_boost', value: 30 }, { type: 'skill_speed', value: 20 }]
    },
    {
        name: 'Сингулярность X',
        type: 'software',
        tier: 5,
        rarity: 'mythic',
        stats: { power: 200, efficiency: 150, stability: 40 },
        requirements: { materials: [{ id: 'quantum_cores', amount: 3 }, { id: 'ai_cores', amount: 5 }, { id: 'singularity_shard', amount: 1 }], labTier: 5, researchTime: 72 },
        effects: [{ type: 'all_stats', value: 25 }]
    }
];

// === SERVICE ===

class LabService {
    private labs: IndependentLab[] = [];
    private quests: LabQuest[] = [];
    private prototypes: Prototype[] = [];
    private activeHacks: HackAttempt[] = [];

    constructor() {
        this.generateLabs();
        this.generateQuests();
    }

    // Generate initial labs
    private generateLabs(): void {
        const labTypes: LabType[] = ['research', 'manufacturing', 'ai_development', 'quantum', 'cybersecurity', 'biotech'];
        
        for (let i = 0; i < 20; i++) {
            const type = labTypes[Math.floor(Math.random() * labTypes.length)];
            const tier = Math.min(5, Math.floor(Math.random() * 3) + 1) as LabTier;
            const names = LAB_NAMES_BY_TYPE[type];
            const zone = LAB_ZONES[Math.floor(Math.random() * LAB_ZONES.length)];
            
            this.labs.push({
                id: `lab_${i + 1}`,
                name: `${names[Math.floor(Math.random() * names.length)]} #${i + 1}`,
                type,
                tier,
                status: 'active',
                location: {
                    zone,
                    coordinates: { 
                        x: Math.floor(Math.random() * 1000), 
                        y: Math.floor(Math.random() * 1000) 
                    }
                },
                security: {
                    level: 20 + tier * 15 + Math.floor(Math.random() * 10),
                    firewalls: tier + Math.floor(Math.random() * 2),
                    encryption: tier >= 4 ? 'quantum' : tier >= 3 ? 'military' : tier >= 2 ? 'advanced' : 'basic',
                    hasAI: tier >= 3 && Math.random() > 0.5
                },
                resources: {
                    shadowCredits: 1000 * tier * TIER_MULTIPLIERS[tier],
                    blueprints: [],
                    prototypes: [],
                    dataFiles: 10 * tier
                },
                owner: Math.random() > 0.7 ? `corp_${Math.floor(Math.random() * 6) + 1}` : 'independent',
                reputation: 0
            });
        }
    }

    // Generate quests for each lab
    private generateQuests(): void {
        this.labs.forEach(lab => {
            // Each lab has 2-4 quests based on tier
            const questCount = Math.min(5, lab.tier + 1);
            const availableTemplates = QUEST_TEMPLATES.filter(q => q.difficulty <= lab.tier + 1);
            
            for (let i = 0; i < questCount && i < availableTemplates.length; i++) {
                const template = availableTemplates[i];
                const multiplier = TIER_MULTIPLIERS[lab.tier];
                
                this.quests.push({
                    ...template,
                    id: `quest_${lab.id}_${i + 1}`,
                    labId: lab.id,
                    status: 'available',
                    rewards: {
                        ...template.rewards,
                        money: Math.floor(template.rewards.money * multiplier),
                        shadowCredits: Math.floor(template.rewards.shadowCredits * multiplier),
                        xp: Math.floor(template.rewards.xp * multiplier)
                    }
                });
            }
        });
    }

    // Get all labs
    getLabs(): IndependentLab[] {
        return this.labs;
    }

    // Get labs by zone
    getLabsByZone(zone: string): IndependentLab[] {
        return this.labs.filter(lab => lab.location.zone === zone);
    }

    // Get labs by type
    getLabsByType(type: LabType): IndependentLab[] {
        return this.labs.filter(lab => lab.type === type);
    }

    // Get lab by ID
    getLab(id: string): IndependentLab | undefined {
        return this.labs.find(lab => lab.id === id);
    }

    // Get all quests
    getQuests(): LabQuest[] {
        return this.quests;
    }

    // Get quests for a lab
    getLabQuests(labId: string): LabQuest[] {
        return this.quests.filter(q => q.labId === labId);
    }

    // Get available quests for player
    getAvailableQuests(playerLevel: number, hackPower: number): LabQuest[] {
        return this.quests.filter(q => 
            q.status === 'available' &&
            q.requirements.minLevel <= playerLevel &&
            q.requirements.minHackPower <= hackPower
        );
    }

    // Start a hack attempt
    startHack(labId: string, questId?: string): HackAttempt | null {
        const lab = this.getLab(labId);
        if (!lab) return null;

        // Check cooldown
        if (lab.cooldownUntil && Date.now() < lab.cooldownUntil) {
            return null;
        }

        const quest = questId ? this.quests.find(q => q.id === questId) : undefined;
        const difficulty = quest ? quest.difficulty * 20 : lab.security.level;

        const attempt: HackAttempt = {
            id: `hack_${Date.now()}`,
            labId,
            questId,
            startTime: Date.now(),
            difficulty,
            progress: 0,
            status: 'in_progress',
            rewards: quest?.rewards
        };

        this.activeHacks.push(attempt);
        lab.status = 'under_attack';
        lab.lastHackAttempt = Date.now();

        if (quest) {
            quest.status = 'in_progress';
        }

        return attempt;
    }

    // Update hack progress (called from HackingMinigame)
    updateHackProgress(attemptId: string, progress: number, success: boolean): HackAttempt | null {
        const attempt = this.activeHacks.find(a => a.id === attemptId);
        if (!attempt) return null;

        attempt.progress = progress;

        if (progress >= 100 || success) {
            attempt.status = 'success';
            this.completeHack(attempt);
        } else if (!success && progress <= 0) {
            attempt.status = 'failed';
            this.failHack(attempt);
        }

        return attempt;
    }

    // Complete successful hack
    private completeHack(attempt: HackAttempt): void {
        const lab = this.getLab(attempt.labId);
        if (!lab) return;

        lab.status = 'compromised';
        lab.cooldownUntil = Date.now() + 3600000; // 1 hour cooldown

        if (attempt.questId) {
            const quest = this.quests.find(q => q.id === attempt.questId);
            if (quest) {
                quest.status = 'completed';
                if (!quest.isRepeatable) {
                    // Mark as permanently completed
                } else {
                    // Set cooldown for repeatable quests
                    setTimeout(() => {
                        quest.status = 'available';
                    }, quest.cooldown * 3600000);
                }
            }
        }

        // Remove from active hacks
        this.activeHacks = this.activeHacks.filter(a => a.id !== attempt.id);
    }

    // Handle failed hack
    private failHack(attempt: HackAttempt): void {
        const lab = this.getLab(attempt.labId);
        if (!lab) return;

        lab.status = 'fortified';
        lab.security.level = Math.min(100, lab.security.level + 5);
        lab.cooldownUntil = Date.now() + 7200000; // 2 hour cooldown on fail

        if (attempt.questId) {
            const quest = this.quests.find(q => q.id === attempt.questId);
            if (quest) {
                quest.status = 'failed';
                // Reset after cooldown
                setTimeout(() => {
                    quest.status = 'available';
                }, quest.cooldown * 3600000);
            }
        }

        attempt.status = 'detected';
        this.activeHacks = this.activeHacks.filter(a => a.id !== attempt.id);
    }

    // Get prototype templates
    getPrototypeTemplates(): typeof PROTOTYPE_TEMPLATES {
        return PROTOTYPE_TEMPLATES;
    }

    // Create prototype from template
    createPrototype(templateIndex: number, labId: string): Prototype | null {
        if (templateIndex < 0 || templateIndex >= PROTOTYPE_TEMPLATES.length) return null;
        
        const template = PROTOTYPE_TEMPLATES[templateIndex];
        const prototype: Prototype = {
            ...template,
            id: `proto_${Date.now()}`,
            createdAt: Date.now(),
            sourceLabId: labId
        };

        this.prototypes.push(prototype);
        return prototype;
    }

    // Get player's prototypes
    getPrototypes(): Prototype[] {
        return this.prototypes;
    }

    // Get zones
    getZones(): string[] {
        return LAB_ZONES;
    }

    // Calculate hack success chance
    calculateHackChance(labId: string, playerHackPower: number): number {
        const lab = this.getLab(labId);
        if (!lab) return 0;

        const baseChance = 50;
        const powerDiff = playerHackPower - lab.security.level;
        const aiPenalty = lab.security.hasAI ? 15 : 0;
        const encryptionPenalty = 
            lab.security.encryption === 'quantum' ? 25 :
            lab.security.encryption === 'military' ? 15 :
            lab.security.encryption === 'advanced' ? 10 : 0;

        return Math.max(5, Math.min(95, baseChance + powerDiff - aiPenalty - encryptionPenalty));
    }

    // Get lab type info
    getLabTypeInfo(type: LabType): { icon: string; color: string; description: string } {
        const info: Record<LabType, { icon: string; color: string; description: string }> = {
            research: { icon: '🔬', color: 'blue', description: 'Фундаментальные исследования' },
            manufacturing: { icon: '🏭', color: 'gray', description: 'Производство компонентов' },
            ai_development: { icon: '🤖', color: 'purple', description: 'Разработка ИИ' },
            quantum: { icon: '⚛️', color: 'cyan', description: 'Квантовые вычисления' },
            cybersecurity: { icon: '🛡️', color: 'green', description: 'Кибербезопасность' },
            biotech: { icon: '🧬', color: 'pink', description: 'Биотехнологии' }
        };
        return info[type];
    }
}

// Singleton instance
export const labService = new LabService();
export default labService;
