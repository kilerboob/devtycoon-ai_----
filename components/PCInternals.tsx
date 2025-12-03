

import React from 'react';
import { GameState, HardwareItem, InventoryItem } from '../types';
import { HARDWARE_CATALOG } from '../constants';

interface PCInternalsProps {
  state: GameState;
  onClose: () => void;
  onEquip: (uid: string) => void;
}

export const PCInternals: React.FC<PCInternalsProps> = ({ state, onClose, onEquip }) => {
  // LAYER 17: Future integration - fetch user_pc_components from /api/pc/components/:userId
  // and save upgrades via POST /api/pc/upgrade when onEquip is called.
  // For now, using local state.equipped from GameState.

  // Get all items owned but not currently equipped for a specific slot
  const getInventoryForSlot = (type: string) => {
    return state.inventory.filter(i => {
        const h = HARDWARE_CATALOG.find(cat => cat.id === i.itemId);
        return h && h.type === type && state.equipped[type as keyof typeof state.equipped] !== i.uid;
    });
  };

  const calculateThermalStats = () => {
     let heatGen = 0;
     let cooling = 0;
     
     Object.values(state.equipped).forEach(uid => {
         const invItem = state.inventory.find(i => i.uid === uid);
         const item = HARDWARE_CATALOG.find(i => i.id === invItem?.itemId);
         if (item?.effect.type === 'heat') heatGen += item.effect.value;
         if (item?.effect.type === 'cooling') cooling += item.effect.value;
     });

     return { heatGen, cooling };
  };

  const { heatGen, cooling } = calculateThermalStats();

  const getName = (uid: string) => {
      const invItem = state.inventory.find(i => i.uid === uid);
      return HARDWARE_CATALOG.find(h => h.id === invItem?.itemId)?.name || 'Unknown';
  };
  
  const getCatalogItem = (uid: string) => {
      const invItem = state.inventory.find(i => i.uid === uid);
      return HARDWARE_CATALOG.find(h => h.id === invItem?.itemId);
  };

  const renderSlot = (title: string, type: 'cpu' | 'gpu' | 'ram' | 'storage' | 'cooler', icon: string) => {
    const currentUid = state.equipped[type];
    const currentItem = getCatalogItem(currentUid);
    const availableItems = getInventoryForSlot(type);

    return (
      <div className="bg-slate-800/80 p-3 rounded border border-slate-600 flex flex-col gap-2 relative group hover:border-blue-500 transition-colors">
        <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-bold tracking-wider">
           <span>{icon} {title}</span>
           {availableItems.length > 0 && <span className="text-green-400 animate-pulse">▲</span>}
        </div>
        
        {/* Current Item Visual */}
        <div className="h-12 bg-slate-900 rounded flex items-center justify-center relative overflow-hidden">
            <div className={`w-8 h-8 rounded ${currentItem?.visualClass || 'bg-slate-700'}`}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <span className="absolute bottom-1 w-full text-center text-[9px] text-white truncate px-1">
                {currentItem?.name}
            </span>
        </div>

        {/* Stats */}
        <div className="text-[9px] text-slate-500">
            {currentItem?.effect.type === 'auto_code' ? `+${currentItem.effect.value} LOC/s` : 
             currentItem?.effect.type === 'heat' ? `HEAT: +${currentItem.effect.value}` :
             currentItem?.effect.type === 'cooling' ? `COOL: -${currentItem.effect.value}` :
             'Stable'}
        </div>

        {/* Swap Menu (Hover) */}
        {availableItems.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-600 rounded mt-1 z-50 hidden group-hover:block shadow-xl max-h-40 overflow-y-auto custom-scrollbar">
                {availableItems.map(item => {
                    const catalog = HARDWARE_CATALOG.find(h => h.id === item.itemId);
                    return (
                        <div 
                            key={item.uid} 
                            onClick={() => onEquip(item.uid)}
                            className="p-2 hover:bg-slate-700 cursor-pointer flex justify-between items-center text-xs border-b border-slate-700/50 last:border-0"
                        >
                            <span className="text-white">{catalog?.name}</span>
                            <span className="text-green-400">Install</span>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    );
  };

  const equippedCpu = getCatalogItem(state.equipped.cpu);
  const equippedGpu = getCatalogItem(state.equipped.gpu);
  const equippedRam = getCatalogItem(state.equipped.ram);
  const equippedCooler = getCatalogItem(state.equipped.cooler);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="relative w-[1000px] max-w-full h-auto md:h-[650px] bg-slate-900 rounded-xl shadow-[0_0_100px_rgba(59,130,246,0.2)] border border-slate-700 flex flex-col md:flex-row overflow-hidden">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-50 w-8 h-8 bg-red-600 hover:bg-red-500 rounded-full text-white font-bold shadow-lg">✕</button>

        <div className="w-full md:w-2/3 bg-[#0f1218] p-8 relative flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-black min-h-[400px]">
            
            <div className="absolute top-8 left-8 bg-slate-800/90 border border-slate-600 p-3 rounded-lg shadow-xl backdrop-blur">
                <div className="text-xs text-slate-400 uppercase font-bold mb-2">Thermal Monitor</div>
                <div className="flex items-end gap-2 h-24">
                    <div className="w-6 h-full bg-slate-900 rounded-full relative overflow-hidden border border-slate-700">
                        <div 
                            className={`absolute bottom-0 w-full transition-all duration-1000 ${state.temperature > 80 ? 'bg-red-500 animate-pulse' : state.temperature > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ height: `${Math.min(100, state.temperature)}%` }}
                        ></div>
                    </div>
                    <div className="text-2xl font-mono font-bold text-white w-16">
                        {Math.floor(state.temperature)}°C
                    </div>
                </div>
                <div className="mt-2 text-[10px] space-y-1 font-mono">
                    <div className="text-red-400">GEN: {heatGen}W</div>
                    <div className="text-blue-400">COOL: {cooling}W</div>
                </div>
            </div>

            <div className="relative w-80 h-[500px] bg-green-900/40 border-4 border-green-800 rounded flex flex-col items-center py-6 shadow-2xl scale-75 md:scale-100">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')]"></div>
                
                <div className="w-32 h-32 bg-slate-300 rounded border-4 border-slate-400 mb-6 flex items-center justify-center relative group">
                    <div className="text-[8px] text-slate-500 font-bold absolute top-1">LGA 1700</div>
                    
                    <div className={`w-16 h-16 rounded bg-gradient-to-br from-slate-200 to-slate-400 shadow-inner flex items-center justify-center z-10 ${equippedCpu?.id.includes('high') ? 'ring-2 ring-blue-500' : ''}`}>
                         <span className="text-[10px] font-bold text-slate-700">INTEL</span>
                    </div>

                    <div className="absolute inset-0 z-20 flex items-center justify-center opacity-90 pointer-events-none">
                         {equippedCooler?.id === 'cooler_stock' && <div className="w-24 h-24 rounded-full bg-black/20 border-4 border-slate-400 animate-spin-slow"></div>}
                         {equippedCooler?.id === 'cooler_tower' && <div className="w-28 h-28 bg-orange-500/10 border-4 border-orange-400 rotate-45"></div>}
                         {equippedCooler?.id === 'cooler_water' && <div className="w-28 h-28 rounded-full border-4 border-blue-500 shadow-[0_0_20px_blue]"></div>}
                    </div>
                </div>

                <div className="flex gap-2 mb-6">
                    {Array.from({length: 4}).map((_, i) => (
                        <div key={i} className={`w-2 h-24 bg-slate-800 border border-slate-600 ${equippedRam?.id.includes('64') ? 'shadow-[0_0_5px_rgba(255,0,0,0.8)]' : ''}`}></div>
                    ))}
                </div>

                <div className="w-72 h-10 bg-slate-800 border-2 border-slate-600 rounded flex items-center px-2 relative mb-4">
                     <div className="text-[8px] text-slate-500 mr-auto">PCIe x16</div>
                     <div className="absolute left-0 -bottom-8 h-20 w-full flex justify-center pointer-events-none">
                         <div className={`w-64 h-12 bg-gradient-to-r from-slate-800 to-black rounded border border-slate-700 flex items-center justify-center text-white text-xs font-bold shadow-lg transform rotate-x-12 ${equippedGpu?.id.includes('rtx') ? 'shadow-[0_0_20px_lime] border-green-500' : ''}`}>
                            GEFORCE RTX
                         </div>
                     </div>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 text-xs text-slate-500 font-mono text-right">
                MOBO: Z790 GAMING X<br/>
                BIOS: v12.4
            </div>
        </div>

        <div className="w-full md:w-1/3 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-3 overflow-y-auto min-h-[300px]">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <span>⚙️</span> Components
            </h2>
            <div className="text-[9px] text-purple-400 bg-purple-900/20 border border-purple-700 rounded px-2 py-1 mb-2">
              🔧 LAYER 17: PC upgrades can sync to <code className="font-mono">/api/pc/upgrade</code>
            </div>
            
            {renderSlot('Cooling System', 'cooler', '❄️')}
            {renderSlot('Processor (CPU)', 'cpu', '🧠')}
            {renderSlot('Graphics (GPU)', 'gpu', '🎮')}
            {renderSlot('Memory (RAM)', 'ram', '⚡')}
            {renderSlot('Storage (SSD/HDD)', 'storage', '💾')}
            
            <div className="mt-auto pt-6 border-t border-slate-800">
                <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase">Performance</h3>
                <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Auto Code:</span>
                        <span className="text-blue-400">{state.autoCodePerSecond.toFixed(1)} /s</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Click Power:</span>
                        <span className="text-green-400">{state.clickPower.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
