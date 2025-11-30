
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_GAME_STATE, CODE_SNIPPETS, LEARNING_QUESTS, HARDWARE_CATALOG, SKILL_TREE, FILE_SYSTEM_INIT, BANK_CONSTANTS, NEWS_TEMPLATES, EMAIL_TEMPLATES, ACHIEVEMENTS } from './constants';
import { GameState, LogEntry, Project, SkillLevel, HardwareItem, ProjectTemplate, UserApp, ProgrammingLanguage, ChatMessage, ServerRegion, InventoryItem, FileNode, Language, HardwareType, Bill, BankTransaction, NewsArticle, Email, Notification, PlayerRole, Blueprint, CorporationId, CorpMembership, CorpQuest, DesktopItem, HackerStats, HackerRank } from './types';
import { Room } from './components/Room';
import { Desktop } from './components/Desktop';
import { StoryModal } from './components/StoryModal';
import { PCInternals } from './components/PCInternals';
import { AuthScreen } from './components/AuthScreen';
import { HackingMinigame } from './components/HackingMinigame';
import { ShardSelector } from './components/ShardSelector';
import { playSound } from './utils/sound';
import { dbService } from './services/dbService';
import { devFsService, FSWatcherCallback } from './services/devFsService';
import migrateEnsureIds from './services/devFsMigration';
import { onlineService } from './services/onlineMock';
import { shardService } from './services/shardService';
import { playerRoleService } from './services/playerRoleService';
import { labService } from './services/labService';
import { securityStore } from './services/securityStore';
import { MatrixBackground } from './components/MatrixBackground';
import { EndingScreen } from './components/EndingScreen';
import { NotificationContainer } from './components/NotificationContainer';
import { AchievementsApp } from './components/AchievementsApp';
import { JournalApp } from './components/JournalApp';
import { IDSOverlay } from './components/IDSOverlay';

import ConfirmModal from './components/ConfirmModal';
import UndoSnackbar from './components/UndoSnackbar';

export default function App() {
    // --- DEVFS WATCHERS: уведомления о событиях файловой системы ---
    const addNotification = useCallback((title: string, message: string, type: Notification['type'] = 'info', icon?: string, duration?: number) => {
        const notif: Notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            title,
            message,
            icon,
            timestamp: Date.now(),
            duration
        };
        setGameState(prev => ({
            ...prev,
            notifications: [...prev.notifications.slice(-9), notif]
        }));
        playSound(type === 'error' ? 'error' : type === 'success' ? 'success' : 'notification');
    }, []);

    useEffect(() => {
        const watcher: FSWatcherCallback = (event) => {
            let title = '', message = '', type: Notification['type'] = 'info', icon = '';
            switch (event.type) {
                case 'create':
                    title = event.entry?.type === 'folder' ? 'Папка создана' : 'Файл создан';
                    message = `Путь: ${event.path}`;
                    type = 'success';
                    icon = event.entry?.type === 'folder' ? '📁' : '📄';
                    break;
                case 'update':
                    title = event.entry?.type === 'folder' ? 'Папка изменена' : 'Файл изменён';
                    message = `Путь: ${event.path}`;
                    type = 'info';
                    icon = event.entry?.type === 'folder' ? '📁' : '📄';
                    break;
                case 'delete':
                    title = event.entry?.type === 'folder' ? 'Папка удалена' : 'Файл удалён';
                    message = `Путь: ${event.path}`;
                    type = 'error';
                    icon = event.entry?.type === 'folder' ? '📁' : '📄';
                    break;
                case 'rename':
                    title = 'Переименование';
                    message = `Из ${event.oldPath} → ${event.path}`;
                    type = 'success';
                    icon = event.entry?.type === 'folder' ? '📁' : '📄';
                    break;
            }
            if (title) addNotification(title, message, type, icon, 3500);
        };
        const unsubscribe = devFsService.registerListener(watcher);
        return () => { try { unsubscribe(); } catch { /* ignore */ } };
    }, [addNotification]);
    // --- STATE ---
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasSave, setHasSave] = useState(false);
    const [hasSelectedShard, setHasSelectedShard] = useState(false);

    const [view, setView] = useState<'ROOM' | 'DESKTOP'>('ROOM');
    const [isPCBuildMode, setIsPCBuildMode] = useState(false);
    const [isJournalOpen, setIsJournalOpen] = useState(false);
    const [isHacking, setIsHacking] = useState(false);
    // LAYER 6: Labs hacking context with difficulty
    const [hackingContext, setHackingContext] = useState<{ labId?: string; questId?: string; difficulty?: number } | null>(null);
    const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // Online State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    // Gameplay State
    const [isCrunchMode, setIsCrunchMode] = useState(false);
    const [writtenCode, setWrittenCode] = useState<string[]>(["// Connecting to local server...", "// Auth successful."]);
    const [modalData, setModalData] = useState<any>(null);

    // Refs for loop
    const stateRef = useRef(gameState);
    stateRef.current = gameState;
    const crunchRef = useRef(isCrunchMode);
    crunchRef.current = isCrunchMode;

    // Undo stack for deletions: keeps last deleted batch for quick restore
    const [lastDeletedSnapshot, setLastDeletedSnapshot] = useState<{ entries: any[]; expiresAt: number } | null>(null);
    const lastDeletedTimer = useRef<number | null>(null);

    // Confirm modal state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const confirmPayload = useRef<{ path?: string; count?: number; onConfirm?: () => void } | null>(null);

    // --- HELPERS ---
    
    // LAYER 4: Get shard multipliers for economy/XP
    const getShardMultipliers = useCallback(() => {
        return shardService.getMultipliers();
    }, []);
    
    // LAYER 9: Calculate and update player tier based on reputation
    const calculateUpdatedTier = useCallback((reputation: number) => {
        return playerRoleService.calculateTier(reputation);
    }, []);

    // LAYER 14: Calculate hacker rank based on stats
    const calculateHackerRank = useCallback((stats: HackerStats): HackerRank => {
        const successRate = stats.totalHacks > 0 ? stats.successfulHacks / stats.totalHacks : 0;
        
        if (stats.successfulHacks >= 100 && successRate >= 0.8) return 'legend';
        if (stats.successfulHacks >= 75) return 'ghost';
        if (stats.successfulHacks >= 50) return 'cyber_ninja';
        if (stats.successfulHacks >= 30) return 'elite_hacker';
        if (stats.successfulHacks >= 15) return 'hacker';
        if (stats.successfulHacks >= 5) return 'amateur';
        return 'script_kiddie';
    }, []);

    // LAYER 14: Update hacker stats after hack attempt
    const updateHackerStats = useCallback((success: boolean, difficulty: number, scEarned: number = 0): HackerStats => {
        const currentStats = stateRef.current.hackerStats || {
            totalHacks: 0,
            successfulHacks: 0,
            failedHacks: 0,
            highestDifficulty: 0,
            consecutiveWins: 0,
            maxStreak: 0,
            totalShadowCreditsEarned: 0,
            hackerRank: 'script_kiddie' as HackerRank,
            specializations: []
        };

        const newStats: HackerStats = {
            ...currentStats,
            totalHacks: currentStats.totalHacks + 1,
            successfulHacks: success ? currentStats.successfulHacks + 1 : currentStats.successfulHacks,
            failedHacks: success ? currentStats.failedHacks : currentStats.failedHacks + 1,
            highestDifficulty: success ? Math.max(currentStats.highestDifficulty, difficulty) : currentStats.highestDifficulty,
            consecutiveWins: success ? currentStats.consecutiveWins + 1 : 0,
            maxStreak: success ? Math.max(currentStats.maxStreak, currentStats.consecutiveWins + 1) : currentStats.maxStreak,
            totalShadowCreditsEarned: currentStats.totalShadowCreditsEarned + scEarned,
            hackerRank: currentStats.hackerRank,
            specializations: currentStats.specializations
        };

        newStats.hackerRank = calculateHackerRank(newStats);

        return newStats;
    }, [calculateHackerRank]);
    
    const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
        setLogs(prev => [...prev.slice(-49), {
            id: Math.random().toString(36).substr(2, 9),
            message,
            type,
            timestamp: Date.now()
        }]);
    }, []);



    const checkAchievements = useCallback((state: GameState) => {
        const newUnlocks: string[] = [];

        ACHIEVEMENTS.forEach(ach => {
            if (!state.unlockedAchievements.includes(ach.id) && ach.condition(state)) {
                newUnlocks.push(ach.id);
            }
        });

        if (newUnlocks.length > 0) {
            setGameState(prev => {
                let newState = { ...prev, unlockedAchievements: [...prev.unlockedAchievements, ...newUnlocks] };

                // Apply rewards
                newUnlocks.forEach(achId => {
                    const ach = ACHIEVEMENTS.find(a => a.id === achId);
                    if (ach?.reward) {
                        if (ach.reward.money) newState.money += ach.reward.money;
                        if (ach.reward.reputation) newState.reputation += ach.reward.reputation;
                        if (ach.reward.shadowCredits) newState.shadowCredits += ach.reward.shadowCredits;
                    }

                    // Show notification
                    const notif: Notification = {
                        id: `ach_${achId}_${Date.now()}`,
                        type: 'achievement',
                        title: '🏆 Достижение разблокировано!',
                        message: ach?.title || 'Новое достижение',
                        icon: ach?.icon,
                        timestamp: Date.now(),
                        duration: 7000
                    };
                    newState.notifications = [...newState.notifications.slice(-9), notif];
                });

                return newState;
            });

            playSound('success');
        }
    }, []);

    const calculateTotalStats = (equipped: GameState['equipped'], inventory: InventoryItem[], unlockedPerks: string[] = []) => {
        let clickPower = 1;
        let autoCode = 0;
        let bugChance = 0.15; // Base chance
        let heatGen = 0;
        let cooling = 0;

        if (!equipped) return { clickPower, autoCode, bugChance, heatGen, cooling };

        // Hardware Stats
        Object.values(equipped).forEach(uid => {
            const invItem = inventory.find(i => i.uid === uid);
            if (invItem) {
                const item = HARDWARE_CATALOG.find(h => h.id === invItem.itemId);
                if (item) {
                    if (item.effect.type === 'click_power') clickPower += item.effect.value;
                    if (item.effect.type === 'auto_code') autoCode += item.effect.value;
                    if (item.effect.type === 'bug_resist') bugChance -= item.effect.value;

                    // New: Heat/Cooling logic from attributes
                    if (item.heatOutput) heatGen += item.heatOutput;
                    else if (item.effect.type === 'heat') heatGen += item.effect.value;

                    if (item.effect.type === 'cooling') cooling += item.effect.value;
                }
            }
        });

        // Perk Stats
        unlockedPerks.forEach(pid => {
            const perk = SKILL_TREE.find(p => p.id === pid);
            if (perk) {
                if (perk.effect.type === 'click_boost') clickPower *= (1 + perk.effect.value); // Multiplier
                if (perk.effect.type === 'bug_reduction') bugChance *= (1 - perk.effect.value);
            }
        });

        return {
            clickPower,
            autoCode,
            bugChance: Math.max(0.01, bugChance),
            heatGen,
            cooling
        };
    };

    const handleRenameFile = (oldId: string, newId: string) => {
        (async () => {
            try {
                await devFsService.init();
                await devFsService.renameEntry(oldId, newId);

                // Rebuild in-memory file system from DB
                const all = await dbService.getAll<any>('devFS');
                const buildTree = (entries: any[]) => {
                    const map = new Map<string, any>();
                    const root: FileNode = { id: '/', name: '/', type: 'folder', children: [], createdAt: Date.now() };
                    map.set('/', root);
                    entries.forEach(ent => {
                        const node = { ...ent, children: ent.type === 'folder' ? [] : undefined };
                        map.set(ent.id, node);
                    });
                    entries.forEach(ent => {
                        const parentId = ent.parentId || '/';
                        const parent = map.get(parentId) || root;
                        if (!parent.children) parent.children = [];
                        parent.children.push(map.get(ent.id));
                    });
                    return root;
                };

                const tree = buildTree(all);
                setGameState(prev => ({ ...prev, fileSystem: tree }));
                addNotification('Renamed', `Renamed ${oldId} → ${newId}`, 'success');
            } catch (e) {
                console.warn('[App] rename failed', e);
                addNotification('Rename failed', 'Could not rename item', 'error');
            }
        })();
    };

    const calculateStorage = () => {
        // 1. Calculate Total Capacity from Hardware
        let totalCapacity = 0;
        if (stateRef.current.equipped) {
            Object.values(stateRef.current.equipped).forEach(uid => {
                const invItem = stateRef.current.inventory.find(i => i.uid === uid);
                const catalogItem = HARDWARE_CATALOG.find(h => h.id === invItem?.itemId);
                if (catalogItem?.storageCap) {
                    totalCapacity += catalogItem.storageCap;
                }
            });
        }

        // 2. Calculate Used Space (Recursive)
        const calculateUsed = (node: FileNode): number => {
            let size = 0;
            if (node.type === 'file' && node.content) {
                size += node.content.length; // 1 char = 1 byte roughly
            }
            if (node.children) {
                node.children.forEach(child => {
                    size += calculateUsed(child);
                });
            }
            return size;
        };

        const usedBytes = calculateUsed(stateRef.current.fileSystem);
        const usedGB = usedBytes / 1024 / 1024; // Fake scaling, actually just relative

        return { totalCapacity, usedBytes, usedGB };
    };

    // --- LIFECYCLE ---

    // Initialize DB and Check Save
    useEffect(() => {
        const initApp = async () => {
            try {
                // Init DB and DevFS
                await dbService.init();
                await devFsService.init();
                await shardService.init();

                // Run one-time migration to ensure existing devFS entries have ids
                try {
                    const res = await migrateEnsureIds();
                    if (res && res.migrated > 0) {
                        addLog(`Миграция devFS: исправлено ${res.migrated} из ${res.total} записей`, 'info');
                    }
                } catch (mErr) {
                    console.warn('devFS migration failed', mErr);
                    addLog('Миграция DevFS не удалась (подробнее в консоли).', 'error');
                }

                const exists = await dbService.hasSave();
                setHasSave(exists);
                
                // Check if shard is already selected
                const hasShard = shardService.hasSelectedShard();
                setHasSelectedShard(hasShard);
            } catch (error) {
                console.error("Initialization failed", error);
                addLog("Ошибка инициализации базы данных.", "error");
            } finally {
                // Stop loading animation, show Auth Screen
                setTimeout(() => setIsLoading(false), 1000);
            }
        };
        initApp();
    }, [addLog]);

    // Auto-save active project to DevFS every 30 seconds
    useEffect(() => {
        if (!isAuthenticated || !gameState.activeProject) return;

        const saveInterval = setInterval(() => {
            (async () => {
                try {
                    await devFsService.init();
                    await devFsService.saveProject(gameState.activeProject!.id, gameState.activeProject!);
                    console.info('[App] Auto-saved project:', gameState.activeProject!.id);
                } catch (e) {
                    console.error('[App] Failed to auto-save project', e);
                }
            })();
        }, 30000); // Every 30 seconds

        return () => clearInterval(saveInterval);
    }, [isAuthenticated, gameState.activeProject]);

    // Auth Handlers
    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const savedState = await dbService.loadGame();
            if (savedState) {
                // Migration Logic: If inventory is string[], convert to InventoryItem[]
                let inventory = savedState.inventory || INITIAL_GAME_STATE.inventory;
                if (inventory.length > 0 && typeof inventory[0] === 'string') {
                    // Migration detected
                    console.log("Migrating inventory to new format...");
                    inventory = (inventory as unknown as string[]).map(id => ({
                        uid: `${id}_${Math.random().toString(36).substr(2, 9)}`,
                        itemId: id,
                        isStolen: false,
                        durability: 100
                    }));
                }

                const sanitizedState = {
                    ...INITIAL_GAME_STATE,
                    ...savedState,
                    inventory: inventory,
                    fileSystem: savedState.fileSystem || FILE_SYSTEM_INIT, // Ensure FS exists
                    equipped: { ...INITIAL_GAME_STATE.equipped, ...(savedState.equipped || {}) },
                    userApps: savedState.userApps || INITIAL_GAME_STATE.userApps,
                    unlockedPerks: savedState.unlockedPerks || [],
                    temperature: typeof savedState.temperature === 'number' ? savedState.temperature : INITIAL_GAME_STATE.temperature,
                    energy: typeof savedState.energy === 'number' ? savedState.energy : INITIAL_GAME_STATE.energy,
                    timeOfDay: typeof savedState.timeOfDay === 'number' ? savedState.timeOfDay : INITIAL_GAME_STATE.timeOfDay,
                    isShadowMarketUnlocked: !!savedState.isShadowMarketUnlocked,
                    shadowCredits: typeof savedState.shadowCredits === 'number' ? savedState.shadowCredits : 0,
                    globalHeat: typeof savedState.globalHeat === 'number' ? savedState.globalHeat : 10,
                    tracePercent: typeof savedState.tracePercent === 'number' ? savedState.tracePercent : 0,
                    language: savedState.language || 'ru',
                    marketTrends: savedState.marketTrends || INITIAL_GAME_STATE.marketTrends,
                    signalEndTime: savedState.signalEndTime || 0,
                    shadowAccessExpiry: savedState.shadowAccessExpiry || 0,
                    // Bank Init
                    bills: savedState.bills || [],
                    transactions: savedState.transactions || [],
                    loanDebt: typeof savedState.loanDebt === 'number' ? savedState.loanDebt : 0,
                    creditScore: typeof savedState.creditScore === 'number' ? savedState.creditScore : 500,
                    // Living World
                    news: savedState.news || INITIAL_GAME_STATE.news,
                    emails: savedState.emails || INITIAL_GAME_STATE.emails,
                    // Victory State
                    isGameWon: !!savedState.isGameWon,
                    // Notification & Achievement System
                    notifications: savedState.notifications || [],
                    unlockedAchievements: savedState.unlockedAchievements || [],
                    // LAYER 5: Corporation membership (new fields)
                    corporationReps: savedState.corporationReps || INITIAL_GAME_STATE.corporationReps,
                    corpMembership: savedState.corpMembership || undefined,
                    activeCorpQuests: savedState.activeCorpQuests || [],
                    completedCorpQuests: savedState.completedCorpQuests || []
                };

                setGameState(sanitizedState);
                
                // Load projects from DevFS
                try {
                    const savedProjects = await devFsService.loadAllProjects();
                    if (savedProjects && savedProjects.length > 0) {
                        const projects: Project[] = savedProjects.map(p => p.data);
                        const releasedProjects = projects.filter(p => p.stage === 'released');
                        const activeProject = projects.find(p => p.stage !== 'released') || null;
                        
                        setGameState(prev => ({
                            ...prev,
                            releasedProjects,
                            activeProject
                        }));
                        addLog(`Загружено ${savedProjects.length} проектов из сохранения.`, 'info');
                    }
                } catch (projErr) {
                    console.warn('Failed to load projects from DevFS', projErr);
                    addLog('Ошибка загрузки проектов (подробнее в консоли).', 'error');
                }
                addLog(`С возвращением, ${sanitizedState.username}.`, "success");
            }
            setIsAuthenticated(true);
            onlineService.start(handleIncomeMessage); // Start online sim
        } catch (e) {
            console.error(e);
            addLog("Ошибка загрузки.", "error");
        }
        setIsLoading(false);
    };

    const handleRegister = async (username: string, region: ServerRegion, role: PlayerRole) => {
        setIsLoading(true);
        await dbService.deleteSave(); // Wipe old save if exists
        const now = Date.now();
        const newState = { 
            ...INITIAL_GAME_STATE, 
            username, 
            serverRegion: region,
            playerRole: role,
            playerTier: 'trainee' as const,
            blueprints: [],
            corporationReps: [
                { corporationId: 'titan' as const, reputation: 0, rank: 'нейтрал' as const, totalContracts: 0, lastInteraction: now },
                { corporationId: 'novatek' as const, reputation: 0, rank: 'нейтрал' as const, totalContracts: 0, lastInteraction: now },
                { corporationId: 'cyberforge' as const, reputation: 0, rank: 'нейтрал' as const, totalContracts: 0, lastInteraction: now },
                { corporationId: 'blacksun' as const, reputation: 0, rank: 'нейтрал' as const, totalContracts: 0, lastInteraction: now },
                { corporationId: 'orbitron' as const, reputation: 0, rank: 'нейтрал' as const, totalContracts: 0, lastInteraction: now }
            ]
        };
        setGameState(newState);
        setIsAuthenticated(true);
        onlineService.start(handleIncomeMessage); // Start online sim
        setModalData({
            title: "Добро пожаловать в сеть",
            content: `Привет, ${username}. Ты подключен к серверу ${region}. Твоя роль — ${role}. Твоя задача — стать легендой. Начни с простых скриптов, но помни: теневая сеть (DarkHub) следит за тобой.`,
            type: 'intro'
        });
        setIsLoading(false);
    };

    const handleIncomeMessage = useCallback((msg: ChatMessage) => {
        setChatMessages(prev => [...prev.slice(-49), msg]);
    }, []);

    // Auto-Save & Game Loop (1s Tick)
    useEffect(() => {
        if (!isAuthenticated || isLoading) return;

        const interval = setInterval(() => {
            // Save Async - Clone state to avoid mutation reference issues during save
            const stateToSave = JSON.parse(JSON.stringify(stateRef.current));
            dbService.saveGame(stateToSave).catch(err => console.error("Auto-save failed", err));

            setGameState(prev => {
                // 1. Time Cycle
                let newTime = (prev.timeOfDay || 8.0) + (1 / 60);
                let newDay = prev.day || 1;
                let dayChanged = false;
                if (newTime >= 24) {
                    newTime = 0;
                    newDay += 1;
                    dayChanged = true;
                }

                // 2. Physics & Heat Calculation
                const stats = calculateTotalStats(prev.equipped, prev.inventory, prev.unlockedPerks);
                // Equilibrium Temp logic
                const targetTemp = 30 + (stats.heatGen / (stats.cooling + 5)) * 50;
                let newTemp = (prev.temperature || 30) + (targetTemp - (prev.temperature || 30)) * 0.1;

                // Overheating Penalty
                const isOverheating = newTemp > 90;
                const efficiency = isOverheating ? 0.2 : 1.0;

                // 3. Auto Code Logic
                const { autoCodePerSecond, bugChance, activeProject } = prev;
                let newLOC = prev.linesOfCode;
                let newBugs = prev.bugs;
                let newActiveProject = activeProject ? { ...activeProject } : null;

                // Ensure energy exists
                const currentEnergy = typeof prev.energy === 'number' ? prev.energy : 100;
                let energyDrain = 0;

                if (autoCodePerSecond > 0 && currentEnergy > 5) {
                    // LAYER 8: Apply role coding_speed bonus
                    const baseCoded = autoCodePerSecond * (crunchRef.current ? 1.5 : 1) * efficiency;
                    const codeGenerated = playerRoleService.applyRoleBonus(baseCoded, prev.playerRole, 'coding_speed');
                    newLOC += codeGenerated;
                    newBugs += (Math.random() < bugChance * 0.1 ? 1 : 0);

                    if (newActiveProject) {
                        newActiveProject.progress += codeGenerated;
                        newActiveProject.bugs += (Math.random() < bugChance * 0.1 ? 1 : 0);
                    }
                    // High performance hardware drains more energy
                    energyDrain = 0.05 + (stats.heatGen / 500);
                }

                // 4. Passive Income & Daily Billing (Economy Cycle)
                // LAYER 4: Apply shard economy multiplier
                const shardMult = getShardMultipliers();
                
                const released = prev.releasedProjects || [];
                let passiveIncome = released.reduce((acc, p) => acc + (p.baseRevenue || 0), 0) / 60;
                passiveIncome *= shardMult.economy; // Apply shard multiplier

                if (prev.unlockedPerks?.includes('perk_miner') && !isOverheating) {
                    passiveIncome += 0.5 * shardMult.economy;
                }

                // NEW: User Apps Revenue (Ad Traffic)
                let appRevenue = 0;
                if (dayChanged) {
                    // Calculate daily traffic revenue for user apps
                    prev.userApps.forEach(app => {
                        // Traffic is based on code length (complexity) + random fluctuation
                        const complexity = app.code.length;
                        const baseVisitors = Math.floor(complexity * 0.5);
                        const visitors = Math.floor(baseVisitors * (0.8 + Math.random() * 0.4)); // +/- 20%
                        appRevenue += visitors * BANK_CONSTANTS.TRAFFIC_REVENUE_PER_VISITOR;
                    });
                    appRevenue *= shardMult.economy; // Apply shard multiplier
                }

                let newBills = [...prev.bills];
                let newTransactions = [...prev.transactions];
                let newMoney = prev.money + passiveIncome;

                if (dayChanged) {
                    // Create Electricity Bill
                    const watts = stats.heatGen; // Use heat gen as watt proxy
                    const electricCost = Math.floor(watts * BANK_CONSTANTS.ELECTRICITY_RATE_PER_WATT) + BANK_CONSTANTS.INTERNET_COST_BASIC;

                    if (electricCost > 0) {
                        const billId = `bill_elec_${Date.now()}`;
                        newBills.push({
                            id: billId,
                            title: `Electricity & Network (Day ${prev.day})`,
                            amount: electricCost,
                            dueDate: prev.day + 3,
                            isPaid: false,
                            type: 'electricity'
                        });
                        addLog(`New Bill Arrived: $${electricCost} for utilities.`, 'warn');
                    }

                    // Add App Revenue
                    if (appRevenue > 0) {
                        newMoney += appRevenue;
                        newTransactions.push({
                            id: `tx_ads_${Date.now()}`,
                            type: 'income',
                            amount: appRevenue,
                            category: 'Ad Revenue',
                            description: 'Traffic from user apps',
                            date: Date.now()
                        });
                        addLog(`Received $${appRevenue.toFixed(2)} from App Ads.`, 'success');
                    }
                }

                // 5. Global Heat Decay
                let newHeat = prev.globalHeat;
                if (newHeat > 10 && Math.random() > 0.9) newHeat -= 1;

                // 6. Trace & Risk Mechanics
                // Find illegal equipped items via UIDs
                const illegalItemEquipped = Object.values(prev.equipped).some(uid => {
                    const invItem = prev.inventory.find(i => i.uid === uid);
                    if (!invItem) return false;
                    return HARDWARE_CATALOG.find(h => h.id === invItem.itemId)?.isIllegal;
                });

                let newTrace = prev.tracePercent || 0;
                if (illegalItemEquipped) {
                    newTrace += 0.05; // Buildup when using illegal tech
                } else if (newTrace > 0) {
                    newTrace -= 0.1; // Decay when safe
                }
                newTrace = Math.max(0, Math.min(100, newTrace));

                // 7. Corporate Raid Event
                let raidEffect = {};
                if (newTrace > 90 && Math.random() < 0.01) {
                    // Trigger Raid
                    raidEffect = {
                        money: Math.max(0, newMoney * 0.5), // 50% Fine
                        tracePercent: 0,
                    };
                    setModalData({
                        title: "⚠ ВНИМАНИЕ: ФЕДЕРАЛЬНЫЙ РЕЙД ⚠",
                        content: `Служба безопасности засекла ваш сигнал. Штраф списан со счетов. Оборудование конфисковано (симуляция). Снизьте уровень риска!`,
                        type: 'quest_end'
                    });
                    playSound('error');
                }

                // 8. Market Trends Cycle & NEWS GENERATION
                let newTrends = { ...(prev.marketTrends || INITIAL_GAME_STATE.marketTrends) };
                let newNews = [...prev.news];
                let newsGenerated = false;

                if (Math.random() < 0.02) { // 2% chance per second to shift trend
                    const types: HardwareType[] = ['gpu', 'cpu', 'ram', 'storage', 'cooler', 'monitor'];
                    const targetType = types[Math.floor(Math.random() * types.length)];
                    const shift = (Math.random() - 0.5) * 0.4; // +/- 20%
                    const current = newTrends[targetType as string] || 1.0;
                    const newValue = Math.max(0.5, Math.min(2.0, current + shift));

                    newTrends[targetType as string] = newValue;

                    // Generate News if trend changed significantly
                    if (Math.abs(newValue - current) > 0.1) {
                        const direction = newValue > current ? 'inflation' : 'deflation';
                        // Use helper type assertion or just specific property access if TS complains, but key access works
                        const templateList = (NEWS_TEMPLATES[direction] as any)[targetType] || NEWS_TEMPLATES[direction].generic;
                        const tpl = templateList[Math.floor(Math.random() * templateList.length)];

                        newNews.push({
                            id: `news_${Date.now()}`,
                            headline: tpl.t,
                            content: tpl.c,
                            category: tpl.cat,
                            impact: direction,
                            targetType: targetType,
                            timestamp: Date.now()
                        });
                        newsGenerated = true;
                    }
                }

                // 9. Random Signal Event
                let newSignalEndTime = prev.signalEndTime || 0;
                const isAccessActive = (prev.shadowAccessExpiry || 0) > Date.now();
                const isSignalActive = newSignalEndTime > Date.now();

                if (!isAccessActive && !isSignalActive && Math.random() < 0.005) {
                    newSignalEndTime = Date.now() + 90000;
                    addLog("ОБНАРУЖЕН ШИФРОВАННЫЙ СИГНАЛ. ПРОВЕРЬТЕ БРАУЗЕР.", "warn");
                    playSound('notification');
                }

                // 10. Random Email Generation
                let newEmails = [...prev.emails];
                let hasNewMail = false;
                if (Math.random() < 0.002) { // Very rare per tick
                    let type: 'spam' | 'job' | 'threat' | 'story' = 'spam';

                    // Logic
                    if (prev.reputation > 500 && Math.random() > 0.5) type = 'job';
                    if (prev.tracePercent > 20 && Math.random() > 0.7) type = 'threat';

                    // Use type assertion for dynamic access
                    const tplList = (EMAIL_TEMPLATES as any)[type] || EMAIL_TEMPLATES.spam;
                    const tpl = tplList[Math.floor(Math.random() * tplList.length)];

                    newEmails.push({
                        id: `email_${Date.now()}`,
                        sender: type === 'job' ? 'Headhunter' : type === 'threat' ? 'Unknown' : 'SpamBot',
                        subject: tpl.s,
                        body: tpl.b,
                        type: type,
                        isRead: false,
                        timestamp: Date.now()
                    });
                    hasNewMail = true;
                    playSound('notification');
                }

                return {
                    ...prev,
                    timeOfDay: newTime,
                    day: newDay,
                    linesOfCode: newLOC,
                    bugs: newBugs,
                    activeProject: newActiveProject,
                    money: newMoney,
                    temperature: newTemp,
                    energy: Math.max(0, currentEnergy - energyDrain),
                    globalHeat: newHeat,
                    tracePercent: newTrace,
                    marketTrends: newTrends,
                    signalEndTime: newSignalEndTime,
                    bills: newBills,
                    transactions: newTransactions,
                    news: newsGenerated ? newNews.slice(-20) : newNews, // Keep last 20
                    emails: newEmails,
                    hasUnreadMessages: prev.hasUnreadMessages || hasNewMail, // Notification dot
                    ...raidEffect
                };
            });

            // Check achievements after state update
            setTimeout(() => checkAchievements(stateRef.current), 100);
        }, 1000);
        return () => clearInterval(interval);
    }, [isAuthenticated, isLoading, checkAchievements]);

    // --- BANKING HANDLERS ---
    const handlePayBill = (billId: string) => {
        setGameState(prev => {
            const billIndex = prev.bills.findIndex(b => b.id === billId);
            if (billIndex === -1) return prev;

            const bill = prev.bills[billIndex];
            if (prev.money < bill.amount) {
                playSound('error');
                addLog('Недостаточно средств для оплаты счета!', 'error');
                return prev;
            }

            const newBills = [...prev.bills];
            newBills[billIndex] = { ...bill, isPaid: true };

            const newTx: BankTransaction = {
                id: `tx_bill_${Date.now()}`,
                type: 'expense',
                amount: bill.amount,
                category: 'Utilities',
                description: `Paid bill: ${bill.title}`,
                date: Date.now()
            };

            playSound('success');
            addLog(`Счет оплачен: ${bill.title}`, 'success');

            return {
                ...prev,
                money: prev.money - bill.amount,
                bills: newBills,
                transactions: [newTx, ...prev.transactions],
                creditScore: Math.min(850, prev.creditScore + 5)
            };
        });
    };

    const handleTakeLoan = (amount: number) => {
        setGameState(prev => {
            if (prev.loanDebt > 50000) {
                playSound('error');
                addLog('Кредитный лимит исчерпан!', 'error');
                return prev;
            }

            const newTx: BankTransaction = {
                id: `tx_loan_${Date.now()}`,
                type: 'income',
                amount: amount,
                category: 'Loan',
                description: 'Personal Loan approved',
                date: Date.now()
            };

            playSound('success');
            addLog(`Кредит одобрен: +$${amount}`, 'success');

            return {
                ...prev,
                money: prev.money + amount,
                loanDebt: prev.loanDebt + amount,
                transactions: [newTx, ...prev.transactions],
                creditScore: Math.max(300, prev.creditScore - 10)
            };
        });
    };

    const handleRepayLoan = (amount: number) => {
        setGameState(prev => {
            if (prev.money < amount) {
                playSound('error');
                return prev;
            }

            const repayAmount = Math.min(amount, prev.loanDebt);

            const newTx: BankTransaction = {
                id: `tx_repay_${Date.now()}`,
                type: 'expense',
                amount: repayAmount,
                category: 'Loan Repayment',
                description: 'Loan payment',
                date: Date.now()
            };

            playSound('success');
            addLog(`Долг погашен: -$${repayAmount}`, 'success');

            return {
                ...prev,
                money: prev.money - repayAmount,
                loanDebt: prev.loanDebt - repayAmount,
                transactions: [newTx, ...prev.transactions],
                creditScore: Math.min(850, prev.creditScore + 15)
            };
        });
    };

    // LAYER 7: Add Blueprint
    const handleAddBlueprint = (blueprint: Blueprint) => {
        setGameState(prev => ({
            ...prev,
            blueprints: [...prev.blueprints, blueprint]
        }));
        addNotification('Новый чертёж!', `Получен: ${blueprint.name} (${blueprint.tier})`, 'success', '📜');
        playSound('success');
    };

    // LAYER 7: Craft from Blueprint
    const handleCraftBlueprint = (blueprint: Blueprint, craftedItem: any) => {
        // Convert to inventory item
        const newInventoryItem: InventoryItem = {
            uid: `crafted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            itemId: `crafted_${blueprint.type}_${blueprint.tier}`,
            isStolen: blueprint.isStolen || false,
            durability: 100,
        };
        
        setGameState(prev => ({
            ...prev,
            inventory: [...prev.inventory, newInventoryItem],
            // Optionally remove blueprint after crafting (uncomment if needed)
            // blueprints: prev.blueprints.filter(bp => bp.id !== blueprint.id)
        }));
        
        addNotification('Компонент создан!', `${craftedItem.name} добавлен в инвентарь`, 'success', '🔧');
        playSound('success');
    };

    // LAYER 7: Sell Blueprint
    const handleSellBlueprint = (blueprint: Blueprint) => {
        const value = blueprint.marketValue || 100;
        
        setGameState(prev => ({
            ...prev,
            money: prev.money + value,
            blueprints: prev.blueprints.filter(bp => bp.id !== blueprint.id)
        }));
        
        addNotification('Чертёж продан!', `+$${value.toLocaleString()}`, 'success', '💰');
        playSound('success');
    };

    // LAYER 7: Spend money (for crafting)
    const handleSpendMoney = (amount: number) => {
        setGameState(prev => ({
            ...prev,
            money: Math.max(0, prev.money - amount)
        }));
    };

    // LAYER 7: Spend shadow credits (for crafting)
    const handleSpendShadowCredits = (amount: number) => {
        setGameState(prev => ({
            ...prev,
            shadowCredits: Math.max(0, prev.shadowCredits - amount)
        }));
    };

    // LAYER 5: Corporation handlers
    const handleJoinCorp = (corpId: CorporationId) => {
        // Check if already in a corp
        if (gameState.corpMembership?.isActive) {
            addNotification('Ошибка', 'Вы уже состоите в корпорации. Сначала выйдите.', 'error', '🚫');
            playSound('error');
            return;
        }

        // Check reputation (need at least -10)
        const rep = gameState.corporationReps.find(r => r.corporationId === corpId);
        if (rep && rep.reputation < -10) {
            addNotification('Ошибка', 'Ваша репутация слишком низкая для вступления.', 'error', '🚫');
            playSound('error');
            return;
        }

        const newMembership: CorpMembership = {
            corporationId: corpId,
            joinedAt: Date.now(),
            rank: 'recruit',
            xp: 0,
            monthlyDuesPaid: true, // First month free
            privileges: ['access_contracts'],
            contributions: 0,
            questsCompleted: 0,
            isActive: true
        };

        setGameState(prev => ({
            ...prev,
            corpMembership: newMembership
        }));

        const corpName = gameState.corporationReps.find(r => r.corporationId === corpId)?.corporationId || corpId;
        addNotification('Добро пожаловать!', `Вы вступили в корпорацию как Рекрут`, 'success', '🏢');
        playSound('success');
    };

    const handleLeaveCorp = () => {
        if (!gameState.corpMembership?.isActive) {
            return;
        }

        const corpId = gameState.corpMembership.corporationId;
        const rankIndex = ['recruit', 'member', 'specialist', 'manager', 'director', 'executive'].indexOf(gameState.corpMembership.rank);
        const reputationPenalty = (rankIndex + 1) * -5; // -5 to -30

        setGameState(prev => ({
            ...prev,
            corpMembership: undefined,
            corporationReps: prev.corporationReps.map(rep => 
                rep.corporationId === corpId 
                    ? { ...rep, reputation: Math.max(-100, rep.reputation + reputationPenalty) }
                    : rep
            )
        }));

        addNotification('Вы покинули корпорацию', `Штраф репутации: ${reputationPenalty}`, 'info', '🚪');
        playSound('click');
    };

    const handleStartQuest = (quest: CorpQuest) => {
        if (!gameState.corpMembership?.isActive) {
            addNotification('Ошибка', 'Вы не состоите в корпорации', 'error', '🚫');
            return;
        }

        // Check if already on too many quests
        const activeQuests = gameState.activeCorpQuests || [];
        if (activeQuests.length >= 3) {
            addNotification('Ошибка', 'Максимум 3 активных задания', 'error', '🚫');
            return;
        }

        // Check if already doing this quest
        if (activeQuests.some(q => q.id === quest.id)) {
            addNotification('Ошибка', 'Это задание уже активно', 'error', '🚫');
            return;
        }

        const questWithProgress = {
            ...quest,
            startedAt: Date.now(),
            progress: quest.objectives.map(() => 0)
        };

        setGameState(prev => ({
            ...prev,
            activeCorpQuests: [...(prev.activeCorpQuests || []), questWithProgress]
        }));

        addNotification('Задание принято', quest.title, 'success', '📋');
        playSound('success');
    };

    const handleCollectQuestReward = (quest: CorpQuest) => {
        const activeQuests = gameState.activeCorpQuests || [];
        const activeQuest = activeQuests.find(q => q.id === quest.id) as (CorpQuest & { progress?: number[] }) | undefined;
        
        if (!activeQuest) return;

        // Check if all objectives complete
        const isComplete = quest.objectives.every((obj, i) => {
            const progress = activeQuest.progress?.[i] || 0;
            return progress >= obj.target;
        });

        if (!isComplete) {
            addNotification('Задание не завершено', 'Выполните все цели', 'error', '🚫');
            return;
        }

        // Apply rewards
        setGameState(prev => ({
            ...prev,
            money: prev.money + (quest.rewards.money || 0),
            shadowCredits: prev.shadowCredits + (quest.rewards.shadowCredits || 0),
            corporationReps: prev.corporationReps.map(rep =>
                rep.corporationId === quest.corporationId
                    ? { ...rep, reputation: Math.min(100, rep.reputation + (quest.rewards.reputation || 0)) }
                    : rep
            ),
            activeCorpQuests: (prev.activeCorpQuests || []).filter(q => q.id !== quest.id),
            completedCorpQuests: [...(prev.completedCorpQuests || []), quest.id],
            corpMembership: prev.corpMembership ? {
                ...prev.corpMembership,
                xp: prev.corpMembership.xp + (quest.rewards.xp || 50),
                questsCompleted: prev.corpMembership.questsCompleted + 1
            } : undefined
        }));

        addNotification('Награда получена!', `+$${quest.rewards.money || 0}`, 'success', '🎁');
        playSound('success');
    };

    const handlePayCorpDues = () => {
        if (!gameState.corpMembership?.isActive) return;

        const duesAmount = 500; // Base monthly dues
        if (gameState.money < duesAmount) {
            addNotification('Недостаточно средств', `Нужно $${duesAmount}`, 'error', '💰');
            return;
        }

        setGameState(prev => ({
            ...prev,
            money: prev.money - duesAmount,
            corpMembership: prev.corpMembership ? {
                ...prev.corpMembership,
                monthlyDuesPaid: true
            } : undefined
        }));

        addNotification('Взнос оплачен', `$${duesAmount}`, 'success', '✅');
        playSound('success');
    };

    // LAYER 0: Desktop Layout Persistence
    const handleSaveDesktopLayout = (layout: DesktopItem[]) => {
        setGameState(prev => ({
            ...prev,
            desktopLayout: layout
        }));
    };

    const handleRestart = async () => {
        await dbService.deleteSave();
        setGameState(INITIAL_GAME_STATE);
        setIsAuthenticated(false);
        setHasSave(false);
        setView('ROOM');
        setLogs([]);
        window.location.reload(); // Ensure full reset
    };

    // --- ACTIONS ---

    const handleSetLanguage = (lang: Language) => {
        setGameState(prev => ({ ...prev, language: lang }));
    };

    const handleWriteCode = (language: ProgrammingLanguage = 'javascript') => {
        if (gameState.energy <= 0) {
            addLog("Слишком устал... нужно поспать.", "warn");
            playSound('error');
            return;
        }

        const { clickPower, bugChance, unlockedPerks } = stateRef.current;
        const isCrunch = crunchRef.current;
        const multiplier = isCrunch ? 2 : 1;

        const snippets = CODE_SNIPPETS[language] || CODE_SNIPPETS.javascript;
        const snippet = snippets[Math.floor(Math.random() * snippets.length)];
        setWrittenCode(prev => [...prev.slice(-19), snippet]);
        playSound('key');

        setGameState(prev => {
            // LAYER 8: Apply role coding_speed bonus
            const baseGenerated = clickPower * multiplier;
            const generated = playerRoleService.applyRoleBonus(baseGenerated, prev.playerRole, 'coding_speed');

            // Energy Cost Logic
            const energyCost = unlockedPerks?.includes('perk_coffee') ? 0.3 : 0.5;
            const newEnergy = Math.max(0, (prev.energy || 100) - energyCost);

            let newActiveProject = prev.activeProject ? { ...prev.activeProject } : null;
            if (newActiveProject) {
                newActiveProject.progress += generated;
                if (Math.random() < (bugChance * multiplier)) newActiveProject.bugs += 1;
            }

            return {
                ...prev,
                linesOfCode: prev.linesOfCode + generated,
                bugs: Math.random() < (bugChance * multiplier) ? prev.bugs + 1 : prev.bugs,
                energy: newEnergy,
                activeProject: newActiveProject
            };
        });
    };

    const handleSleep = () => {
        setView('ROOM');
        playSound('notification');
        setGameState(prev => {
            const hoursToSleep = 8;
            let newTime = (prev.timeOfDay || 0) + hoursToSleep;
            let newDay = prev.day || 1;
            if (newTime >= 24) {
                newTime -= 24;
                newDay += 1;
            }
            return {
                ...prev,
                energy: 100,
                timeOfDay: newTime,
                day: newDay
            };
        });
        addLog("Вы отлично выспались! Энергия восстановлена.", "success");
    };

    const handleHackSuccess = () => {
        setIsHacking(false);
        playSound('success');
        
        // LAYER 6: Check if this is a Lab hack
        if (hackingContext?.labId) {
            const quest = hackingContext.questId 
                ? labService.getQuests().find(q => q.id === hackingContext.questId)
                : null;
            const lab = labService.getLab(hackingContext.labId);
            
            if (quest) {
                // Complete the quest and get rewards
                const rewards = quest.rewards;
                const shardMult = getShardMultipliers();
                
                setGameState(prev => {
                    const newRep = prev.reputation + Math.floor(rewards.reputation * shardMult.xp);
                    const newMoney = prev.money + Math.floor(rewards.money * shardMult.economy);
                    const newShadowCredits = prev.shadowCredits + rewards.shadowCredits;
                    
                    // Update lab reputation
                    const labsState = { ...(prev.labsState || {}) };
                    labsState[hackingContext.labId!] = {
                        reputation: (labsState[hackingContext.labId!]?.reputation || 0) + rewards.reputation,
                        completedQuests: [...(labsState[hackingContext.labId!]?.completedQuests || []), quest.id]
                    };
                    
                    // Add prototypes if any
                    const newPrototypes = [...(prev.collectedPrototypes || [])];
                    if (rewards.prototypes) {
                        newPrototypes.push(...rewards.prototypes.map(p => ({
                            id: `proto_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            name: p,
                            acquiredAt: Date.now(),
                            sourceLabId: hackingContext.labId!
                        })));
                    }
                    
                    return {
                        ...prev,
                        money: newMoney,
                        shadowCredits: newShadowCredits,
                        reputation: newRep,
                        playerTier: calculateUpdatedTier(newRep),
                        labsState,
                        collectedPrototypes: newPrototypes,
                        hackerStats: updateHackerStats(true, hackingContext?.difficulty || 1, rewards.shadowCredits)
                    };
                });
                
                // Show success modal
                setModalData({
                    title: "🔓 ВЗЛОМ УСПЕШЕН",
                    content: `Лаборатория "${lab?.name || 'Unknown'}" взломана!\n\n💰 +$${quest.rewards.money}\n💀 +${quest.rewards.shadowCredits} SC\n⭐ +${quest.rewards.reputation} репутации\n📊 +${quest.rewards.xp} XP`,
                    type: 'quest_end'
                });
                
                addLog(`Квест "${quest.title}" выполнен! +$${quest.rewards.money}, +${quest.rewards.shadowCredits} SC`, 'success');
            } else {
                // Generic lab hack without quest
                setGameState(prev => {
                    const labsState = { ...(prev.labsState || {}) };
                    labsState[hackingContext.labId!] = {
                        reputation: (labsState[hackingContext.labId!]?.reputation || 0) + 10,
                        completedQuests: labsState[hackingContext.labId!]?.completedQuests || []
                    };
                    return {
                        ...prev,
                        shadowCredits: prev.shadowCredits + 50,
                        reputation: prev.reputation + 25,
                        labsState,
                        hackerStats: updateHackerStats(true, hackingContext?.difficulty || 1, 50)
                    };
                });
                addLog(`Лаборатория взломана! +50 SC, +25 репутации`, 'success');
            }
            
            setHackingContext(null);
            return;
        }
        
        // Original DarkHub hack logic
        const duration = 2 * 60 * 60 * 1000; // 2 hours access
        setGameState(prev => {
            const newRep = prev.reputation + 100;
            return {
                ...prev,
                isShadowMarketUnlocked: true,
                shadowAccessExpiry: Date.now() + duration,
                reputation: newRep,
                playerTier: calculateUpdatedTier(newRep),
                currentQuestIndex: prev.currentQuestIndex + 1,
                signalEndTime: 0, // Clear signal
                hackerStats: updateHackerStats(true, hackingContext?.difficulty || 1, 0)
            };
        });
        setModalData({
            title: "СВЯЗЬ УСТАНОВЛЕНА",
            content: `Шлюз взломан. Канал доступа к DarkHub открыт на 2 часа. Поторопись.`,
            type: 'quest_end'
        });
    };

    const handleHackFail = () => {
        setIsHacking(false);
        playSound('error');
        
        // LAYER 6: Handle Lab hack failure
        if (hackingContext?.labId) {
            setGameState(prev => ({
                ...prev,
                tracePercent: Math.min(100, prev.tracePercent + 15),
                globalHeat: Math.min(100, prev.globalHeat + 5),
                hackerStats: updateHackerStats(false, hackingContext?.difficulty || 1, 0)
            }));
            addLog("Взлом лаборатории провален! Уровень угрозы повышен.", "error");
            setHackingContext(null);
            return;
        }
        
        setGameState(prev => ({
            ...prev,
            tracePercent: Math.min(100, prev.tracePercent + 20),
            globalHeat: Math.min(100, prev.globalHeat + 10),
            signalEndTime: 0, // Lose signal
            hackerStats: updateHackerStats(false, hackingContext?.difficulty || 1, 0)
        }));
        addLog("Взлом не удался. Сигнал потерян. Уровень угрозы повышен!", "error");
    };

    // LAYER 6: Updated hack start to accept lab context + LAYER 14: Difficulty
    const handleHackStart = (labId?: string, questId?: string) => {
        let difficulty = 1;
        
        if (labId) {
            // Get difficulty from quest or lab tier
            if (questId) {
                const quest = labService.getQuests().find(q => q.id === questId);
                if (quest) {
                    difficulty = quest.difficulty || 3;
                }
            } else {
                const lab = labService.getLab(labId);
                if (lab) {
                    difficulty = lab.tier; // Lab tier 1-5
                }
            }
            
            setHackingContext({ labId, questId, difficulty });
            addLog(`INITIATING BREACH PROTOCOL: ${labId} [DIFFICULTY: ${difficulty}]...`, "warn");
        } else {
            // Default DarkHub hack - medium difficulty
            setHackingContext({ difficulty: 3 });
            addLog("INITIATING BREACH PROTOCOL...", "warn");
        }
        setIsHacking(true);
    };

    const handleConsoleSubmit = (cmd: string) => {
        setWrittenCode(prev => [...prev.slice(-19), cmd]);
        // Quest Logic
        const currentQuest = LEARNING_QUESTS[gameState.currentQuestIndex];

        // Special check for Shadow Market quest (The Gate)
        if (LEARNING_QUESTS[2] && LEARNING_QUESTS[2].solutionRegex.test(cmd.trim())) {
            if (gameState.isShadowMarketUnlocked) {
                addLog("Соединение уже установлено.", "warn");
            } else {
                handleHackStart();
            }
            return;
        }

        if (currentQuest && currentQuest.solutionRegex.test(cmd.trim())) {
            playSound('success');
            addLog(`Квест "${currentQuest.title}" выполнен!`, 'success');
            
            // LAYER 4: Apply shard multipliers
            const shardMult = getShardMultipliers();
            const moneyReward = Math.floor(currentQuest.rewardMoney * shardMult.economy);
            const xpReward = Math.floor(currentQuest.rewardExp * shardMult.xp);
            
            setGameState(prev => {
                const newRep = prev.reputation + xpReward;
                const newTier = calculateUpdatedTier(newRep);
                return {
                    ...prev,
                    money: prev.money + moneyReward,
                    reputation: newRep,
                    playerTier: newTier,
                    currentQuestIndex: prev.currentQuestIndex + 1
                };
            });
            setModalData({
                title: "ЗАДАЧА ВЫПОЛНЕНА",
                content: `Получено: $${moneyReward}${shardMult.economy !== 1 ? ` (x${shardMult.economy})` : ''} | XP: +${xpReward}${shardMult.xp !== 1 ? ` (x${shardMult.xp})` : ''}`,
                explanation: currentQuest.explanation,
                type: 'quest_end'
            });
        } else {
            addLog(`Command executed: ${cmd}`, 'info');
        }
    };

    const handleStartProject = (template: ProjectTemplate) => {
        const newProject: Project = {
            ...template,
            progress: 0,
            bugs: 0,
            stage: 'dev'
        };

        setGameState(prev => ({
            ...prev,
            activeProject: newProject
        }));
        addLog(`Начата разработка: ${template.name}`, 'info');
        addNotification('✓ Проект создан', `Разработка "${template.name}" началась!`, 'success', '🚀');

        // Persist project to DevFS (background)
        (async () => {
            try {
                await devFsService.init();
                await devFsService.saveProject(template.id, newProject);
                console.info('[App] Saved project to DevFS:', template.id);
            } catch (e) {
                console.error('[App] Failed to persist project to DevFS', e);
                addNotification('⚠ Ошибка сохранения', 'Не удалось сохранить проект в хранилище', 'error');
            }
        })();
    };

    const handleReleaseProject = () => {
        if (gameState.activeProject) {
            const released = { ...gameState.activeProject, stage: 'released' as const, releasedAt: Date.now() };

            // Check if this is the AGI project (Victory Condition)
            const isAGIProject = released.id === 'proj_agi';

            setGameState(prev => {
                const newRep = prev.reputation + (released.difficulty * 10);
                return {
                    ...prev,
                    activeProject: null,
                    releasedProjects: [...(prev.releasedProjects || []), released],
                    reputation: newRep,
                    playerTier: calculateUpdatedTier(newRep),
                    isGameWon: isAGIProject // Trigger victory screen
                };
            });

            addLog(`Проект "${released.name}" выпущен на рынок!`, 'success');
            addNotification('🚀 Релиз успешен!', `"${released.name}" теперь приносит $${released.baseRevenue}/день`, 'success');

            // Save released project to DevFS (background)
            (async () => {
                try {
                    await devFsService.init();
                    await devFsService.saveProject(released.id, released);
                    console.info('[App] Updated project in DevFS:', released.id);
                } catch (e) {
                    console.error('[App] Failed to update project in DevFS', e);
                    addNotification('⚠ Ошибка сохранения', 'Не удалось сохранить обновленный проект', 'error');
                }
            })();

            if (isAGIProject) {
                playSound('success');
                addLog('🎆 СИНГУЛЯРНОСТЬ ДОСТИГНУТА! ВЫ ПОБЕДИЛИ! 🎆', 'success');
            } else {
                setModalData({
                    title: "РЕЛИЗ УСПЕШЕН!",
                    content: `Проект ${released.name} теперь приносит доход. Продолжай в том же духе!`,
                    type: 'quest_end'
                });
            }
        }
    };

    const handleDeleteProject = (projectId: string) => {
        const deletedProject = gameState.releasedProjects.find(p => p.id === projectId);
        
        setGameState(prev => ({
            ...prev,
            releasedProjects: prev.releasedProjects.filter(p => p.id !== projectId)
        }));

        addLog(`Проект удален`, 'info');
        addNotification('✓ Проект удален', deletedProject ? `"${deletedProject.name}" удален из хранилища` : 'Проект успешно удален', 'success');

        // Delete project from DevFS (background)
        (async () => {
            try {
                await devFsService.init();
                await devFsService.deleteProject(projectId);
                console.info('[App] Deleted project from DevFS:', projectId);
            } catch (e) {
                console.error('[App] Failed to delete project from DevFS', e);
                addNotification('Ошибка', 'Не удалось удалить проект', 'error');
            }
        })();
    };

    const handleInstallApp = (name: string, icon: string, code: string, domain?: string) => {
        const newApp: UserApp = {
            id: `app_${Date.now()}`,
            name,
            icon,
            code,
            domain,
            createdAt: Date.now()
        };
        setGameState(prev => ({
            ...prev,
            userApps: [...(prev.userApps || []), newApp]
        }));
        if (domain) {
            addLog(`Сайт развернут: ang://${domain}`, 'success');
        } else {
            addLog(`Приложение установлено: ${name}`, 'success');
        }
    };

    const handleUninstallApp = (appId: string) => {
        const appName = gameState.userApps.find(a => a.id === appId)?.name || 'Unknown App';
        setGameState(prev => ({
            ...prev,
            userApps: (prev.userApps || []).filter(app => app.id !== appId)
        }));
        addLog(`Приложение удалено: ${appName}`, 'warn');
    };

    const handleUnlockPerk = (id: string, cost: number) => {
        const perk = SKILL_TREE.find(p => p.id === id);
        setGameState(prev => {
            if (prev.reputation < cost || prev.unlockedPerks.includes(id)) return prev;

            const newPerks = [...prev.unlockedPerks, id];
            const newRep = prev.reputation - cost;
            const stats = calculateTotalStats(prev.equipped, prev.inventory, newPerks);

            return {
                ...prev,
                reputation: newRep,
                playerTier: calculateUpdatedTier(newRep),
                unlockedPerks: newPerks,
                clickPower: stats.clickPower,
                autoCodePerSecond: stats.autoCode,
                bugChance: stats.bugChance
            };
        });
        addLog(`Навык изучен: ${perk?.name}`, 'success');
    };

    // REFACTORED: Buy generates a unique item instance
    const handleBuy = (itemId: string, isShadow = false) => {
        const item = HARDWARE_CATALOG.find(i => i.id === itemId);
        if (!item) return;

        setGameState(prev => {
            // Apply Market Trends for legit items
            let cost = item.cost;
            if (!isShadow && prev.marketTrends && prev.marketTrends[item.type]) {
                cost = Math.floor(cost * prev.marketTrends[item.type]);
            }
            
            // LAYER 8: Apply engineer role hardware_discount (negative bonus = discount)
            // Engineer gets -15% cost, so we invert: cost * (1 - bonus/100)
            if (!isShadow && prev.playerRole === 'engineer') {
                const discount = playerRoleService.getRole('engineer')?.bonuses.find(b => b.type === 'hardware_discount');
                if (discount) {
                    cost = Math.floor(cost * (1 - discount.value / 100));
                }
            }

            if (isShadow) {
                if (prev.shadowCredits < (item.shadowCost || 0)) {
                    playSound('error');
                    addLog("Недостаточно ShadowCredits!", "error");
                    return prev;
                }
            } else {
                if (prev.money < cost) {
                    playSound('error');
                    addLog("Недостаточно средств!", "error");
                    return prev;
                }
            }

            playSound('success');

            // GENERATE UNIQUE INSTANCE
            const newInstance: InventoryItem = {
                uid: `${itemId}_${Math.random().toString(36).substr(2, 9)}`,
                itemId: itemId,
                isStolen: isShadow, // Stolen if bought from shadow market
                durability: 100
            };

            const newInventory = [...prev.inventory, newInstance];

            return {
                ...prev,
                money: isShadow ? prev.money : prev.money - cost,
                shadowCredits: isShadow ? prev.shadowCredits - (item.shadowCost || 0) : prev.shadowCredits,
                inventory: newInventory,
                globalHeat: isShadow ? Math.min(100, prev.globalHeat + 5) : prev.globalHeat
            };
        });
        addLog(`Куплено: ${item.name}`, 'success');
    };

    // REFACTORED: Sell requires UID and checks isStolen
    const handleSell = (itemUid: string, value: number) => {
        setGameState(prev => {
            const invItem = prev.inventory.find(i => i.uid === itemUid);
            if (!invItem) return prev;

            const catalogItem = HARDWARE_CATALOG.find(i => i.id === invItem.itemId);

            if (invItem.isStolen) {
                playSound('error');
                addLog("ОШИБКА: Товар помечен как украденный. Нужна очистка.", "error");
                return prev;
            }

            // Remove from inventory
            const newInventory = prev.inventory.filter(i => i.uid !== itemUid);

            // Handle equipped items (Unequip if selling)
            let newEquipped = { ...prev.equipped };
            if (catalogItem) {
                const type = catalogItem.type;
                if (newEquipped[type] === itemUid) {
                    const fallbackItem = newInventory.find(i => HARDWARE_CATALOG.find(h => h.id === i.itemId)?.type === type);
                    if (fallbackItem) {
                        newEquipped[type] = fallbackItem.uid;
                    } else {
                        if (newEquipped[type] === itemUid) {
                            addLog("Нельзя продать экипированный предмет!", "error");
                            return prev;
                        }
                    }
                }
            }

            const stats = calculateTotalStats(newEquipped, newInventory, prev.unlockedPerks);

            // LAYER 4: Apply shard economy multiplier to sales
            const shardMult = getShardMultipliers();
            let finalValue = Math.floor(value * shardMult.economy);
            
            // LAYER 8: Apply trader role trade_bonus
            finalValue = Math.floor(playerRoleService.applyRoleBonus(finalValue, prev.playerRole, 'trade_bonus'));

            return {
                ...prev,
                inventory: newInventory,
                equipped: newEquipped,
                money: prev.money + finalValue,
                clickPower: stats.clickPower,
                autoCodePerSecond: stats.autoCode,
                bugChance: stats.bugChance,
            };
        });
        
        const shardMult = getShardMultipliers();
        const finalValue = Math.floor(value * shardMult.economy);
        playSound('success');
        addLog(`Товар продан на CyberBay за $${finalValue}${shardMult.economy !== 1 ? ` (x${shardMult.economy})` : ''}`, 'success');
    };

    // REFACTORED: Clean item by UID
    const handleCleanItem = (itemUid: string) => {
        setGameState(prev => {
            const hasFlasher = prev.inventory.some(i => i.itemId === 'tool_flasher');
            if (!hasFlasher) {
                playSound('error');
                addLog("Требуется Hardware Flasher!", 'error');
                return prev;
            }

            const itemIndex = prev.inventory.findIndex(i => i.uid === itemUid);
            if (itemIndex === -1) return prev;

            playSound('success');

            // Mutate inventory
            const newInventory = [...prev.inventory];
            newInventory[itemIndex] = {
                ...newInventory[itemIndex],
                isStolen: false
            };

            addLog(`Серийный номер очищен. Товар легализован.`, 'success');

            return {
                ...prev,
                inventory: newInventory
            };
        });
    };

    // Exchange Money -> ShadowCredits
    const handleExchange = (amountUSD: number) => {
        setGameState(prev => {
            const rate = Math.max(0.1, 1 - (prev.globalHeat / 150));
            const sc = Math.floor(amountUSD * rate);
            return {
                ...prev,
                money: prev.money - amountUSD,
                shadowCredits: prev.shadowCredits + sc
            };
        });
        playSound('click');
        addLog(`Средства обменены.`, 'info');
    };

    // REFACTORED: Equip item by UID
    const handleEquipInternal = (itemUid: string) => {
        playSound('click');
        setGameState(prev => {
            const invItem = prev.inventory.find(i => i.uid === itemUid);
            if (!invItem) return prev;

            const catalogItem = HARDWARE_CATALOG.find(h => h.id === invItem.itemId);
            if (!catalogItem) return prev;

            const newEquipped = { ...prev.equipped, [catalogItem.type]: itemUid };
            const stats = calculateTotalStats(newEquipped, prev.inventory, prev.unlockedPerks);

            return {
                ...prev,
                equipped: newEquipped,
                clickPower: stats.clickPower,
                autoCodePerSecond: stats.autoCode,
                bugChance: stats.bugChance
            };
        });
        const name = HARDWARE_CATALOG.find(h => h.id === gameState.inventory.find(i => i.uid === itemUid)?.itemId)?.name;
        addLog(`Установлено: ${name}`, 'success');
    };

    const handleChatSend = (text: string, channel: 'general' | 'trade' | 'shadow_net') => {
        const msg: ChatMessage = {
            id: Math.random().toString(),
            sender: gameState.username,
            text,
            channel,
            timestamp: Date.now(),
            isMe: true
        };
        setChatMessages(prev => [...prev.slice(-49), msg]);
    };

    // --- FILE SYSTEM ACTIONS ---
    const handleCreateFile = (parentId: string, name: string, type: 'file' | 'folder') => {
        const { totalCapacity, usedGB } = calculateStorage();
        if (type === 'file' && usedGB >= totalCapacity) {
            addLog("ОШИБКА: Диск переполнен. Купите SSD.", "error");
            playSound('error');
            return;
        }

        const newItem: FileNode = {
            id: `node_${Date.now()}`,
            name,
            type,
            createdAt: Date.now(),
            children: type === 'folder' ? [] : undefined,
            content: type === 'file' ? '// New file' : undefined,
            language: 'javascript'
        };

        const updateTree = (node: FileNode): FileNode => {
            if (node.id === parentId && node.type === 'folder') {
                return { ...node, children: [...(node.children || []), newItem] };
            }
            if (node.children) {
                return { ...node, children: node.children.map(updateTree) };
            }
            return node;
        };

        // compute parent path from current snapshot before mutating state
        try {
            const findPathById = (node: FileNode, targetId: string, parentPath = ''): string | null => {
                const nameN = node.name === '/' ? '' : node.name;
                const currentPath = parentPath === '' ? (nameN ? `/${nameN}` : '/') : `${parentPath}${nameN ? `/${nameN}` : ''}`;
                if (node.id === targetId) return currentPath === '' ? '/' : currentPath;
                if (node.children) {
                    for (const child of node.children) {
                        const res = findPathById(child, targetId, currentPath === '/' ? '' : currentPath);
                        if (res) return res;
                    }
                }
                return null;
            };

            const root = gameState.fileSystem;
            const parentPath = findPathById(root, parentId) || '/';

            // Update in-memory first
            setGameState(prev => ({
                ...prev,
                fileSystem: updateTree(prev.fileSystem)
            }));
            playSound('success');

            // Async: sync to DevFS
            (async () => {
                try {
                    await devFsService.init();

                    // Ensure parent folders exist in DevFS
                    const segments = parentPath.split('/').filter(Boolean);
                    let acc = '';
                    for (let i = 0; i < segments.length; i++) {
                        acc = acc + '/' + segments[i];
                        const folderEntry = await devFsService.getEntry(acc);
                        if (!folderEntry) {
                            await devFsService.createFolder(acc);
                        }
                    }

                    const filePath = parentPath === '/' ? `/${name}` : `${parentPath.replace(/\/$/, '')}/${name}`;
                    if (type === 'folder') {
                        const existing = await devFsService.getEntry(filePath);
                        if (!existing) {
                            await devFsService.createFolder(filePath);
                            console.info('[App] DevFS: created folder', filePath);
                        }
                    } else {
                        const existing = await devFsService.getEntry(filePath);
                        if (!existing) {
                            await devFsService.createFile(filePath, '// New file');
                            console.info('[App] DevFS: created file', filePath);
                        }
                    }
                } catch (e) {
                    console.warn('[App] DevFS sync failed during create', e);
                }
            })();
        } catch (err) {
            // Fallback behaviour: still update state
            setGameState(prev => ({
                ...prev,
                fileSystem: updateTree(prev.fileSystem)
            }));
            playSound('success');
        }
    };

    const handleDeleteFile = (nodeId: string) => {
        if (nodeId === 'root') return;

        // Determine path before removing node from state
        const findPathById = (node: FileNode, targetId: string, parentPath = ''): string | null => {
            const name = node.name === '/' ? '' : node.name;
            const currentPath = parentPath === '' ? (name ? `/${name}` : '/') : `${parentPath}${name ? `/${name}` : ''}`;
            if (node.id === targetId) return currentPath === '' ? '/' : currentPath;
            if (node.children) {
                for (const child of node.children) {
                    const res = findPathById(child, targetId, currentPath === '/' ? '' : currentPath);
                    if (res) return res;
                }
            }
            return null;
        };

        const root = gameState.fileSystem;
        const targetPath = findPathById(root, nodeId);

        const updateTree = (node: FileNode): FileNode => {
            if (node.children) {
                return { ...node, children: node.children.filter(n => n.id !== nodeId).map(updateTree) };
            }
            return node;
        };

        setGameState(prev => ({
            ...prev,
            fileSystem: updateTree(prev.fileSystem)
        }));
        playSound('notification');

        // Async: remove from DevFS if exists
        (async () => {
            try {
                if (!targetPath) return;
                await devFsService.init();
                const existing = await devFsService.getEntry(targetPath);
                if (existing) {
                    if (existing.type === 'folder') {
                        // If the folder contains many items, collect them (for undo) and confirm with the user
                        let toDelete: any[] = [];
                        try {
                            const all = await dbService.getAll<any>('devFS');
                            const prefix = targetPath === '/' ? '/' : targetPath.replace(/\/$/, '') + '/';
                            toDelete = all.filter(e => e.id === targetPath || e.id.startsWith(prefix));
                        } catch (e) {
                            // ignore counting errors and proceed
                        }

                        // Store snapshot for undo (10s window)
                        if (toDelete.length > 0) {
                            setLastDeletedSnapshot({ entries: toDelete, expiresAt: Date.now() + 10000 });
                            if (lastDeletedTimer.current) window.clearTimeout(lastDeletedTimer.current);
                            lastDeletedTimer.current = window.setTimeout(() => setLastDeletedSnapshot(null), 10000) as unknown as number;
                        }

                        if (toDelete.length > 10) {
                            // show app-native modal
                            await new Promise<void>((resolve) => {
                                confirmPayload.current = {
                                    path: targetPath,
                                    count: toDelete.length,
                                    onConfirm: () => resolve()
                                };
                                setConfirmOpen(true);
                            });
                            setConfirmOpen(false);
                        }

                        await devFsService.deleteEntry(targetPath, true);
                        console.info('[App] DevFS: recursively deleted', targetPath);
                        addNotification('Deleted', `Deleted ${toDelete.length} items. Undo available for 10s.`, 'info');
                    } else {
                        // file: store snapshot and delete
                        const existingEntry = existing as any;
                        setLastDeletedSnapshot({ entries: [existingEntry], expiresAt: Date.now() + 10000 });
                        if (lastDeletedTimer.current) window.clearTimeout(lastDeletedTimer.current);
                        lastDeletedTimer.current = window.setTimeout(() => setLastDeletedSnapshot(null), 10000) as unknown as number;

                        await dbService.delete('devFS', targetPath);
                        console.info('[App] DevFS: deleted', targetPath);
                        addNotification('Deleted', `Deleted ${targetPath}. Undo available for 10s.`, 'info');
                    }
                }
            } catch (e) {
                console.warn('[App] DevFS delete failed', e);
            }
        })();
    };

    const handleUpdateFile = (nodeId: string, content: string) => {
        const updateTree = (node: FileNode): FileNode => {
            if (node.id === nodeId) {
                return { ...node, content };
            }
            if (node.children) {
                return { ...node, children: node.children.map(updateTree) };
            }
            return node;
        };

        // Update in-memory state immediately
        setGameState(prev => ({
            ...prev,
            fileSystem: updateTree(prev.fileSystem)
        }));

        // Helper: find path for a node id in FileNode tree
        const findPathById = (node: FileNode, targetId: string, parentPath = ''): string | null => {
            const name = node.name === '/' ? '' : node.name;
            const currentPath = parentPath === '' ? (name ? `/${name}` : '/') : `${parentPath}${name ? `/${name}` : ''}`;
            if (node.id === targetId) {
                return currentPath === '' ? '/' : currentPath;
            }
            if (node.children) {
                for (const child of node.children) {
                    const res = findPathById(child, targetId, currentPath === '/' ? '' : currentPath);
                    if (res) return res;
                }
            }
            return null;
        };

        // compute path using the current gameState snapshot
        try {
            const root = gameState.fileSystem;
            const filePath = findPathById(root, nodeId);
            if (!filePath) {
                console.warn('[App] Could not resolve path for nodeId', nodeId);
                return;
            }

            (async () => {
                try {
                    await devFsService.init();

                    // ensure parent folders exist
                    const segments = filePath.split('/').filter(Boolean);
                    let acc = '';
                    for (let i = 0; i < segments.length - 1; i++) {
                        acc = acc + '/' + segments[i];
                        const folderEntry = await devFsService.getEntry(acc);
                        if (!folderEntry) {
                            await devFsService.createFolder(acc);
                        }
                    }

                    const name = segments[segments.length - 1] || '';
                    const parentPath = segments.length > 1 ? '/' + segments.slice(0, -1).join('/') : '/';

                    const existing = await devFsService.getEntry(filePath);
                    if (!existing) {
                        await devFsService.createFile(filePath, content);
                        console.info('[App] DevFS: created file', filePath);
                    } else {
                        // Use service update (createFile is upsert) so versioning hooks trigger
                        await devFsService.createFile(filePath, content);
                        console.info('[App] DevFS: updated file (via service)', filePath);
                    }
                } catch (e) {
                    console.error('[App] Failed to sync file to DevFS', nodeId, e);
                }
            })();
        } catch (e) {
            console.error('[App] handleUpdateFile path resolution failed', e);
        }
    };

    const handleDismissNotification = (id: string) => {
        setGameState(prev => ({
            ...prev,
            notifications: prev.notifications.filter(n => n.id !== id)
        }));
    };

    // Restore last deleted entries (undo)
    const restoreLastDeleted = async () => {
        const snap = lastDeletedSnapshot;
        if (!snap || !snap.entries || snap.entries.length === 0) return;
        try {
            await dbService.init();
            // Recreate entries in DB
            for (const e of snap.entries) {
                try {
                    // Explicitly provide key for legacy out-of-line devFS stores
                    await dbService.add('devFS', e, e.id);
                } catch (err) {
                    console.warn('[App] restore entry failed', e.id, err);
                }
            }

            // Rebuild in-memory file system from DB
            const all = await dbService.getAll<any>('devFS');
            const buildTree = (entries: any[]) => {
                const map = new Map<string, any>();
                const root: FileNode = { id: '/', name: '/', type: 'folder', children: [], createdAt: Date.now() };
                map.set('/', root);
                entries.forEach(ent => {
                    const node = { ...ent, children: ent.type === 'folder' ? [] : undefined };
                    map.set(ent.id, node);
                });
                entries.forEach(ent => {
                    const parentId = ent.parentId || '/';
                    const parent = map.get(parentId) || root;
                    if (!parent.children) parent.children = [];
                    parent.children.push(map.get(ent.id));
                });
                return root;
            };

            const tree = buildTree(all);
            setGameState(prev => ({ ...prev, fileSystem: tree }));

            addNotification('Undo', `Restored ${snap.entries.length} items.`, 'success');
            setLastDeletedSnapshot(null);
            if (lastDeletedTimer.current) window.clearTimeout(lastDeletedTimer.current);
        } catch (e) {
            console.warn('[App] restore failed', e);
            addNotification('Undo failed', 'Could not restore deleted items', 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-screen bg-black flex flex-col items-center justify-center font-mono text-green-500">
                <MatrixBackground />
                <div className="text-2xl font-bold animate-pulse mb-4">SYSTEM BOOT SEQUENCE...</div>
                <div className="w-64 h-2 bg-slate-800 rounded overflow-hidden">
                    <div className="h-full bg-green-500 animate-float-up w-full origin-left transition-all duration-[1500ms]"></div>
                </div>
                <div className="mt-4 text-xs text-slate-500">Connecting to secure node...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthScreen hasSave={hasSave} onLogin={handleLogin} onRegister={handleRegister} />;
    }

    // LAYER 4: Shard Selection - показываем после авторизации, если шард не выбран
    if (!hasSelectedShard) {
        const handleShardSelect = (shardId: string) => {
            setHasSelectedShard(true);
            const shard = shardService.getShard(shardId);
            if (shard) {
                addNotification(
                    '🌐 Подключено к серверу',
                    `${shard.name} (${shard.region})`,
                    'success',
                    '🚀',
                    5000
                );
                addLog(`Подключение к серверу ${shard.name} успешно.`, 'success');
            }
        };
        
        return (
            <ShardSelector 
                onSelect={handleShardSelect}
                username={gameState.username}
            />
        );
    }

    const storageStats = calculateStorage();

    return (
        <div className="w-full h-screen bg-black text-slate-200 overflow-hidden font-sans">
            <MatrixBackground />

            {gameState.isGameWon && (
                <EndingScreen gameState={gameState} onRestart={handleRestart} />
            )}

            {/* MODALS */}
            {modalData && (
                <StoryModal
                    title={modalData.title}
                    content={modalData.content}
                    type={modalData.type}
                    explanation={modalData.explanation}
                    onClose={() => setModalData(null)}
                />
            )}

            {isHacking && (
                <HackingMinigame
                    onSuccess={handleHackSuccess}
                    onFail={handleHackFail}
                    difficulty={hackingContext?.difficulty || 1}
                />
            )}

            {/* Confirm Modal for destructive actions */}
            <ConfirmModal
                open={confirmOpen}
                title={confirmPayload.current ? `Удалить ${confirmPayload.current.count || 0} элементов?` : 'Подтвердите удаление'}
                message={confirmPayload.current ? `Вы уверены, что хотите удалить ${confirmPayload.current.count || 0} элементов в ${confirmPayload.current.path || ''}? Это действие можно отменить в течение 10 секунд.` : ''}
                confirmLabel="Удалить"
                cancelLabel="Отмена"
                onConfirm={() => {
                    setConfirmOpen(false);
                    try {
                        confirmPayload.current?.onConfirm?.();
                    } catch (e) {
                        console.warn('confirm onConfirm error', e);
                    }
                    confirmPayload.current = null;
                }}
                onCancel={() => { setConfirmOpen(false); confirmPayload.current = null; }}
            />

            {isPCBuildMode && (
                <PCInternals
                    state={gameState}
                    onClose={() => setIsPCBuildMode(false)}
                    onEquip={handleEquipInternal}
                />
            )}

            {isJournalOpen && (
                <JournalApp
                    state={gameState}
                    onClose={() => setIsJournalOpen(false)}
                />
            )}

            {view === 'ROOM' ? (
                <Room
                    state={gameState}
                    onEnterComputer={() => { playSound('click'); setView('DESKTOP'); }}
                    onOpenPCInternals={() => { playSound('click'); setIsPCBuildMode(true); }}
                    onSleep={handleSleep}
                    onOpenJournal={() => { console.log('onOpenJournal called!'); playSound('click'); setIsJournalOpen(true); }}
                    onEquipItem={handleEquipInternal}
                    onCleanItem={handleCleanItem}
                />
            ) : (
                <Desktop
                    state={gameState}
                    activeProject={gameState.activeProject}
                    logs={logs}
                    chatMessages={chatMessages}
                    onExit={() => setView('ROOM')}
                    onBuy={handleBuy}
                    onSell={handleSell}
                    onCode={handleWriteCode}
                    onDeploy={() => { }}
                    onConsoleSubmit={handleConsoleSubmit}
                    onStartProject={handleStartProject}
                    onReleaseProject={handleReleaseProject}
                    onDeleteProject={handleDeleteProject}
                    onInstallApp={handleInstallApp}
                    onUninstallApp={handleUninstallApp}
                    onUnlockPerk={handleUnlockPerk}
                    onChatSend={handleChatSend}
                    onExchange={handleExchange}
                    writtenCode={writtenCode}
                    isCrunchMode={isCrunchMode}
                    // File System Props
                    onCreateFile={handleCreateFile}
                    onDeleteFile={handleDeleteFile}
                    onUpdateFile={handleUpdateFile}
                    onRenameFile={handleRenameFile}
                    storageStats={storageStats}
                    onSetLanguage={handleSetLanguage}
                    onStartHack={handleHackStart}
                    // Bank Props
                    onPayBill={handlePayBill}
                    onTakeLoan={handleTakeLoan}
                    onRepayLoan={handleRepayLoan}
                    onNotify={addNotification}
                    // LAYER 7: Blueprints
                    onAddBlueprint={handleAddBlueprint}
                    onCraftBlueprint={handleCraftBlueprint}
                    onSellBlueprint={handleSellBlueprint}
                    onSpendMoney={handleSpendMoney}
                    onSpendShadowCredits={handleSpendShadowCredits}
                    // LAYER 5: Corporations
                    onJoinCorp={handleJoinCorp}
                    onLeaveCorp={handleLeaveCorp}
                    onStartQuest={handleStartQuest}
                    onCollectReward={handleCollectQuestReward}
                    onPayDues={handlePayCorpDues}
                    // LAYER 0: Desktop Layout
                    onSaveDesktopLayout={handleSaveDesktopLayout}
                />
            )}

            {/* LAYER 15: IDS Overlay - Security Notifications */}
            <IDSOverlay enabled={true} maxNotifications={5} autoHideDelay={8000} />

            {/* Notification System */}
            <NotificationContainer
                notifications={gameState.notifications}
                onDismiss={handleDismissNotification}
            />

            {/* Undo snackbar for recent deletions (полировка: RU текст + таймер) */}
            {lastDeletedSnapshot && (
                <UndoSnackbar snapshot={lastDeletedSnapshot} onUndo={restoreLastDeleted} />
            )}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 right-4 z-50">

                </div>
            )}
        </div>
    );
}
