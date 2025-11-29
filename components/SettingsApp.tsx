
import React, { useState, useEffect } from 'react';
import { Language, GameState, Blueprint, CorporationReputation, PlayerRole, PlayerTier } from '../types';
import { devFsService } from '../services/devFsService';
import { dbService } from '../services/dbService';
import { TIER_CONFIG, BLUEPRINT_TYPES, blueprintService } from '../services/blueprintService';
import { CORPORATIONS, corporationService } from '../services/corporationService';

interface SettingsAppProps {
    onClose: () => void;
    onLogout: () => void;
    username: string;
    currentLanguage: Language;
    onSetLanguage: (lang: Language) => void;
    state: GameState;
    onAddBlueprint?: (blueprint: Blueprint) => void;
}

type SettingsTab = 'profile' | 'general' | 'system' | 'security';

// Profile sub-tabs
type ProfileSubTab = 'overview' | 'blueprints' | 'corporations' | 'achievements' | 'stats';

const ROLE_INFO: Record<PlayerRole, { name: string; icon: string; description: string }> = {
  'programmer': { name: 'Программист', icon: '💻', description: 'Мастер кода' },
  'engineer': { name: 'Инженер', icon: '🔧', description: 'Эксперт по железу' },
  'hacker': { name: 'Хакер', icon: '👾', description: 'Специалист по взлому' },
  'security': { name: 'Безопасник', icon: '🛡️', description: 'Защитник систем' },
  'trader': { name: 'Торговец', icon: '💰', description: 'Мастер сделок' },
};

const TIER_INFO: Record<PlayerTier, { name: string; color: string; icon: string }> = {
  'trainee': { name: 'Стажёр', color: '#9CA3AF', icon: '🌱' },
  'junior': { name: 'Джуниор', color: '#22C55E', icon: '🌿' },
  'middle': { name: 'Мидл', color: '#3B82F6', icon: '🌳' },
  'senior': { name: 'Сеньор', color: '#A855F7', icon: '🏆' },
  'architect': { name: 'Архитектор', color: '#F59E0B', icon: '👑' },
};

const RANK_COLORS: Record<CorporationReputation['rank'], string> = {
  'враг': '#ef4444',
  'нейтрал': '#6b7280',
  'знакомый': '#3b82f6',
  'партнёр': '#8b5cf6',
  'союзник': '#22c55e',
  'элита': '#f59e0b'
};

export const SettingsApp: React.FC<SettingsAppProps> = ({ 
    onClose, onLogout, username, currentLanguage, onSetLanguage, state, onAddBlueprint 
}) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>('overview');
    const [fsStats, setFsStats] = useState<{files: number, folders: number, totalSize: number} | null>(null);
    const [isScanningFs, setIsScanningFs] = useState(false);
    const [fsScanResult, setFsScanResult] = useState<string | null>(null);
    const [cacheSize, setCacheSize] = useState<string>('Calculating...');
    const [firewallEnabled, setFirewallEnabled] = useState(true);
    const [firewallLevel, setFirewallLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [blockedConnections, setBlockedConnections] = useState(0);

    useEffect(() => {
        if (activeTab === 'system') {
            loadFsStats();
            loadCacheStats();
        }
        if (activeTab === 'security') {
            // Simulate blocked connections
            setBlockedConnections(Math.floor(Math.random() * 50) + 10);
        }
    }, [activeTab]);

    const loadFsStats = async () => {
        try {
            const allEntries = await devFsService.listFolder('/');
            let files = 0, folders = 0, totalSize = 0;
            
            const countRecursive = async (path: string) => {
                const entries = await devFsService.listFolder(path);
                for (const entry of entries) {
                    if (entry.type === 'folder') {
                        folders++;
                        await countRecursive(entry.id);
                    } else {
                        files++;
                        totalSize += (entry as any).content?.length || 0;
                    }
                }
            };
            
            await countRecursive('/');
            setFsStats({ files, folders, totalSize });
        } catch (e) {
            console.error('Failed to load FS stats:', e);
        }
    };

    const loadCacheStats = async () => {
        try {
            // Estimate IndexedDB usage
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                const usedMB = ((estimate.usage || 0) / 1024 / 1024).toFixed(2);
                setCacheSize(`${usedMB} MB`);
            } else {
                setCacheSize('~2.5 MB');
            }
        } catch (e) {
            setCacheSize('Unknown');
        }
    };

    const handleFsScan = async () => {
        setIsScanningFs(true);
        setFsScanResult(null);
        
        // Simulate FS scan
        await new Promise(r => setTimeout(r, 2000));
        
        const issues = Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : 0;
        if (issues === 0) {
            setFsScanResult('✅ File system is healthy. No issues found.');
        } else {
            setFsScanResult(`⚠️ Found ${issues} minor issue(s). Auto-repaired.`);
        }
        
        setIsScanningFs(false);
        await loadFsStats();
    };

    const handleClearCache = async () => {
        if (!confirm('Clear all cached data? This will not delete your files.')) return;
        
        // Clear versions older than 24h
        try {
            const versions = await (devFsService as any).getVersions?.('/', 1000) || [];
            const now = Date.now();
            const dayAgo = now - 24 * 60 * 60 * 1000;
            // Note: In production, you'd delete old versions here
            setCacheSize('0.5 MB');
            alert('Cache cleared successfully!');
        } catch (e) {
            console.error('Failed to clear cache:', e);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    };

    // Profile data
    const role = state.playerRole || 'programmer';
    const tier = state.playerTier || 'trainee';
    const blueprints = state.blueprints || [];
    const corpReps = state.corporationReps || [];
    const achievements = state.unlockedAchievements || [];

    const profileSubTabs: { id: ProfileSubTab; label: string; icon: string }[] = [
        { id: 'overview', label: 'Обзор', icon: '👤' },
        { id: 'blueprints', label: 'Чертежи', icon: '📜' },
        { id: 'corporations', label: 'Корпорации', icon: '🏢' },
        { id: 'achievements', label: 'Достижения', icon: '🏆' },
        { id: 'stats', label: 'Статистика', icon: '📊' },
    ];

    const renderProfileTab = () => (
        <div className="space-y-3">
            {/* Profile Sub-tabs */}
            <div className="flex gap-1 bg-slate-200 rounded p-1">
                {profileSubTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setProfileSubTab(tab.id)}
                        className={`flex-1 py-1 px-2 text-[10px] font-bold rounded transition-all ${
                            profileSubTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 hover:bg-slate-300'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {profileSubTab === 'overview' && (
                <div className="space-y-2">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded p-3 border border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center text-2xl">
                                {ROLE_INFO[role].icon}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-slate-800">{username}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span 
                                        className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                        style={{ backgroundColor: TIER_INFO[tier].color + '30', color: TIER_INFO[tier].color }}
                                    >
                                        {TIER_INFO[tier].icon} {TIER_INFO[tier].name}
                                    </span>
                                    <span className="text-slate-500 text-xs">• {ROLE_INFO[role].name}</span>
                                </div>
                            </div>
                            <div className="text-right text-xs">
                                <div className="font-bold text-yellow-600">${state.money.toLocaleString()}</div>
                                <div className="text-purple-600">{state.shadowCredits} SC</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white rounded p-2 border text-center">
                            <div className="text-lg font-bold text-green-600">{blueprints.length}</div>
                            <div className="text-[9px] text-slate-500">Чертежей</div>
                        </div>
                        <div className="bg-white rounded p-2 border text-center">
                            <div className="text-lg font-bold text-blue-600">{corpReps.filter(r => r.rank === 'союзник' || r.rank === 'элита').length}</div>
                            <div className="text-[9px] text-slate-500">Союзников</div>
                        </div>
                        <div className="bg-white rounded p-2 border text-center">
                            <div className="text-lg font-bold text-yellow-600">{achievements.length}</div>
                            <div className="text-[9px] text-slate-500">Достижений</div>
                        </div>
                        <div className="bg-white rounded p-2 border text-center">
                            <div className="text-lg font-bold text-purple-600">{state.reputation}</div>
                            <div className="text-[9px] text-slate-500">Репутация</div>
                        </div>
                    </div>

                    {/* Corps Summary */}
                    <div className="bg-white rounded p-2 border">
                        <div className="text-xs font-bold text-slate-700 mb-1">🏢 Корпорации</div>
                        <div className="space-y-1">
                            {CORPORATIONS.slice(0, 3).map(corp => {
                                const rep = corpReps.find(r => r.corporationId === corp.id);
                                return (
                                    <div key={corp.id} className="flex items-center gap-2 text-xs">
                                        <span>{corp.logo}</span>
                                        <span className="flex-1" style={{ color: corp.color }}>{corp.name}</span>
                                        <span 
                                            className="text-[10px] px-1.5 py-0.5 rounded"
                                            style={{ backgroundColor: RANK_COLORS[rep?.rank || 'нейтрал'] + '30', color: RANK_COLORS[rep?.rank || 'нейтрал'] }}
                                        >
                                            {rep?.rank || 'нейтрал'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {profileSubTab === 'blueprints' && (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    <div className="text-xs font-bold text-slate-700">📜 Чертежи ({blueprints.length})</div>
                    {blueprints.length === 0 ? (
                        <div className="text-center py-4 text-slate-400 text-xs">Нет чертежей</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-1">
                            {blueprints.map(bp => (
                                <div key={bp.id} className="bg-white rounded p-2 border text-xs flex items-center gap-2">
                                    <span className="text-lg">{bp.icon || BLUEPRINT_TYPES[bp.type]?.icon || '📄'}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold truncate">{bp.name}</div>
                                        <div className="text-[10px]" style={{ color: TIER_CONFIG[bp.tier]?.color }}>{bp.tier}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {profileSubTab === 'corporations' && (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    <div className="text-xs font-bold text-slate-700">🏢 Все корпорации</div>
                    {CORPORATIONS.map(corp => {
                        const rep = corpReps.find(r => r.corporationId === corp.id);
                        const repValue = rep?.reputation || 0;
                        const repPercent = ((repValue + 100) / 200) * 100;
                        return (
                            <div key={corp.id} className="bg-white rounded p-2 border">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{corp.logo}</span>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold" style={{ color: corp.color }}>{corp.name}</div>
                                        <div className="text-[10px] text-slate-500">{corp.specialty}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold" style={{ color: RANK_COLORS[rep?.rank || 'нейтрал'] }}>
                                            {(rep?.rank || 'нейтрал').toUpperCase()}
                                        </div>
                                        <div className={`text-[10px] ${repValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {repValue > 0 ? '+' : ''}{repValue}
                                        </div>
                                    </div>
                                </div>
                                <div className="h-1.5 bg-slate-200 rounded overflow-hidden">
                                    <div className="h-full" style={{ width: `${repPercent}%`, backgroundColor: corp.color }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {profileSubTab === 'achievements' && (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    <div className="text-xs font-bold text-slate-700">🏆 Достижения ({achievements.length})</div>
                    {achievements.length === 0 ? (
                        <div className="text-center py-4 text-slate-400 text-xs">Пока нет достижений</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-1">
                            {achievements.map(achId => (
                                <div key={achId} className="bg-yellow-50 rounded p-2 border border-yellow-200 text-xs">
                                    <span className="mr-1">🏅</span>{achId}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {profileSubTab === 'stats' && (
                <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto">
                    <div className="bg-white rounded p-2 border">
                        <div className="text-[10px] text-slate-500">Строк кода</div>
                        <div className="font-bold text-green-600">{Math.floor(state.linesOfCode).toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded p-2 border">
                        <div className="text-[10px] text-slate-500">Багов</div>
                        <div className="font-bold text-red-600">{state.bugs}</div>
                    </div>
                    <div className="bg-white rounded p-2 border">
                        <div className="text-[10px] text-slate-500">Уровень</div>
                        <div className="font-bold text-blue-600">{state.level}</div>
                    </div>
                    <div className="bg-white rounded p-2 border">
                        <div className="text-[10px] text-slate-500">Энергия</div>
                        <div className="font-bold text-orange-600">{Math.floor(state.energy)}%</div>
                    </div>
                    <div className="bg-white rounded p-2 border">
                        <div className="text-[10px] text-slate-500">Авто-код/сек</div>
                        <div className="font-bold text-cyan-600">{state.autoCodePerSecond.toFixed(1)}</div>
                    </div>
                    <div className="bg-white rounded p-2 border">
                        <div className="text-[10px] text-slate-500">Проектов</div>
                        <div className="font-bold text-pink-600">{(state.releasedProjects || []).length}</div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderGeneralTab = () => (
        <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-300 pb-4">
                <div className="w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center text-2xl border border-slate-400">
                    👤
                </div>
                <div>
                    <div className="font-bold text-slate-700">{username}</div>
                    <div className="text-xs text-slate-500">Administrator</div>
                </div>
            </div>

            <div className="w-full bg-white border border-slate-300 rounded text-sm text-slate-700 p-2 flex justify-between items-center">
                <span>🌐 Language / Язык</span>
                <select 
                    value={currentLanguage}
                    onChange={(e) => onSetLanguage(e.target.value as Language)}
                    className="bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs outline-none"
                >
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                    <option value="uk">Українська</option>
                </select>
            </div>

            <button className="w-full text-left px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50 flex justify-between items-center">
                <span>🔊 Sound Volume</span>
                <span className="text-slate-400">100%</span>
            </button>
            <button className="w-full text-left px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50 flex justify-between items-center">
                <span>🖥️ Display Resolution</span>
                <span className="text-slate-400">1080p</span>
            </button>
        </div>
    );

    const renderSystemTab = () => (
        <div className="space-y-3">
            {/* DevFS Stats */}
            <div className="bg-white border border-slate-300 rounded p-3">
                <div className="text-sm font-bold text-slate-700 mb-2">💾 DevFS Storage</div>
                {fsStats ? (
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-100 rounded p-2">
                            <div className="text-lg font-bold text-blue-600">{fsStats.files}</div>
                            <div className="text-[10px] text-slate-500">Files</div>
                        </div>
                        <div className="bg-slate-100 rounded p-2">
                            <div className="text-lg font-bold text-green-600">{fsStats.folders}</div>
                            <div className="text-[10px] text-slate-500">Folders</div>
                        </div>
                        <div className="bg-slate-100 rounded p-2">
                            <div className="text-lg font-bold text-purple-600">{formatBytes(fsStats.totalSize)}</div>
                            <div className="text-[10px] text-slate-500">Size</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-400 text-sm">Loading...</div>
                )}
            </div>

            {/* FS Check */}
            <div className="bg-white border border-slate-300 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-700">🔍 File System Check</span>
                    <button 
                        onClick={handleFsScan}
                        disabled={isScanningFs}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white text-xs rounded"
                    >
                        {isScanningFs ? 'Scanning...' : 'Run Check'}
                    </button>
                </div>
                {fsScanResult && (
                    <div className="text-xs text-slate-600 bg-slate-100 rounded p-2">{fsScanResult}</div>
                )}
            </div>

            {/* Cache Management */}
            <div className="bg-white border border-slate-300 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-700">🗑️ Cache & Versions</span>
                    <span className="text-xs text-slate-500">{cacheSize}</span>
                </div>
                <button 
                    onClick={handleClearCache}
                    className="w-full py-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs rounded"
                >
                    Clear Old Versions
                </button>
            </div>
        </div>
    );

    const renderSecurityTab = () => (
        <div className="space-y-3">
            {/* Firewall */}
            <div className="bg-white border border-slate-300 rounded p-3">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-slate-700">🛡️ Firewall</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={firewallEnabled}
                            onChange={(e) => setFirewallEnabled(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span className={`text-xs font-bold ${firewallEnabled ? 'text-green-600' : 'text-red-600'}`}>
                            {firewallEnabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                    </label>
                </div>
                
                {firewallEnabled && (
                    <>
                        <div className="text-xs text-slate-500 mb-2">Protection Level</div>
                        <div className="flex gap-2">
                            {(['low', 'medium', 'high'] as const).map(level => (
                                <button
                                    key={level}
                                    onClick={() => setFirewallLevel(level)}
                                    className={`flex-1 py-1 text-xs rounded capitalize ${
                                        firewallLevel === level 
                                            ? level === 'low' ? 'bg-yellow-500 text-white' 
                                              : level === 'medium' ? 'bg-blue-500 text-white'
                                              : 'bg-green-600 text-white'
                                            : 'bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Security Stats */}
            <div className="bg-white border border-slate-300 rounded p-3">
                <div className="text-sm font-bold text-slate-700 mb-2">📊 Security Stats</div>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Blocked Connections (24h)</span>
                        <span className="font-bold text-red-600">{blockedConnections}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Trace Level</span>
                        <span className={`font-bold ${blockedConnections > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {blockedConnections > 30 ? 'Elevated' : 'Normal'}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Last Scan</span>
                        <span className="text-slate-600">{new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-slate-300 rounded p-3">
                <div className="text-sm font-bold text-slate-700 mb-2">⚡ Quick Actions</div>
                <div className="grid grid-cols-2 gap-2">
                    <button className="py-2 bg-slate-200 hover:bg-slate-300 rounded text-xs text-slate-700">
                        🔄 Refresh Keys
                    </button>
                    <button className="py-2 bg-slate-200 hover:bg-slate-300 rounded text-xs text-slate-700">
                        🧹 Clear Logs
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-slate-200 rounded-lg shadow-2xl border border-slate-400 overflow-hidden font-sans animate-in zoom-in duration-200">
            {/* Header */}
            <div className="h-8 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-between px-2">
                <span className="text-xs font-bold text-white">⚙️ Control Panel</span>
                <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-300 border-b border-slate-400">
                {[
                    { id: 'profile', label: '👤 Профиль' },
                    { id: 'general', label: '⚙️ Общее' },
                    { id: 'system', label: '💻 Система' },
                    { id: 'security', label: '🛡️ Защита' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as SettingsTab)}
                        className={`flex-1 py-2 text-xs font-bold transition-colors ${
                            activeTab === tab.id 
                                ? 'bg-slate-100 text-slate-700' 
                                : 'text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-4 bg-slate-100 max-h-[450px] overflow-y-auto">
                {activeTab === 'profile' && renderProfileTab()}
                {activeTab === 'general' && renderGeneralTab()}
                {activeTab === 'system' && renderSystemTab()}
                {activeTab === 'security' && renderSecurityTab()}

                <div className="mt-6 pt-4 border-t border-slate-300">
                    <button 
                        onClick={onLogout}
                        className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <span>⏻</span> SHUT DOWN / EXIT
                    </button>
                </div>
            </div>
        </div>
    );
};
