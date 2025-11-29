import React, { useState } from 'react';
import { CorporationReputation, CorporationId, Corporation, CorporationTier } from '../types';
import { CORPORATIONS, corporationService, TIER_MULTIPLIERS } from '../services/corporationService';

interface CorporationsAppProps {
  corporationReps: CorporationReputation[];
  onSelectCorporation?: (corpId: CorporationId) => void;
}

// Tier visual configuration
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

const RANK_TIERS: { rank: CorporationReputation['rank']; minRep: number; maxRep: number }[] = [
  { rank: 'враг', minRep: -100, maxRep: -50 },
  { rank: 'нейтрал', minRep: -49, maxRep: 9 },
  { rank: 'знакомый', minRep: 10, maxRep: 29 },
  { rank: 'партнёр', minRep: 30, maxRep: 59 },
  { rank: 'союзник', minRep: 60, maxRep: 89 },
  { rank: 'элита', minRep: 90, maxRep: 100 },
];

export const CorporationsApp: React.FC<CorporationsAppProps> = ({
  corporationReps,
  onSelectCorporation
}) => {
  const [selectedCorpId, setSelectedCorpId] = useState<CorporationId | null>(null);
  
  const selectedCorp = selectedCorpId ? corporationService.getCorporation(selectedCorpId) : null;
  const selectedRep = selectedCorpId 
    ? corporationReps.find(r => r.corporationId === selectedCorpId) 
    : null;

  const handleSelect = (corpId: CorporationId) => {
    setSelectedCorpId(corpId);
    onSelectCorporation?.(corpId);
  };

  const getRepBar = (rep: number) => {
    // -100 to +100 → 0% to 100%
    const percent = ((rep + 100) / 200) * 100;
    return percent;
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-green-400 font-mono">
      {/* Header */}
      <div className="p-3 border-b border-green-900 bg-black/50">
        <h2 className="text-lg font-bold flex items-center gap-2">
          🏢 Корпорации CyberNation <span className="text-sm text-gray-500">({CORPORATIONS.length})</span>
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
                  color: TIER_CONFIG[tier].color,
                  boxShadow: TIER_CONFIG[tier].glow
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
        <div className="w-1/2 overflow-y-auto border-r border-green-900/50 p-2 space-y-2">
          {CORPORATIONS.map(corp => {
            const rep = corporationReps.find(r => r.corporationId === corp.id);
            const isSelected = selectedCorpId === corp.id;
            const tier = corp.tier || 'B'; // Default to B-tier if not set
            
            return (
              <div
                key={corp.id}
                onClick={() => handleSelect(corp.id)}
                className={`p-3 rounded border cursor-pointer transition-all relative ${
                  isSelected
                    ? 'border-green-500 bg-green-900/30'
                    : 'border-green-900/50 hover:border-green-700 bg-black/30'
                }`}
                style={{
                  boxShadow: tier === 'S' ? TIER_CONFIG['S'].glow : undefined
                }}
              >
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
                
                <div className="flex items-center gap-3">
                  <div 
                    className="text-3xl w-12 h-12 flex items-center justify-center rounded"
                    style={{ backgroundColor: corp.color + '30' }}
                  >
                    {corp.logo}
                  </div>
                  <div className="flex-1">
                    <div 
                      className="font-bold"
                      style={{ color: corp.color }}
                    >
                      {corp.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {corp.specialty}
                    </div>
                    
                    {/* Reputation Bar */}
                    <div className="mt-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: RANK_COLORS[rep?.rank || 'нейтрал'] }}>
                          {rep?.rank || 'нейтрал'}
                        </span>
                        <span className={rep?.reputation && rep.reputation >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {rep?.reputation || 0}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded overflow-hidden">
                        <div 
                          className="h-full transition-all"
                          style={{ 
                            width: `${getRepBar(rep?.reputation || 0)}%`,
                            backgroundColor: corp.color
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Corporation Details */}
        <div className="w-1/2 overflow-y-auto p-3">
          {selectedCorp && selectedRep ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center">
                <div 
                  className="text-6xl mb-2 w-20 h-20 mx-auto flex items-center justify-center rounded-lg"
                  style={{ backgroundColor: selectedCorp.color + '30' }}
                >
                  {selectedCorp.logo}
                </div>
                <h3 
                  className="text-xl font-bold"
                  style={{ color: selectedCorp.color }}
                >
                  {selectedCorp.name}
                </h3>
                {/* Tier Badge */}
                {selectedCorp.tier && (
                  <div 
                    className="inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold"
                    style={{ 
                      backgroundColor: TIER_CONFIG[selectedCorp.tier].color + '30',
                      color: TIER_CONFIG[selectedCorp.tier].color,
                      boxShadow: TIER_CONFIG[selectedCorp.tier].glow
                    }}
                  >
                    {TIER_CONFIG[selectedCorp.tier].label} • ×{TIER_MULTIPLIERS[selectedCorp.tier]} влияния
                  </div>
                )}
                <div className="text-sm text-gray-400 mt-2">
                  📍 {selectedCorp.headquarters}
                </div>
              </div>

              {/* Description */}
              <div className="bg-black/50 rounded p-3 border border-green-900/50">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {selectedCorp.description}
                </p>
              </div>

              {/* Reputation Details */}
              <div className="bg-black/50 rounded p-3 border border-green-900/50">
                <h4 className="text-sm font-bold mb-3 text-green-300">📊 Репутация</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Текущий ранг:</span>
                    <span 
                      className="font-bold"
                      style={{ color: RANK_COLORS[selectedRep.rank] }}
                    >
                      {selectedRep.rank.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Очки репутации:</span>
                    <span className={selectedRep.reputation >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {selectedRep.reputation > 0 ? '+' : ''}{selectedRep.reputation}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Контрактов выполнено:</span>
                    <span className="text-blue-400">{selectedRep.totalContracts}</span>
                  </div>

                  {/* Full Rep Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>-100 (Враг)</span>
                      <span>0</span>
                      <span>+100 (Элита)</span>
                    </div>
                    <div className="h-3 bg-gradient-to-r from-red-900 via-gray-700 to-green-900 rounded overflow-hidden relative">
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-white"
                        style={{ left: `${getRepBar(selectedRep.reputation)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Specialty */}
              <div className="bg-black/50 rounded p-3 border border-green-900/50">
                <h4 className="text-sm font-bold mb-2 text-yellow-300">⚡ Специализация</h4>
                <p className="text-sm" style={{ color: selectedCorp.color }}>
                  {selectedCorp.specialty}
                </p>
              </div>

              {/* Corp Info */}
              <div className="bg-black/50 rounded p-3 border border-green-900/50">
                <h4 className="text-sm font-bold mb-2 text-blue-300">📋 Информация</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">CEO:</span>
                    <span className="text-gray-200">{selectedCorp.ceo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Влияние:</span>
                    <span className="text-yellow-400">{selectedCorp.influence}%</span>
                  </div>
                </div>
              </div>

              {/* Rank Tiers Info */}
              <div className="bg-black/50 rounded p-3 border border-green-900/50">
                <h4 className="text-sm font-bold mb-2 text-purple-300">🏆 Уровни репутации</h4>
                <div className="space-y-1 text-xs">
                  {RANK_TIERS.map(tier => (
                    <div 
                      key={tier.rank}
                      className={`flex justify-between p-1 rounded ${
                        selectedRep.rank === tier.rank ? 'bg-green-900/30' : ''
                      }`}
                    >
                      <span style={{ color: RANK_COLORS[tier.rank] }}>{tier.rank}</span>
                      <span className="text-gray-500">
                        {tier.minRep} → {tier.maxRep}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evil Corp Warning */}
              {selectedCorp.isEvil && (
                <div className="bg-red-900/30 rounded p-3 border border-red-500/50 text-center">
                  <span className="text-red-400 text-sm">
                    ⚠️ Теневая корпорация — работа с ней может привести к последствиям
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">👈</div>
                <p>Выберите корпорацию</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-green-900 bg-black/50 flex justify-between text-xs">
        <div>
          Союзники: <span className="text-green-400">
            {corporationReps.filter(r => r.rank === 'союзник' || r.rank === 'элита').length}
          </span>
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
