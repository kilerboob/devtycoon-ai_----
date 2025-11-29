/**
 * CorporationsApp - Full Corporation Social System UI
 * LAYER 5: Complete corporation interaction with:
 * - Membership management
 * - Quests & Contracts
 * - Labs & AI Cores
 * - Corp Wars
 */

import React, { useState, useMemo } from 'react';
import { 
  CorporationReputation, 
  CorporationId, 
  Corporation, 
  CorporationTier,
  CorpMembership,
  CorpQuest,
  CorpLab,
  CorpWar,
  CorpMemberRank,
  CorpPrivilege,
  LabType
} from '../types';
import { CORPORATIONS, corporationService, TIER_MULTIPLIERS } from '../services/corporationService';
import { 
  corporationServiceExtended, 
  RANK_CONFIG, 
  QUEST_TEMPLATES,
  CORP_LABS 
} from '../services/corporationServiceExtended';

// ============================================
// INTERFACES
// ============================================
interface CorporationsAppProps {
  corporationReps: CorporationReputation[];
  membership?: CorpMembership;
  activeQuests: CorpQuest[];
  completedQuestIds: string[];
  money: number;
  onJoinCorp: (corpId: CorporationId) => void;
  onLeaveCorp: () => void;
  onStartQuest: (quest: CorpQuest) => void;
  onCollectReward: (quest: CorpQuest) => void;
  onPayDues: () => void;
  onSelectCorporation?: (corpId: CorporationId) => void;
}

type TabId = 'overview' | 'membership' | 'quests' | 'labs' | 'wars';

// ============================================
// CONFIGURATION
// ============================================
const TIER_CONFIG: Record<CorporationTier, { color: string; label: string; glow: string }> = {
  'S': { color: '#FFD700', label: 'S-TIER', glow: '0 0 20px #FFD700' },
  'A': { color: '#C084FC', label: 'A-TIER', glow: '0 0 12px #C084FC' },
  'B': { color: '#3B82F6', label: 'B-TIER', glow: '0 0 8px #3B82F6' },
  'C': { color: '#22C55E', label: 'C-TIER', glow: '0 0 6px #22C55E' },
  'D': { color: '#6B7280', label: 'D-TIER', glow: 'none' }
};

const RANK_COLORS: Record<CorporationReputation['rank'], string> = {
  'враг': '#ef4444',
  'нейтрал': '#6b7280',
  'знакомый': '#3b82f6',
  'партнёр': '#8b5cf6',
  'союзник': '#22c55e',
  'элита': '#f59e0b'
};

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Обзор', icon: '🏢' },
  { id: 'membership', label: 'Членство', icon: '👤' },
  { id: 'quests', label: 'Задания', icon: '📜' },
  { id: 'labs', label: 'Лаборатории', icon: '🔬' },
  { id: 'wars', label: 'Войны', icon: '⚔️' }
];

// ============================================
// MAIN COMPONENT
// ============================================
export const CorporationsApp: React.FC<CorporationsAppProps> = ({
  corporationReps,
  membership,
  activeQuests = [],
  completedQuestIds = [],
  money,
  onJoinCorp,
  onLeaveCorp,
  onStartQuest,
  onCollectReward,
  onPayDues,
  onSelectCorporation
}) => {
  const [selectedCorpId, setSelectedCorpId] = useState<CorporationId | null>(
    membership?.corporationId || null
  );
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [confirmAction, setConfirmAction] = useState<'join' | 'leave' | null>(null);

  const selectedCorp = selectedCorpId ? CORPORATIONS.find(c => c.id === selectedCorpId) : null;
  const selectedRep = selectedCorpId 
    ? corporationReps.find(r => r.corporationId === selectedCorpId) 
    : null;

  const isMemberOfSelected = membership?.corporationId === selectedCorpId && membership?.isActive;

  // Get available quests for selected corporation
  const availableQuests = useMemo(() => {
    if (!selectedCorpId) return [];
    return corporationServiceExtended.getAvailableQuests(
      selectedCorpId,
      membership,
      selectedRep?.reputation || 0,
      completedQuestIds
    );
  }, [selectedCorpId, membership, selectedRep, completedQuestIds]);

  // Get labs for selected corporation
  const corpLabs = useMemo(() => {
    if (!selectedCorpId) return [];
    return corporationServiceExtended.getCorpLabs(selectedCorpId);
  }, [selectedCorpId]);

  const handleSelect = (corpId: CorporationId) => {
    setSelectedCorpId(corpId);
    onSelectCorporation?.(corpId);
  };

  const getRepBar = (rep: number) => ((rep + 100) / 200) * 100;

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderCorpList = () => (
    <div className="w-1/3 overflow-y-auto border-r border-green-900/50 p-2 space-y-2">
      {CORPORATIONS.map(corp => {
        const rep = corporationReps.find(r => r.corporationId === corp.id);
        const isSelected = selectedCorpId === corp.id;
        const tier = corp.tier || 'B';
        const isMember = membership?.corporationId === corp.id;
        
        return (
          <div
            key={corp.id}
            onClick={() => handleSelect(corp.id)}
            className={`p-3 rounded border cursor-pointer transition-all relative ${
              isSelected
                ? 'border-green-500 bg-green-900/30'
                : 'border-green-900/50 hover:border-green-700 bg-black/30'
            }`}
            style={{ boxShadow: tier === 'S' ? TIER_CONFIG['S'].glow : undefined }}
          >
            {/* Member Badge */}
            {isMember && (
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs bg-green-600 text-white">
                👤 Член
              </div>
            )}
            
            {/* Tier Badge */}
            <div 
              className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold"
              style={{ 
                backgroundColor: TIER_CONFIG[tier].color + '30',
                color: TIER_CONFIG[tier].color
              }}
            >
              {tier}
            </div>
            
            <div className="flex items-center gap-3 mt-4">
              <div 
                className="text-2xl w-10 h-10 flex items-center justify-center rounded"
                style={{ backgroundColor: corp.color + '30' }}
              >
                {corp.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate" style={{ color: corp.color }}>
                  {corp.name}
                </div>
                <div className="text-xs text-gray-500 truncate">{corp.specialty}</div>
                
                {/* Compact Reputation Bar */}
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-700 rounded overflow-hidden">
                    <div 
                      className="h-full transition-all"
                      style={{ 
                        width: `${getRepBar(rep?.reputation || 0)}%`,
                        backgroundColor: corp.color
                      }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: RANK_COLORS[rep?.rank || 'нейтрал'] }}>
                    {rep?.reputation || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTabs = () => (
    <div className="flex border-b border-green-900">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 text-sm transition-all ${
            activeTab === tab.id
              ? 'bg-green-900/50 text-green-400 border-b-2 border-green-500'
              : 'text-gray-500 hover:text-green-400'
          }`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );

  const renderOverviewTab = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <div 
          className="text-5xl mb-2 w-16 h-16 mx-auto flex items-center justify-center rounded-lg"
          style={{ backgroundColor: selectedCorp!.color + '30' }}
        >
          {selectedCorp!.logo}
        </div>
        <h3 className="text-xl font-bold" style={{ color: selectedCorp!.color }}>
          {selectedCorp!.name}
        </h3>
        
        {selectedCorp!.tier && (
          <div 
            className="inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold"
            style={{ 
              backgroundColor: TIER_CONFIG[selectedCorp!.tier].color + '30',
              color: TIER_CONFIG[selectedCorp!.tier].color,
              boxShadow: TIER_CONFIG[selectedCorp!.tier].glow
            }}
          >
            {TIER_CONFIG[selectedCorp!.tier].label} • ×{TIER_MULTIPLIERS[selectedCorp!.tier]} влияния
          </div>
        )}
        
        <div className="text-sm text-gray-400 mt-2">📍 {selectedCorp!.headquarters}</div>
      </div>

      {/* Description */}
      <div className="bg-black/50 rounded p-3 border border-green-900/50">
        <p className="text-sm text-gray-300 leading-relaxed">{selectedCorp!.description}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/50 rounded p-3 border border-green-900/50">
          <div className="text-xs text-gray-500">Влияние</div>
          <div className="text-lg text-yellow-400">{selectedCorp!.influence}%</div>
        </div>
        <div className="bg-black/50 rounded p-3 border border-green-900/50">
          <div className="text-xs text-gray-500">CEO</div>
          <div className="text-lg text-gray-200">{selectedCorp!.ceo}</div>
        </div>
        <div className="bg-black/50 rounded p-3 border border-green-900/50">
          <div className="text-xs text-gray-500">Ваша репутация</div>
          <div className="text-lg" style={{ color: RANK_COLORS[selectedRep?.rank || 'нейтрал'] }}>
            {selectedRep?.reputation || 0} ({selectedRep?.rank || 'нейтрал'})
          </div>
        </div>
        <div className="bg-black/50 rounded p-3 border border-green-900/50">
          <div className="text-xs text-gray-500">Контрактов</div>
          <div className="text-lg text-blue-400">{selectedRep?.totalContracts || 0}</div>
        </div>
      </div>

      {/* Evil Warning */}
      {selectedCorp!.isEvil && (
        <div className="bg-red-900/30 rounded p-3 border border-red-500/50 text-center">
          <span className="text-red-400 text-sm">
            ⚠️ Теневая корпорация — работа с ней может привести к последствиям
          </span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        {!isMemberOfSelected && (
          <button
            onClick={() => setConfirmAction('join')}
            disabled={membership?.isActive}
            className={`flex-1 py-2 rounded font-bold transition-all ${
              membership?.isActive
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {membership?.isActive ? '🚫 Уже в корпорации' : '✅ Вступить'}
          </button>
        )}
        {isMemberOfSelected && (
          <button
            onClick={() => setConfirmAction('leave')}
            className="flex-1 py-2 rounded font-bold bg-red-600 hover:bg-red-500 text-white transition-all"
          >
            🚪 Покинуть корпорацию
          </button>
        )}
      </div>
    </div>
  );

  const renderMembershipTab = () => (
    <div className="space-y-4">
      {isMemberOfSelected ? (
        <>
          {/* Membership Card */}
          <div 
            className="bg-gradient-to-br from-gray-900 to-black rounded-lg p-4 border"
            style={{ borderColor: selectedCorp!.color }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="text-4xl w-16 h-16 flex items-center justify-center rounded-lg"
                style={{ backgroundColor: selectedCorp!.color + '30' }}
              >
                {RANK_CONFIG[membership!.rank].icon}
              </div>
              <div>
                <div className="text-xs text-gray-500">Ваш ранг</div>
                <div 
                  className="text-2xl font-bold"
                  style={{ color: RANK_CONFIG[membership!.rank].color }}
                >
                  {RANK_CONFIG[membership!.rank].name}
                </div>
                <div className="text-sm text-gray-400">
                  Член с {new Date(membership!.joinedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* XP Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">XP прогресс</span>
                <span className="text-green-400">{membership!.xp} / {RANK_CONFIG[getNextRank(membership!.rank)]?.xpRequired || 'MAX'}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all"
                  style={{ width: `${getXPProgress(membership!)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/50 rounded p-3 border border-green-900/50 text-center">
              <div className="text-2xl text-green-400">{membership!.questsCompleted}</div>
              <div className="text-xs text-gray-500">Заданий</div>
            </div>
            <div className="bg-black/50 rounded p-3 border border-green-900/50 text-center">
              <div className="text-2xl text-yellow-400">${membership!.contributions}</div>
              <div className="text-xs text-gray-500">Взносы</div>
            </div>
            <div className="bg-black/50 rounded p-3 border border-green-900/50 text-center">
              <div className="text-2xl text-blue-400">{membership!.xp}</div>
              <div className="text-xs text-gray-500">XP</div>
            </div>
          </div>

          {/* Privileges */}
          <div className="bg-black/50 rounded p-3 border border-green-900/50">
            <h4 className="text-sm font-bold mb-2 text-purple-400">🔓 Привилегии</h4>
            <div className="flex flex-wrap gap-2">
              {membership!.privileges.map(priv => (
                <span 
                  key={priv}
                  className="px-2 py-1 rounded text-xs bg-purple-900/50 text-purple-300"
                >
                  {getPrivilegeName(priv)}
                </span>
              ))}
            </div>
          </div>

          {/* Monthly Dues */}
          <div className="bg-black/50 rounded p-3 border border-yellow-900/50">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-yellow-400">💰 Ежемесячный взнос</h4>
                <div className="text-xs text-gray-500">
                  ${RANK_CONFIG[membership!.rank].monthlyDues}/месяц
                </div>
              </div>
              <div>
                {membership!.monthlyDuesPaid ? (
                  <span className="text-green-400">✅ Оплачено</span>
                ) : (
                  <button
                    onClick={onPayDues}
                    disabled={money < RANK_CONFIG[membership!.rank].monthlyDues}
                    className={`px-4 py-2 rounded font-bold ${
                      money >= RANK_CONFIG[membership!.rank].monthlyDues
                        ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Оплатить
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Rank Ladder */}
          <div className="bg-black/50 rounded p-3 border border-green-900/50">
            <h4 className="text-sm font-bold mb-3 text-green-400">📊 Карьерная лестница</h4>
            <div className="space-y-2">
              {(Object.keys(RANK_CONFIG) as CorpMemberRank[]).map((rank, index) => {
                const config = RANK_CONFIG[rank];
                const isCurrentRank = membership!.rank === rank;
                const isPastRank = Object.keys(RANK_CONFIG).indexOf(membership!.rank) > index;
                
                return (
                  <div 
                    key={rank}
                    className={`flex items-center gap-3 p-2 rounded ${
                      isCurrentRank ? 'bg-green-900/30 border border-green-500' : ''
                    }`}
                  >
                    <div 
                      className={`w-8 h-8 flex items-center justify-center rounded ${
                        isPastRank || isCurrentRank ? 'opacity-100' : 'opacity-40'
                      }`}
                      style={{ backgroundColor: config.color + '30', color: config.color }}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <div style={{ color: config.color }}>{config.name}</div>
                      <div className="text-xs text-gray-500">{config.xpRequired} XP</div>
                    </div>
                    {isPastRank && <span className="text-green-400">✓</span>}
                    {isCurrentRank && <span className="text-yellow-400">⬅ Вы</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-5xl mb-4">🚫</div>
            <p className="text-lg">Вы не состоите в этой корпорации</p>
            <button
              onClick={() => setConfirmAction('join')}
              disabled={membership?.isActive}
              className={`mt-4 px-6 py-2 rounded font-bold ${
                membership?.isActive
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {membership?.isActive ? 'Сначала покиньте текущую' : 'Вступить сейчас'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderQuestsTab = () => (
    <div className="space-y-4">
      {/* Active Quests */}
      {activeQuests.filter(q => q.corporationId === selectedCorpId).length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-2 text-yellow-400">⏳ Активные задания</h4>
          <div className="space-y-2">
            {activeQuests
              .filter(q => q.corporationId === selectedCorpId)
              .map(quest => (
                <QuestCard 
                  key={quest.id} 
                  quest={quest} 
                  onCollect={() => onCollectReward(quest)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Available Quests */}
      <div>
        <h4 className="text-sm font-bold mb-2 text-green-400">📋 Доступные задания</h4>
        {availableQuests.length > 0 ? (
          <div className="space-y-2">
            {availableQuests.map(quest => (
              <QuestCard 
                key={quest.id} 
                quest={quest} 
                onStart={() => onStartQuest(quest)}
                canStart={!activeQuests.some(q => q.id === quest.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <div className="text-3xl mb-2">📭</div>
            <p>Нет доступных заданий</p>
            <p className="text-xs">Повысьте репутацию или ранг для новых заданий</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLabsTab = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-bold mb-2 text-blue-400">🔬 Лаборатории {selectedCorp?.name}</h4>
      
      {corpLabs.length > 0 ? (
        <div className="space-y-3">
          {corpLabs.map(lab => {
            const canAccess = corporationServiceExtended.canAccessLab(lab, membership);
            
            return (
              <div 
                key={lab.id}
                className={`rounded p-4 border transition-all ${
                  canAccess 
                    ? 'bg-black/50 border-blue-900/50 hover:border-blue-500' 
                    : 'bg-black/30 border-gray-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{lab.icon}</div>
                  <div className="flex-1">
                    <div className="font-bold text-blue-300">{lab.name}</div>
                    <div className="text-xs text-gray-500">
                      Уровень {lab.tier} • {getLabTypeName(lab.type)}
                    </div>
                  </div>
                  {lab.isLocked && <span className="text-red-400">🔒</span>}
                  {!canAccess && !lab.isLocked && (
                    <span className="text-xs text-yellow-400">
                      Требуется: {RANK_CONFIG[lab.requiredRank].name}
                    </span>
                  )}
                </div>

                {/* Lab Stats */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-gray-800/50 rounded p-2 text-center">
                    <div className="text-blue-400">🧠 {lab.aiCores.length}/{lab.maxCores}</div>
                    <div className="text-gray-500">AI Ядра</div>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2 text-center">
                    <div className="text-purple-400">📜 {lab.blueprintVault.length}/{lab.maxBlueprints}</div>
                    <div className="text-gray-500">Чертежи</div>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2 text-center">
                    <div className="text-green-400">{lab.efficiency}%</div>
                    <div className="text-gray-500">Эффект.</div>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2 text-center">
                    <div className="text-yellow-400">{lab.securityLevel}%</div>
                    <div className="text-gray-500">Защита</div>
                  </div>
                </div>

                {/* Research Status */}
                {lab.activeResearch && (
                  <div className="mt-3 bg-green-900/30 rounded p-2 border border-green-500/50">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-400">🔄 {lab.activeResearch.name}</span>
                      <span>{lab.activeResearch.progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-1 bg-gray-700 rounded overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${lab.activeResearch.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {canAccess && (
                  <button className="mt-3 w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all">
                    🚪 Войти в лабораторию
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <div className="text-3xl mb-2">🔒</div>
          <p>У этой корпорации нет доступных лабораторий</p>
        </div>
      )}
    </div>
  );

  const renderWarsTab = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-bold mb-2 text-red-400">⚔️ Корпоративные войны</h4>
      
      {/* Corp War Status */}
      <div className="bg-black/50 rounded p-4 border border-red-900/50">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🏰</div>
          <div className="text-lg font-bold" style={{ color: selectedCorp?.color }}>
            {selectedCorp?.name}
          </div>
          <div className="text-xs text-gray-500">Военный потенциал</div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-800/50 rounded p-2">
            <div className="text-xl text-green-400">0</div>
            <div className="text-xs text-gray-500">Побед</div>
          </div>
          <div className="bg-gray-800/50 rounded p-2">
            <div className="text-xl text-yellow-400">0</div>
            <div className="text-xs text-gray-500">Активных</div>
          </div>
          <div className="bg-gray-800/50 rounded p-2">
            <div className="text-xl text-red-400">0</div>
            <div className="text-xs text-gray-500">Поражений</div>
          </div>
        </div>
      </div>

      {/* Allies & Enemies */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/50 rounded p-3 border border-green-900/50">
          <h5 className="text-xs font-bold text-green-400 mb-2">🤝 Союзники</h5>
          <div className="text-center text-gray-500 text-sm py-4">
            Нет союзников
          </div>
        </div>
        <div className="bg-black/50 rounded p-3 border border-red-900/50">
          <h5 className="text-xs font-bold text-red-400 mb-2">⚔️ Враги</h5>
          <div className="text-center text-gray-500 text-sm py-4">
            Нет активных конфликтов
          </div>
        </div>
      </div>

      {/* War Participation */}
      {isMemberOfSelected && corporationServiceExtended.hasPrivilege(membership, 'war_participation') && (
        <div className="bg-red-900/20 rounded p-3 border border-red-500/50">
          <h5 className="text-sm font-bold text-red-400 mb-2">🎖️ Участие в войнах</h5>
          <p className="text-xs text-gray-400 mb-3">
            Как член корпорации с достаточным рангом, вы можете участвовать в корпоративных войнах.
          </p>
          <button 
            disabled
            className="w-full py-2 rounded bg-gray-700 text-gray-500 cursor-not-allowed text-sm"
          >
            Нет активных войн
          </button>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    if (!selectedCorp || !selectedRep) {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">👈</div>
            <p>Выберите корпорацию</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'membership': return renderMembershipTab();
      case 'quests': return renderQuestsTab();
      case 'labs': return renderLabsTab();
      case 'wars': return renderWarsTab();
      default: return renderOverviewTab();
    }
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="h-full flex flex-col bg-gray-900 text-green-400 font-mono">
      {/* Header */}
      <div className="p-3 border-b border-green-900 bg-black/50">
        <h2 className="text-lg font-bold flex items-center gap-2">
          🏢 Корпорации CyberNation
          {membership?.isActive && (
            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">
              {RANK_CONFIG[membership.rank].icon} {CORPORATIONS.find(c => c.id === membership.corporationId)?.name}
            </span>
          )}
        </h2>
        <div className="flex gap-2 mt-2 text-xs">
          {(['S', 'A', 'B', 'C'] as CorporationTier[]).map(tier => {
            const count = CORPORATIONS.filter(c => c.tier === tier).length;
            return (
              <span 
                key={tier}
                className="px-2 py-0.5 rounded"
                style={{ 
                  backgroundColor: TIER_CONFIG[tier].color + '20',
                  color: TIER_CONFIG[tier].color
                }}
              >
                {TIER_CONFIG[tier].label}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Corporation List */}
        {renderCorpList()}

        {/* Detail Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedCorp && renderTabs()}
          <div className="flex-1 overflow-y-auto p-3">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 border border-green-500 max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {confirmAction === 'join' ? '✅ Вступить в корпорацию?' : '🚪 Покинуть корпорацию?'}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {confirmAction === 'join' 
                ? `Вы уверены, что хотите вступить в ${selectedCorp?.name}? Вы сможете состоять только в одной корпорации.`
                : 'Вы потеряете весь накопленный прогресс и получите штраф к репутации.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (confirmAction === 'join' && selectedCorpId) {
                    onJoinCorp(selectedCorpId);
                  } else {
                    onLeaveCorp();
                  }
                  setConfirmAction(null);
                }}
                className={`flex-1 py-2 rounded font-bold ${
                  confirmAction === 'join' 
                    ? 'bg-green-600 hover:bg-green-500' 
                    : 'bg-red-600 hover:bg-red-500'
                } text-white`}
              >
                {confirmAction === 'join' ? 'Вступить' : 'Покинуть'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-2 border-t border-green-900 bg-black/50 flex justify-between text-xs">
        <div>
          Союзники: <span className="text-green-400">
            {corporationReps.filter(r => r.rank === 'союзник' || r.rank === 'элита').length}
          </span>
        </div>
        <div>
          Баланс: <span className="text-yellow-400">${money.toLocaleString()}</span>
        </div>
        <div>
          Враги: <span className="text-red-400">
            {corporationReps.filter(r => r.rank === 'враг').length}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// HELPER COMPONENTS
// ============================================
interface QuestCardProps {
  quest: CorpQuest;
  onStart?: () => void;
  onCollect?: () => void;
  canStart?: boolean;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, onStart, onCollect, canStart = true }) => {
  const isCompleted = quest.status === 'completed';
  const isActive = quest.status === 'active';
  
  const typeColors = {
    daily: '#22C55E',
    weekly: '#3B82F6',
    story: '#A855F7',
    elite: '#EF4444',
    war: '#F59E0B'
  };

  const typeLabels = {
    daily: 'Ежедневное',
    weekly: 'Еженедельное',
    story: 'Сюжетное',
    elite: 'Элитное',
    war: 'Военное'
  };

  return (
    <div className={`rounded p-3 border transition-all ${
      isCompleted 
        ? 'bg-green-900/30 border-green-500' 
        : isActive 
          ? 'bg-yellow-900/30 border-yellow-500' 
          : 'bg-black/50 border-gray-700 hover:border-gray-500'
    }`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{quest.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">{quest.title}</span>
            <span 
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: typeColors[quest.type] + '30', color: typeColors[quest.type] }}
            >
              {typeLabels[quest.type]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{quest.description}</p>
          
          {/* Objectives */}
          <div className="mt-2 space-y-1">
            {quest.objectives.map((obj, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="flex-1 flex items-center gap-1">
                  <span className={obj.current >= obj.target ? 'text-green-400' : 'text-gray-400'}>
                    {obj.current >= obj.target ? '✓' : '○'}
                  </span>
                  <span>{obj.description}</span>
                </div>
                <span className="text-gray-500">{obj.current}/{obj.target}</span>
              </div>
            ))}
          </div>
          
          {/* Rewards Preview */}
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {quest.rewards.money && (
              <span className="text-yellow-400">${quest.rewards.money}</span>
            )}
            {quest.rewards.shadowCredits && (
              <span className="text-purple-400">🌑 {quest.rewards.shadowCredits}</span>
            )}
            {quest.rewards.reputation && (
              <span className="text-green-400">+{quest.rewards.reputation} реп.</span>
            )}
            {quest.rewards.xp && (
              <span className="text-blue-400">+{quest.rewards.xp} XP</span>
            )}
            {quest.rewards.blueprintId && (
              <span className="text-orange-400">📜 Чертёж</span>
            )}
          </div>

          {/* Expiry */}
          {quest.expiresAt && (
            <div className="mt-1 text-xs text-gray-500">
              ⏰ Истекает: {new Date(quest.expiresAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        {quest.status === 'available' && onStart && (
          <button
            onClick={onStart}
            disabled={!canStart}
            className={`flex-1 py-1.5 rounded text-sm font-bold ${
              canStart
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Начать
          </button>
        )}
        {isCompleted && onCollect && (
          <button
            onClick={onCollect}
            className="flex-1 py-1.5 rounded text-sm font-bold bg-yellow-600 hover:bg-yellow-500 text-white animate-pulse"
          >
            🎁 Получить награду
          </button>
        )}
        {isActive && (
          <div className="flex-1 py-1.5 text-center text-sm text-yellow-400">
            ⏳ В процессе...
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================
function getNextRank(currentRank: CorpMemberRank): CorpMemberRank {
  const ranks = Object.keys(RANK_CONFIG) as CorpMemberRank[];
  const currentIndex = ranks.indexOf(currentRank);
  return ranks[currentIndex + 1] || currentRank;
}

function getXPProgress(membership: CorpMembership): number {
  const currentRankXP = RANK_CONFIG[membership.rank].xpRequired;
  const nextRank = getNextRank(membership.rank);
  const nextRankXP = RANK_CONFIG[nextRank].xpRequired;
  
  if (currentRankXP === nextRankXP) return 100; // Max rank
  
  const progress = ((membership.xp - currentRankXP) / (nextRankXP - currentRankXP)) * 100;
  return Math.min(100, Math.max(0, progress));
}

function getPrivilegeName(privilege: CorpPrivilege): string {
  const names: Record<CorpPrivilege, string> = {
    'access_labs': '🔬 Лаборатории',
    'access_blueprints': '📜 Чертежи',
    'access_ai_cores': '🧠 AI Ядра',
    'access_contracts': '📋 Контракты',
    'access_exclusive_shop': '🛒 VIP Магазин',
    'voting_rights': '🗳️ Голосование',
    'start_projects': '🚀 Проекты',
    'manage_members': '👥 Управление',
    'war_participation': '⚔️ Войны',
    'dividend_share': '💰 Дивиденды'
  };
  return names[privilege] || privilege;
}

function getLabTypeName(type: LabType): string {
  const names: Record<LabType, string> = {
    'research': 'Исследования',
    'manufacturing': 'Производство',
    'ai_development': 'AI Разработка',
    'quantum': 'Квантовые вычисления',
    'cybersecurity': 'Кибербезопасность'
  };
  return names[type] || type;
}

export default CorporationsApp;
