import React, { useState } from 'react';
import { GameState, Blueprint, CorporationReputation, PlayerRole, PlayerTier } from '../types';
import { TIER_CONFIG, BLUEPRINT_TYPES, blueprintService } from '../services/blueprintService';
import { CORPORATIONS, corporationService } from '../services/corporationService';

interface ProfileAppProps {
  state: GameState;
  onClose: () => void;
  onAddBlueprint?: (blueprint: Blueprint) => void;
}

type ProfileTab = 'overview' | 'blueprints' | 'corporations' | 'achievements' | 'stats';

const ROLE_INFO: Record<PlayerRole, { name: string; icon: string; description: string }> = {
  'programmer': { name: 'Программист', icon: '💻', description: 'Мастер кода и алгоритмов' },
  'engineer': { name: 'Инженер', icon: '🔧', description: 'Эксперт по железу и сборке' },
  'hacker': { name: 'Хакер', icon: '👾', description: 'Специалист по взлому систем' },
  'security': { name: 'Безопасник', icon: '🛡️', description: 'Защитник от киберугроз' },
  'trader': { name: 'Торговец', icon: '💰', description: 'Мастер сделок и рынка' },
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

export const ProfileApp: React.FC<ProfileAppProps> = ({ state, onClose, onAddBlueprint }) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  const role = state.playerRole || 'programmer';
  const tier = state.playerTier || 'trainee';
  const blueprints = state.blueprints || [];
  const corpReps = state.corporationReps || [];
  const achievements = state.unlockedAchievements || [];

  const tabs: { id: ProfileTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Обзор', icon: '👤' },
    { id: 'blueprints', label: 'Чертежи', icon: '📜' },
    { id: 'corporations', label: 'Корпорации', icon: '🏢' },
    { id: 'achievements', label: 'Достижения', icon: '🏆' },
    { id: 'stats', label: 'Статистика', icon: '📊' },
  ];

  // Overview Tab
  const renderOverview = () => (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-4 border border-blue-500/30">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-green-500 flex items-center justify-center text-4xl">
            {ROLE_INFO[role].icon}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-green-400">{state.username}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span 
                className="px-2 py-0.5 rounded text-sm font-bold"
                style={{ backgroundColor: TIER_INFO[tier].color + '30', color: TIER_INFO[tier].color }}
              >
                {TIER_INFO[tier].icon} {TIER_INFO[tier].name}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-300">{ROLE_INFO[role].name}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{ROLE_INFO[role].description}</p>
          </div>
          <div className="text-right">
            <div className="text-yellow-400 font-bold">${state.money.toLocaleString()}</div>
            <div className="text-purple-400 text-sm">{state.shadowCredits} SC</div>
            <div className="text-gray-500 text-xs">День {state.day}</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-black/50 rounded-lg p-3 border border-green-900/50 text-center">
          <div className="text-2xl font-bold text-green-400">{blueprints.length}</div>
          <div className="text-xs text-gray-500">Чертежей</div>
        </div>
        <div className="bg-black/50 rounded-lg p-3 border border-blue-900/50 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {corpReps.filter(r => r.rank === 'союзник' || r.rank === 'элита').length}
          </div>
          <div className="text-xs text-gray-500">Союзников</div>
        </div>
        <div className="bg-black/50 rounded-lg p-3 border border-yellow-900/50 text-center">
          <div className="text-2xl font-bold text-yellow-400">{achievements.length}</div>
          <div className="text-xs text-gray-500">Достижений</div>
        </div>
        <div className="bg-black/50 rounded-lg p-3 border border-purple-900/50 text-center">
          <div className="text-2xl font-bold text-purple-400">{state.reputation}</div>
          <div className="text-xs text-gray-500">Репутация</div>
        </div>
      </div>

      {/* Corporation Summary */}
      <div className="bg-black/50 rounded-lg p-3 border border-green-900/50">
        <h3 className="text-sm font-bold text-green-300 mb-2">🏢 Отношения с корпорациями</h3>
        <div className="space-y-2">
          {CORPORATIONS.map(corp => {
            const rep = corpReps.find(r => r.corporationId === corp.id);
            return (
              <div key={corp.id} className="flex items-center gap-2">
                <span className="text-lg">{corp.logo}</span>
                <span className="flex-1 text-sm" style={{ color: corp.color }}>{corp.name}</span>
                <span 
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: RANK_COLORS[rep?.rank || 'нейтрал'] + '30', color: RANK_COLORS[rep?.rank || 'нейтрал'] }}
                >
                  {rep?.rank || 'нейтрал'}
                </span>
                <span className={`text-xs ${(rep?.reputation || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(rep?.reputation || 0) > 0 ? '+' : ''}{rep?.reputation || 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Blueprints */}
      {blueprints.length > 0 && (
        <div className="bg-black/50 rounded-lg p-3 border border-green-900/50">
          <h3 className="text-sm font-bold text-green-300 mb-2">📜 Последние чертежи</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {blueprints.slice(-5).reverse().map(bp => (
              <div 
                key={bp.id}
                className="flex-shrink-0 w-24 p-2 bg-gray-800/50 rounded border border-green-900/30 text-center"
              >
                <div className="text-2xl">{bp.icon || BLUEPRINT_TYPES[bp.type].icon}</div>
                <div className="text-xs truncate" style={{ color: TIER_CONFIG[bp.tier].color }}>
                  {bp.name}
                </div>
                <div className="text-xs text-gray-500">{bp.tier}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Blueprints Tab
  const renderBlueprints = () => {
    const groupedByTier = blueprints.reduce((acc, bp) => {
      if (!acc[bp.tier]) acc[bp.tier] = [];
      acc[bp.tier].push(bp);
      return acc;
    }, {} as Record<string, Blueprint[]>);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-green-300">📜 Мои чертежи ({blueprints.length})</h3>
          {onAddBlueprint && (
            <button
              onClick={() => onAddBlueprint(blueprintService.generateBlueprint('T1', 'market'))}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs"
            >
              🎲 Тест
            </button>
          )}
        </div>

        {blueprints.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>Нет чертежей</p>
            <p className="text-xs">Выполняйте контракты чтобы получить чертежи</p>
          </div>
        ) : (
          Object.entries(groupedByTier).map(([tier, bps]) => (
            <div key={tier} className="bg-black/30 rounded-lg p-3 border border-green-900/30">
              <h4 
                className="font-bold mb-2 text-sm"
                style={{ color: TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.color || '#fff' }}
              >
                {tier} - {TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.name || tier} ({bps.length})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {bps.map(bp => (
                  <div 
                    key={bp.id}
                    className="p-2 bg-gray-800/50 rounded border border-green-900/20 hover:border-green-500/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{bp.icon || BLUEPRINT_TYPES[bp.type].icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{bp.name}</div>
                        <div className="text-xs text-gray-500">{BLUEPRINT_TYPES[bp.type].name}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // Corporations Tab
  const renderCorporations = () => (
    <div className="space-y-3">
      <h3 className="font-bold text-green-300">🏢 Корпорации</h3>
      
      {CORPORATIONS.map(corp => {
        const rep = corpReps.find(r => r.corporationId === corp.id);
        const repValue = rep?.reputation || 0;
        const repPercent = ((repValue + 100) / 200) * 100;
        
        return (
          <div 
            key={corp.id}
            className="bg-black/50 rounded-lg p-3 border border-green-900/50"
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: corp.color + '30' }}
              >
                {corp.logo}
              </div>
              <div className="flex-1">
                <div className="font-bold" style={{ color: corp.color }}>{corp.name}</div>
                <div className="text-xs text-gray-500">{corp.specialty}</div>
              </div>
              <div className="text-right">
                <div 
                  className="font-bold"
                  style={{ color: RANK_COLORS[rep?.rank || 'нейтрал'] }}
                >
                  {(rep?.rank || 'нейтрал').toUpperCase()}
                </div>
                <div className={`text-sm ${repValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {repValue > 0 ? '+' : ''}{repValue}
                </div>
              </div>
            </div>
            
            {/* Rep Bar */}
            <div className="h-2 bg-gray-700 rounded overflow-hidden">
              <div 
                className="h-full transition-all"
                style={{ 
                  width: `${repPercent}%`,
                  backgroundColor: corp.color
                }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Контрактов: {rep?.totalContracts || 0}</span>
              {corp.isEvil && <span className="text-red-400">⚠️ Теневая</span>}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Achievements Tab
  const renderAchievements = () => (
    <div className="space-y-3">
      <h3 className="font-bold text-green-300">🏆 Достижения ({achievements.length})</h3>
      
      {achievements.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎯</div>
          <p>Пока нет достижений</p>
          <p className="text-xs">Продолжайте играть чтобы разблокировать!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {achievements.map(achId => (
            <div 
              key={achId}
              className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/30"
            >
              <div className="text-2xl">🏅</div>
              <div className="text-sm font-bold text-yellow-400">{achId}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Stats Tab
  const renderStats = () => (
    <div className="space-y-3">
      <h3 className="font-bold text-green-300">📊 Статистика</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/50 rounded-lg p-3 border border-green-900/50">
          <div className="text-xs text-gray-500">Строк кода</div>
          <div className="text-xl font-bold text-green-400">{Math.floor(state.linesOfCode).toLocaleString()}</div>
        </div>
        <div className="bg-black/50 rounded-lg p-3 border border-red-900/50">
          <div className="text-xs text-gray-500">Багов</div>
          <div className="text-xl font-bold text-red-400">{state.bugs}</div>
        </div>
        <div className="bg-black/50 rounded-lg p-3 border border-yellow-900/50">
          <div className="text-xs text-gray-500">Деньги</div>
          <div className="text-xl font-bold text-yellow-400">${state.money.toLocaleString()}</div>
        </div>
        <div className="bg-black/50 rounded-lg p-3 border border-purple-900/50">
          <div className="text-xs text-gray-500">Shadow Credits</div>
          <div className="text-xl font-bold text-purple-400">{state.shadowCredits}</div>
        </div>
        <div className="bg-black/50 rounded-lg p-3 border border-blue-900/50">
          <div className="text-xs text-gray-500">Уровень</div>
          <div className="text-xl font-bold text-blue-400">{state.level}</div>
        </div>
        <div className="bg-black/50 rounded-lg p-3 border border-cyan-900/50">
          <div className="text-xs text-gray-500">Репутация</div>
          <div className="text-xl font-bold text-cyan-400">{state.reputation}</div>
        </div>
        <div className="bg-black/50 rounded-lg p-3 border border-orange-900/50">
          <div className="text-xs text-gray-500">Энергия</div>
          <div className="text-xl font-bold text-orange-400">{Math.floor(state.energy)}%</div>
        </div>
        <div className="bg-black/50 rounded-lg p-3 border border-pink-900/50">
          <div className="text-xs text-gray-500">Проектов</div>
          <div className="text-xl font-bold text-pink-400">{(state.releasedProjects || []).length}</div>
        </div>
      </div>

      {/* Hardware */}
      <div className="bg-black/50 rounded-lg p-3 border border-green-900/50">
        <h4 className="text-sm font-bold text-green-300 mb-2">🖥️ Железо</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Температура:</span>
            <span className={state.temperature > 80 ? 'text-red-400' : 'text-green-400'}>
              {Math.floor(state.temperature)}°C
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Auto-код/сек:</span>
            <span className="text-blue-400">{state.autoCodePerSecond.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Клик сила:</span>
            <span className="text-yellow-400">{state.clickPower}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Шанс бага:</span>
            <span className="text-red-400">{(state.bugChance * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="absolute top-10 left-10 md:left-40 right-10 bottom-20 bg-gray-900 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-green-900">
      {/* Window Header */}
      <div className="h-10 bg-black border-b border-green-900 flex items-center justify-between px-3">
        <span className="text-sm font-bold text-green-400">👤 Профиль — {state.username}</span>
        <div className="flex gap-2">
          <button onClick={onClose} className="w-4 h-4 rounded-full bg-red-500 hover:bg-red-400"></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-green-900/50 bg-black/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-green-900/30 text-green-400 border-b-2 border-green-500'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-green-400">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'blueprints' && renderBlueprints()}
        {activeTab === 'corporations' && renderCorporations()}
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'stats' && renderStats()}
      </div>
    </div>
  );
};
