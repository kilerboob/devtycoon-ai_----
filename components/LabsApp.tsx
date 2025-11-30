/**
 * LAYER 6: LabsApp Component
 * Приложение для независимых лабораторий
 * Квесты на взлом, прототипы, исследования
 */

import React, { useState, useMemo } from 'react';
import { labService, IndependentLab, LabQuest, LabType, Prototype } from '../services/labService';
import { GameState, HackerRank } from '../types';

interface LabsAppProps {
    state: GameState;
    onStartHack: (labId: string, questId?: string) => void;
    onClose: () => void;
}

type TabType = 'labs' | 'quests' | 'prototypes' | 'map' | 'stats';

export const LabsApp: React.FC<LabsAppProps> = ({ state, onStartHack, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('labs');
    const [selectedLab, setSelectedLab] = useState<IndependentLab | null>(null);
    const [filterZone, setFilterZone] = useState<string>('all');
    const [filterType, setFilterType] = useState<LabType | 'all'>('all');
    const [sortBy, setSortBy] = useState<'tier' | 'security' | 'name'>('tier');

    const zones = labService.getZones();
    const allLabs = labService.getLabs();
    
    // Calculate player's hack power (simplified)
    const playerHackPower = useMemo(() => {
        const baseHackPower = (typeof state.level === 'number' ? state.level : 1) * 5;
        // Get hack boost from equipped items
        const equippedIds = Object.values(state.equipped || {}).filter(Boolean) as string[];
        const equipmentBonus = equippedIds.reduce((sum: number, eqId: string) => {
            const item = state.inventory.find(i => i.uid === eqId || i.itemId === eqId);
            return sum + ((item as any)?.stats?.hackBoost || 0);
        }, 0);
        return baseHackPower + equipmentBonus + (state.clickPower || 1);
    }, [state.level, state.equipped, state.inventory, state.clickPower]);

    // Filter and sort labs
    const filteredLabs = useMemo(() => {
        let labs = allLabs;
        
        if (filterZone !== 'all') {
            labs = labs.filter(l => l.location.zone === filterZone);
        }
        if (filterType !== 'all') {
            labs = labs.filter(l => l.type === filterType);
        }
        
        return labs.sort((a, b) => {
            if (sortBy === 'tier') return b.tier - a.tier;
            if (sortBy === 'security') return b.security.level - a.security.level;
            return a.name.localeCompare(b.name);
        });
    }, [allLabs, filterZone, filterType, sortBy]);

    // Available quests for player
    const playerLevel = typeof state.level === 'number' ? state.level : 1;
    const availableQuests = useMemo(() => {
        return labService.getAvailableQuests(playerLevel, playerHackPower);
    }, [playerLevel, playerHackPower]);

    // Get prototypes
    const prototypes = labService.getPrototypes();
    const prototypeTemplates = labService.getPrototypeTemplates();

    const renderLabCard = (lab: IndependentLab) => {
        const typeInfo = labService.getLabTypeInfo(lab.type);
        const hackChance = labService.calculateHackChance(lab.id, playerHackPower);
        const isOnCooldown = lab.cooldownUntil && Date.now() < lab.cooldownUntil;
        
        const statusColors: Record<string, string> = {
            active: 'bg-green-500',
            under_attack: 'bg-yellow-500 animate-pulse',
            compromised: 'bg-red-500',
            offline: 'bg-gray-500',
            fortified: 'bg-blue-500'
        };

        return (
            <div 
                key={lab.id}
                onClick={() => setSelectedLab(lab)}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                    selectedLab?.id === lab.id 
                        ? 'border-cyan-500 bg-cyan-900/30' 
                        : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                }`}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{typeInfo.icon}</span>
                        <div>
                            <div className="font-bold text-white text-sm">{lab.name}</div>
                            <div className="text-xs text-slate-400">{lab.location.zone}</div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                            {[...Array(lab.tier)].map((_, i) => (
                                <span key={i} className="text-yellow-500 text-xs">★</span>
                            ))}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${statusColors[lab.status]}`} title={lab.status}></div>
                    </div>
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                        <span className="text-red-400">🔒</span>
                        <span className="text-slate-300">{lab.security.level}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-green-400">🎯</span>
                        <span className={hackChance >= 50 ? 'text-green-400' : hackChance >= 25 ? 'text-yellow-400' : 'text-red-400'}>
                            {hackChance}%
                        </span>
                    </div>
                </div>

                {isOnCooldown && (
                    <div className="mt-2 text-xs text-orange-400">
                        ⏳ Cooldown: {Math.ceil((lab.cooldownUntil! - Date.now()) / 60000)}m
                    </div>
                )}
            </div>
        );
    };

    const renderLabDetails = () => {
        if (!selectedLab) {
            return (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                    <div className="text-center">
                        <span className="text-4xl mb-2 block">🔬</span>
                        <p>Выбери лабораторию для просмотра деталей</p>
                    </div>
                </div>
            );
        }

        const typeInfo = labService.getLabTypeInfo(selectedLab.type);
        const hackChance = labService.calculateHackChance(selectedLab.id, playerHackPower);
        const labQuests = labService.getLabQuests(selectedLab.id);
        const isOnCooldown = selectedLab.cooldownUntil && Date.now() < selectedLab.cooldownUntil;

        return (
            <div className="flex-1 overflow-y-auto p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{typeInfo.icon}</span>
                    <div>
                        <h2 className="text-xl font-bold text-white">{selectedLab.name}</h2>
                        <p className="text-sm text-slate-400">{typeInfo.description}</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-800 rounded-lg p-3">
                        <div className="text-xs text-slate-400 mb-1">Tier</div>
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < selectedLab.tier ? 'text-yellow-500' : 'text-slate-600'}>★</span>
                            ))}
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3">
                        <div className="text-xs text-slate-400 mb-1">Статус</div>
                        <div className={`text-sm font-bold ${
                            selectedLab.status === 'active' ? 'text-green-400' :
                            selectedLab.status === 'compromised' ? 'text-red-400' :
                            selectedLab.status === 'fortified' ? 'text-blue-400' : 'text-gray-400'
                        }`}>
                            {selectedLab.status.toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Security Info */}
                <div className="bg-slate-800 rounded-lg p-3 mb-4">
                    <div className="text-sm font-bold text-white mb-2">🔒 Безопасность</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span className="text-slate-400">Уровень:</span>
                            <span className="ml-1 text-red-400">{selectedLab.security.level}%</span>
                        </div>
                        <div>
                            <span className="text-slate-400">Firewalls:</span>
                            <span className="ml-1 text-orange-400">{selectedLab.security.firewalls}</span>
                        </div>
                        <div>
                            <span className="text-slate-400">Encryption:</span>
                            <span className="ml-1 text-purple-400">{selectedLab.security.encryption}</span>
                        </div>
                        <div>
                            <span className="text-slate-400">AI Defense:</span>
                            <span className={`ml-1 ${selectedLab.security.hasAI ? 'text-red-400' : 'text-green-400'}`}>
                                {selectedLab.security.hasAI ? 'Да' : 'Нет'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Hack Chance */}
                <div className="bg-slate-800 rounded-lg p-3 mb-4">
                    <div className="text-sm font-bold text-white mb-2">🎯 Шанс взлома</div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                            <div 
                                className={`h-full transition-all ${
                                    hackChance >= 70 ? 'bg-green-500' :
                                    hackChance >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${hackChance}%` }}
                            />
                        </div>
                        <span className={`font-bold ${
                            hackChance >= 70 ? 'text-green-400' :
                            hackChance >= 40 ? 'text-yellow-400' : 'text-red-400'
                        }`}>{hackChance}%</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        Твоя сила взлома: {playerHackPower}
                    </div>
                </div>

                {/* Resources */}
                <div className="bg-slate-800 rounded-lg p-3 mb-4">
                    <div className="text-sm font-bold text-white mb-2">💎 Ресурсы</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                            <span>🌑</span>
                            <span className="text-slate-300">{selectedLab.resources.shadowCredits} SC</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>📁</span>
                            <span className="text-slate-300">{selectedLab.resources.dataFiles} файлов</span>
                        </div>
                    </div>
                </div>

                {/* Available Quests */}
                <div className="bg-slate-800 rounded-lg p-3 mb-4">
                    <div className="text-sm font-bold text-white mb-2">📋 Квесты</div>
                    {labQuests.length > 0 ? (
                        <div className="space-y-2">
                            {labQuests.map(quest => (
                                <div key={quest.id} className="bg-slate-700/50 rounded p-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white">{quest.title}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            quest.status === 'available' ? 'bg-green-600' :
                                            quest.status === 'completed' ? 'bg-blue-600' : 'bg-slate-600'
                                        }`}>{quest.status}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">{quest.description}</div>
                                    <div className="flex items-center gap-2 mt-2 text-xs">
                                        <span className="text-green-400">${quest.rewards.money}</span>
                                        <span className="text-purple-400">{quest.rewards.shadowCredits} SC</span>
                                        <span className="text-yellow-400">+{quest.rewards.xp} XP</span>
                                    </div>
                                    {quest.status === 'available' && (
                                        <button
                                            onClick={() => onStartHack(selectedLab.id, quest.id)}
                                            disabled={!!isOnCooldown || playerLevel < quest.requirements.minLevel}
                                            className="mt-2 w-full py-1 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
                                        >
                                            {isOnCooldown ? '⏳ На кулдауне' : '👾 Начать взлом'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs text-slate-500">Нет доступных квестов</div>
                    )}
                </div>

                {/* Quick Hack Button */}
                <button
                    onClick={() => onStartHack(selectedLab.id)}
                    disabled={!!isOnCooldown}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    <span>👾</span>
                    {isOnCooldown ? 'На кулдауне' : 'Быстрый взлом'}
                </button>
            </div>
        );
    };

    const renderQuestsTab = () => (
        <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-lg font-bold text-white mb-4">📋 Доступные квесты ({availableQuests.length})</h2>
            
            {availableQuests.length > 0 ? (
                <div className="space-y-3">
                    {availableQuests.map(quest => {
                        const lab = labService.getLab(quest.labId);
                        if (!lab) return null;
                        const typeInfo = labService.getLabTypeInfo(lab.type);
                        
                        return (
                            <div key={quest.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-bold text-white">{quest.title}</div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                            <span>{typeInfo.icon}</span>
                                            <span>{lab.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[...Array(quest.difficulty)].map((_, i) => (
                                            <span key={i} className="text-red-500 text-xs">💀</span>
                                        ))}
                                    </div>
                                </div>
                                
                                <p className="text-xs text-slate-300 mt-2">{quest.description}</p>
                                
                                <div className="flex items-center gap-3 mt-3 text-xs">
                                    <span className="text-green-400">${quest.rewards.money}</span>
                                    <span className="text-purple-400">{quest.rewards.shadowCredits} SC</span>
                                    <span className="text-yellow-400">+{quest.rewards.xp} XP</span>
                                    <span className="text-cyan-400">+{quest.rewards.reputation} Rep</span>
                                </div>

                                <div className="flex items-center gap-2 mt-3">
                                    <button
                                        onClick={() => {
                                            setSelectedLab(lab);
                                            setActiveTab('labs');
                                        }}
                                        className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors"
                                    >
                                        📍 К лаборатории
                                    </button>
                                    <button
                                        onClick={() => onStartHack(lab.id, quest.id)}
                                        className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                                    >
                                        👾 Взломать
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center text-slate-500 py-8">
                    <span className="text-4xl mb-2 block">🔒</span>
                    <p>Нет доступных квестов</p>
                    <p className="text-xs mt-1">Повысь уровень и силу взлома</p>
                </div>
            )}
        </div>
    );

    const renderPrototypesTab = () => (
        <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-lg font-bold text-white mb-4">🔧 Прототипы</h2>
            
            {/* Player's Prototypes */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-cyan-400 mb-2">Мои прототипы ({prototypes.length})</h3>
                {prototypes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {prototypes.map(proto => (
                            <div key={proto.id} className="bg-slate-800 rounded-lg p-2 border border-slate-700">
                                <div className="font-bold text-white text-sm">{proto.name}</div>
                                <div className={`text-xs ${
                                    proto.rarity === 'mythic' ? 'text-orange-400' :
                                    proto.rarity === 'legendary' ? 'text-yellow-400' :
                                    proto.rarity === 'epic' ? 'text-purple-400' :
                                    proto.rarity === 'rare' ? 'text-blue-400' : 'text-gray-400'
                                }`}>{proto.rarity.toUpperCase()}</div>
                                <div className="text-xs text-slate-400 mt-1">
                                    ⚡ {proto.stats.power} | 📊 {proto.stats.efficiency}% | 🔧 {proto.stats.stability}%
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-500 py-4 bg-slate-800/50 rounded-lg">
                        <p className="text-sm">У тебя пока нет прототипов</p>
                        <p className="text-xs mt-1">Взламывай лаборатории для их получения</p>
                    </div>
                )}
            </div>

            {/* Available Prototypes */}
            <div>
                <h3 className="text-sm font-bold text-purple-400 mb-2">Известные прототипы</h3>
                <div className="space-y-2">
                    {prototypeTemplates.map((proto, idx) => (
                        <div key={idx} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-white">{proto.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                    proto.rarity === 'mythic' ? 'bg-orange-600' :
                                    proto.rarity === 'legendary' ? 'bg-yellow-600' :
                                    proto.rarity === 'epic' ? 'bg-purple-600' :
                                    proto.rarity === 'rare' ? 'bg-blue-600' : 'bg-gray-600'
                                }`}>{proto.rarity}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                <span>Tier {proto.tier}</span>
                                <span>|</span>
                                <span>{proto.type}</span>
                            </div>
                            <div className="text-xs text-slate-300 mt-2">
                                Эффекты: {proto.effects.map(e => `${e.type} +${e.value}`).join(', ')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // LAYER 14: Hacker Stats Tab
    const renderStatsTab = () => {
        const stats = state.hackerStats || {
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

        const successRate = stats.totalHacks > 0 
            ? Math.round((stats.successfulHacks / stats.totalHacks) * 100) 
            : 0;

        const rankInfo: Record<HackerRank, { name: string; icon: string; color: string }> = {
            'script_kiddie': { name: 'Скрипт-кидди', icon: '👶', color: 'text-gray-400' },
            'amateur': { name: 'Любитель', icon: '🔰', color: 'text-green-400' },
            'hacker': { name: 'Хакер', icon: '💻', color: 'text-blue-400' },
            'elite_hacker': { name: 'Элитный хакер', icon: '⚡', color: 'text-purple-400' },
            'cyber_ninja': { name: 'Кибер-ниндзя', icon: '🥷', color: 'text-red-400' },
            'ghost': { name: 'Призрак', icon: '👻', color: 'text-cyan-400' },
            'legend': { name: 'Легенда', icon: '👑', color: 'text-yellow-400' }
        };

        const currentRank = rankInfo[stats.hackerRank];

        return (
            <div className="flex-1 overflow-y-auto p-4">
                {/* Rank Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 mb-4 border border-slate-600">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-5xl">{currentRank.icon}</span>
                        <div>
                            <div className={`text-2xl font-bold ${currentRank.color}`}>
                                {currentRank.name}
                            </div>
                            <div className="text-slate-400 text-sm">Ваш хакерский ранг</div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-green-400">{stats.successfulHacks}</div>
                            <div className="text-xs text-slate-400">Успешных взломов</div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-red-400">{stats.failedHacks}</div>
                            <div className="text-xs text-slate-400">Провалов</div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-cyan-400">{successRate}%</div>
                            <div className="text-xs text-slate-400">Успешность</div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-purple-400">{stats.highestDifficulty}</div>
                            <div className="text-xs text-slate-400">Макс. сложность</div>
                        </div>
                    </div>
                </div>

                {/* Streaks & Earnings */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🔥</span>
                            <span className="text-white font-semibold">Серия побед</span>
                        </div>
                        <div className="flex justify-between">
                            <div>
                                <div className="text-orange-400 text-xl font-bold">{stats.consecutiveWins}</div>
                                <div className="text-xs text-slate-400">Текущая</div>
                            </div>
                            <div>
                                <div className="text-yellow-400 text-xl font-bold">{stats.maxStreak}</div>
                                <div className="text-xs text-slate-400">Лучшая</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">💀</span>
                            <span className="text-white font-semibold">Shadow Credits</span>
                        </div>
                        <div className="text-purple-400 text-2xl font-bold">
                            {stats.totalShadowCreditsEarned.toLocaleString()} SC
                        </div>
                        <div className="text-xs text-slate-400">Всего заработано</div>
                    </div>
                </div>

                {/* Specializations */}
                {stats.specializations && stats.specializations.length > 0 && (
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                        <h3 className="text-white font-semibold mb-3">🎯 Специализации</h3>
                        <div className="flex flex-wrap gap-2">
                            {stats.specializations.map((spec, i) => (
                                <span key={i} className="px-2 py-1 bg-cyan-600/30 text-cyan-400 text-sm rounded">
                                    {spec}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rank Progress */}
                <div className="mt-4 bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <h3 className="text-white font-semibold mb-3">📈 Прогресс рангов</h3>
                    <div className="space-y-2">
                        {Object.entries(rankInfo).map(([rank, info]) => {
                            const isCurrentOrPast = Object.keys(rankInfo).indexOf(stats.hackerRank) >= Object.keys(rankInfo).indexOf(rank);
                            return (
                                <div key={rank} className={`flex items-center gap-2 ${isCurrentOrPast ? '' : 'opacity-40'}`}>
                                    <span className="text-lg">{info.icon}</span>
                                    <span className={`text-sm ${stats.hackerRank === rank ? info.color + ' font-bold' : 'text-slate-400'}`}>
                                        {info.name}
                                    </span>
                                    {stats.hackerRank === rank && (
                                        <span className="text-xs text-cyan-400 ml-auto">← Текущий</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderMapTab = () => (
        <div className="flex-1 overflow-hidden p-4">
            <h2 className="text-lg font-bold text-white mb-4">🗺️ Карта лабораторий</h2>
            
            <div className="relative w-full h-[400px] bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                {/* Grid background */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(100, 200, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 200, 255, 0.05) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}></div>
                
                {/* Lab markers */}
                {allLabs.map(lab => {
                    const typeInfo = labService.getLabTypeInfo(lab.type);
                    const x = (lab.location.coordinates.x / 1000) * 100;
                    const y = (lab.location.coordinates.y / 1000) * 100;
                    
                    return (
                        <div
                            key={lab.id}
                            onClick={() => {
                                setSelectedLab(lab);
                                setActiveTab('labs');
                            }}
                            className={`absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-125 ${
                                lab.status === 'active' ? 'bg-green-600/80' :
                                lab.status === 'compromised' ? 'bg-red-600/80' :
                                lab.status === 'fortified' ? 'bg-blue-600/80' : 'bg-gray-600/80'
                            }`}
                            style={{ left: `${x}%`, top: `${y}%` }}
                            title={`${lab.name} (${lab.location.zone})`}
                        >
                            <span className="text-sm">{typeInfo.icon}</span>
                        </div>
                    );
                })}
            </div>

            {/* Zone Legend */}
            <div className="mt-4 flex flex-wrap gap-2">
                {zones.map(zone => {
                    const count = allLabs.filter(l => l.location.zone === zone).length;
                    return (
                        <button
                            key={zone}
                            onClick={() => {
                                setFilterZone(zone);
                                setActiveTab('labs');
                            }}
                            className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded border border-slate-600"
                        >
                            {zone} ({count})
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950">
            {/* Header */}
            <div className="h-10 bg-slate-800 flex items-center px-4 justify-between border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🔬</span>
                    <span className="font-bold text-white">Labs Network</span>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700 bg-slate-800/50">
                {(['labs', 'quests', 'prototypes', 'map', 'stats'] as TabType[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === tab 
                                ? 'text-cyan-400 border-b-2 border-cyan-400' 
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {tab === 'labs' && '🏢 Лаборатории'}
                        {tab === 'quests' && '📋 Квесты'}
                        {tab === 'prototypes' && '🔧 Прототипы'}
                        {tab === 'map' && '🗺️ Карта'}
                        {tab === 'stats' && '📊 Репутация'}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'labs' && (
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Lab List */}
                    <div className="w-1/3 border-r border-slate-700 flex flex-col">
                        {/* Filters */}
                        <div className="p-2 border-b border-slate-700 flex gap-2">
                            <select 
                                value={filterZone} 
                                onChange={e => setFilterZone(e.target.value)}
                                className="flex-1 bg-slate-800 text-white text-xs rounded px-2 py-1 border border-slate-600"
                            >
                                <option value="all">Все зоны</option>
                                {zones.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                            <select 
                                value={filterType} 
                                onChange={e => setFilterType(e.target.value as LabType | 'all')}
                                className="flex-1 bg-slate-800 text-white text-xs rounded px-2 py-1 border border-slate-600"
                            >
                                <option value="all">Все типы</option>
                                <option value="research">🔬 Research</option>
                                <option value="manufacturing">🏭 Manufacturing</option>
                                <option value="ai_development">🤖 AI</option>
                                <option value="quantum">⚛️ Quantum</option>
                                <option value="cybersecurity">🛡️ Security</option>
                                <option value="biotech">🧬 Biotech</option>
                            </select>
                        </div>

                        {/* Lab List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {filteredLabs.map(renderLabCard)}
                        </div>
                    </div>

                    {/* Right: Lab Details */}
                    {renderLabDetails()}
                </div>
            )}

            {activeTab === 'quests' && renderQuestsTab()}
            {activeTab === 'prototypes' && renderPrototypesTab()}
            {activeTab === 'map' && renderMapTab()}
            {activeTab === 'stats' && renderStatsTab()}
        </div>
    );
};

export default LabsApp;
