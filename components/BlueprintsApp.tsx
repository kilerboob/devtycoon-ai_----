import React, { useState } from 'react';
import { Blueprint, BlueprintTier, BlueprintType, SkillLevel } from '../types';
import { 
  TIER_CONFIG, 
  BLUEPRINT_TYPES,
  blueprintService
} from '../services/blueprintService';
import { playSound } from '../utils/sound';

interface BlueprintsAppProps {
  blueprints: Blueprint[];
  money: number;
  shadowCredits?: number;
  playerLevel?: SkillLevel;
  onCraft?: (blueprint: Blueprint, craftedItem: ReturnType<typeof blueprintService.craftItem>['item']) => void;
  onSell?: (blueprint: Blueprint) => void;
  onAddBlueprint?: (blueprint: Blueprint) => void;
  onSpendMoney?: (amount: number) => void;
  onSpendShadowCredits?: (amount: number) => void;
}

const TIER_COLORS: Record<BlueprintTier, string> = {
  'T1': '#9CA3AF',
  'T2': '#22C55E',
  'T3': '#3B82F6',
  'T4': '#A855F7',
  'T5': '#F59E0B',
  'T6': '#EF4444'
};

export const BlueprintsApp: React.FC<BlueprintsAppProps> = ({
  blueprints,
  money,
  shadowCredits = 0,
  playerLevel = SkillLevel.INTERN,
  onCraft,
  onSell,
  onAddBlueprint,
  onSpendMoney,
  onSpendShadowCredits
}) => {
  const [selectedTier, setSelectedTier] = useState<BlueprintTier | 'all'>('all');
  const [selectedType, setSelectedType] = useState<BlueprintType | 'all'>('all');
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
  const [craftResult, setCraftResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCrafting, setIsCrafting] = useState(false);

  const filteredBlueprints = blueprints.filter(bp => {
    if (selectedTier !== 'all' && bp.tier !== selectedTier) return false;
    if (selectedType !== 'all' && bp.type !== selectedType) return false;
    return true;
  });

  const tiers: BlueprintTier[] = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
  const types: BlueprintType[] = ['cpu', 'gpu', 'ram', 'ssd', 'cooler', 'case', 'ai-core', 'quantum-node', 'neural-chip'];

  const handleGenerateTest = () => {
    if (onAddBlueprint) {
      const newBp = blueprintService.generateBlueprint('T1', 'market');
      onAddBlueprint(newBp);
    }
  };

  const getBlueprintValue = (bp: Blueprint): number => bp.marketValue || 100;

  return (
    <div className="h-full flex flex-col bg-gray-900 text-green-400 font-mono">
      {/* Header */}
      <div className="p-3 border-b border-green-900 bg-black/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            📜 Чертежи <span className="text-sm text-gray-500">({blueprints.length})</span>
          </h2>
          {onAddBlueprint && (
            <button
              onClick={handleGenerateTest}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-sm"
            >
              🎲 Тест: Добавить чертёж
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="p-2 border-b border-green-900/50 flex gap-4 flex-wrap bg-black/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Тир:</span>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as BlueprintTier | 'all')}
            className="bg-gray-800 border border-green-900 rounded px-2 py-1 text-sm"
          >
            <option value="all">Все</option>
            {tiers.map(t => (
              <option key={t} value={t} style={{ color: TIER_COLORS[t] }}>
                {t} - {TIER_CONFIG[t].name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Тип:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as BlueprintType | 'all')}
            className="bg-gray-800 border border-green-900 rounded px-2 py-1 text-sm"
          >
            <option value="all">Все</option>
            {types.map(t => (
              <option key={t} value={t}>{BLUEPRINT_TYPES[t].icon} {BLUEPRINT_TYPES[t].name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Blueprint List */}
        <div className="w-1/2 overflow-y-auto border-r border-green-900/50 p-2">
          {filteredBlueprints.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📭</div>
              <p>Нет чертежей</p>
              <p className="text-xs mt-1">Выполняйте контракты корпораций чтобы получить чертежи</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBlueprints.map(bp => (
                <div
                  key={bp.id}
                  onClick={() => setSelectedBlueprint(bp)}
                  className={`p-2 rounded border cursor-pointer transition-all ${
                    selectedBlueprint?.id === bp.id
                      ? 'border-green-500 bg-green-900/30'
                      : 'border-green-900/50 hover:border-green-700 bg-black/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{bp.icon || BLUEPRINT_TYPES[bp.type].icon}</span>
                      <div>
                        <div className="font-bold" style={{ color: TIER_COLORS[bp.tier] }}>
                          {bp.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {bp.tier} • {BLUEPRINT_TYPES[bp.type].name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 text-sm">
                        ${getBlueprintValue(bp).toLocaleString()}
                      </div>
                      {bp.corporationId && (
                        <div className="text-xs text-gray-500">{bp.corporationId}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Blueprint Details */}
        <div className="w-1/2 overflow-y-auto p-3">
          {selectedBlueprint ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center">
                <div className="text-5xl mb-2">{selectedBlueprint.icon || BLUEPRINT_TYPES[selectedBlueprint.type].icon}</div>
                <h3 
                  className="text-xl font-bold"
                  style={{ color: TIER_COLORS[selectedBlueprint.tier] }}
                >
                  {selectedBlueprint.name}
                </h3>
                <div className="text-sm text-gray-400">
                  {selectedBlueprint.tier} - {TIER_CONFIG[selectedBlueprint.tier].name}
                </div>
                {selectedBlueprint.description && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    "{selectedBlueprint.description}"
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="bg-black/50 rounded p-3 border border-green-900/50">
                <h4 className="text-sm font-bold mb-2 text-green-300">📊 Характеристики</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(selectedBlueprint.stats).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-400">{key}:</span>
                      <span className="text-green-400">+{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crafting Requirements */}
              <div className="bg-black/50 rounded p-3 border border-green-900/50">
                <h4 className="text-sm font-bold mb-2 text-yellow-300">🔧 Требования для крафта</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Деньги:</span>
                    <span className="text-yellow-400">${selectedBlueprint.craftingCost.money}</span>
                  </div>
                  {selectedBlueprint.craftingCost.shadowCredits && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shadow Credits:</span>
                      <span className="text-purple-400">{selectedBlueprint.craftingCost.shadowCredits}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Уровень:</span>
                    <span className="text-blue-400">{selectedBlueprint.craftingCost.skillRequired}</span>
                  </div>
                </div>
              </div>

              {/* Value */}
              <div className="bg-black/50 rounded p-3 border border-yellow-900/50">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Рыночная стоимость:</span>
                  <span className="text-yellow-400 font-bold text-lg">
                    ${getBlueprintValue(selectedBlueprint).toLocaleString()}
                  </span>
                </div>
                {selectedBlueprint.darkHubValue && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-400">DarkHub:</span>
                    <span className="text-purple-400 font-bold">
                      ${selectedBlueprint.darkHubValue.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {/* Craft Button */}
                {onCraft && (() => {
                  const canCraftResult = blueprintService.canCraft(
                    selectedBlueprint, 
                    money, 
                    shadowCredits, 
                    playerLevel
                  );
                  const craftChance = blueprintService.calculateCraftingChance(selectedBlueprint, playerLevel);
                  
                  const handleCraft = async () => {
                    if (!canCraftResult.canCraft || isCrafting) return;
                    
                    setIsCrafting(true);
                    setCraftResult(null);
                    
                    // Spend resources
                    if (onSpendMoney) onSpendMoney(selectedBlueprint.craftingCost.money);
                    if (onSpendShadowCredits && selectedBlueprint.craftingCost.shadowCredits) {
                      onSpendShadowCredits(selectedBlueprint.craftingCost.shadowCredits);
                    }
                    
                    // Simulate crafting time
                    await new Promise(r => setTimeout(r, 1500));
                    
                    // Attempt craft
                    const result = blueprintService.craftItem(selectedBlueprint, playerLevel);
                    setCraftResult({ success: result.success, message: result.message });
                    
                    if (result.success && result.item) {
                      playSound('success');
                      onCraft(selectedBlueprint, result.item);
                    } else {
                      playSound('error');
                    }
                    
                    setIsCrafting(false);
                  };
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Шанс успеха:</span>
                        <span className={`font-bold ${
                          craftChance >= 80 ? 'text-green-400' :
                          craftChance >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {craftChance.toFixed(0)}%
                        </span>
                      </div>
                      
                      <button
                        onClick={handleCraft}
                        disabled={!canCraftResult.canCraft || isCrafting}
                        className={`w-full py-2 rounded font-bold transition-all ${
                          isCrafting 
                            ? 'bg-blue-800 animate-pulse cursor-wait'
                            : canCraftResult.canCraft
                              ? 'bg-blue-600 hover:bg-blue-500'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isCrafting ? '⚙️ Крафт...' : '🔨 Создать компонент'}
                      </button>
                      
                      {!canCraftResult.canCraft && (
                        <div className="text-xs text-red-400 text-center">
                          ⚠️ {canCraftResult.reason}
                        </div>
                      )}
                      
                      {craftResult && (
                        <div className={`text-sm text-center p-2 rounded ${
                          craftResult.success 
                            ? 'bg-green-900/50 text-green-400 border border-green-500/50'
                            : 'bg-red-900/50 text-red-400 border border-red-500/50'
                        }`}>
                          {craftResult.success ? '✅' : '❌'} {craftResult.message}
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                {onSell && (
                  <button
                    onClick={() => onSell(selectedBlueprint)}
                    className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 rounded font-bold"
                  >
                    💰 Продать чертёж (${getBlueprintValue(selectedBlueprint).toLocaleString()})
                  </button>
                )}
              </div>

              {/* Stolen Warning */}
              {selectedBlueprint.isStolen && (
                <div className="bg-red-900/30 rounded p-2 border border-red-500/50 text-center">
                  <span className="text-red-400 text-xs">
                    ⚠️ Украденный чертёж — продажа только на DarkHub
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">👈</div>
                <p>Выберите чертёж</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-2 border-t border-green-900 bg-black/50 flex justify-between text-xs">
        <div>
          Всего чертежей: <span className="text-green-400">{blueprints.length}</span>
        </div>
        <div>
          Общая стоимость: <span className="text-yellow-400">
            ${blueprints.reduce((sum, bp) => sum + getBlueprintValue(bp), 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
