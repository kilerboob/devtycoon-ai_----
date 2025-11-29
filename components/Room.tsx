
import React, { useState } from 'react';
import { GameState, HardwareItem, SkillLevel, HardwareType, InventoryItem } from '../types';
import { HARDWARE_CATALOG, TRANSLATIONS } from '../constants';
import { playSound } from '../utils/sound';

interface RoomProps {
  state: GameState;
  onEnterComputer: () => void;
  onOpenPCInternals: () => void;
  onSleep: () => void;
  onOpenJournal: () => void;
  onEquipItem?: (uid: string) => void; 
  onCleanItem?: (uid: string) => void;
}

export const Room: React.FC<RoomProps> = ({ state, onEnterComputer, onOpenPCInternals, onSleep, onOpenJournal, onEquipItem, onCleanItem }) => {
  const [customizingSlot, setCustomizingSlot] = useState<HardwareType | null>(null);
  const t = TRANSLATIONS[state.language];

  // Helper to find Catalog Item from Equipped UID
  const getEquippedCatalogItem = (type: string) => {
      const uid = state.equipped[type as keyof typeof state.equipped];
      const invItem = state.inventory.find(i => i.uid === uid);
      if (!invItem) return null;
      return HARDWARE_CATALOG.find(h => h.id === invItem.itemId);
  };

  const getVisual = (type: string) => {
    return getEquippedCatalogItem(type)?.visualClass || '';
  };

  const wallClass = getVisual('wall');
  const posterClass = getVisual('poster');
  const windowClass = getVisual('window');
  const deskClass = getVisual('desk');
  const chairClass = getVisual('chair');
  const mousepadClass = getVisual('mousepad');

  const equipped = state.equipped; // UIDs

  // Time & Light Logic
  const time = state.timeOfDay || 8;
  const isNight = time >= 20 || time < 6;
  let nightOpacity = 0;
  if (time >= 18) nightOpacity = (time - 18) / 6 * 0.8;
  else if (time < 6) nightOpacity = 0.8 - (time / 6 * 0.4);
  const timeString = `${Math.floor(time).toString().padStart(2, '0')}:${Math.floor((time % 1) * 60).toString().padStart(2, '0')}`;

  const handleItemClick = (e: React.MouseEvent, slot: HardwareType) => {
      e.stopPropagation();
      setCustomizingSlot(slot);
      playSound('click');
  };

  // Get Inventory Items (Instances) for slot
  const getInventoryForSlot = (type: HardwareType) => {
      return state.inventory.filter(i => {
          const catalogItem = HARDWARE_CATALOG.find(h => h.id === i.itemId);
          return catalogItem && catalogItem.type === type;
      });
  };

  const handleEquip = (itemUid: string) => {
      if (onEquipItem) onEquipItem(itemUid);
      setCustomizingSlot(null);
      playSound('success');
  };
  
  const handleCleanClick = (e: React.MouseEvent, item: InventoryItem) => {
      e.stopPropagation();
      if (onCleanItem) {
        onCleanItem(item.uid);
      }
  };

  // Helper to get Catalog Item name from inventory Item
  const getName = (itemId: string) => HARDWARE_CATALOG.find(h => h.id === itemId)?.name;
  const getDesc = (itemId: string) => HARDWARE_CATALOG.find(h => h.id === itemId)?.description;

  // Certificate Styles
  const getCertStyle = (level: string) => {
    switch (level) {
        case SkillLevel.INTERN: return 'border-[#8D6E63] bg-[#D7CCC8]'; // Wood
        case SkillLevel.JUNIOR: return 'border-slate-400 bg-slate-100'; // Silver
        case SkillLevel.MIDDLE: return 'border-yellow-600 bg-yellow-50 shadow-[0_0_10px_rgba(234,179,8,0.3)]'; // Gold
        case SkillLevel.SENIOR: return 'border-blue-500 bg-slate-900 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'; // Platinum
        case SkillLevel.LEAD: return 'border-purple-500 bg-black text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse'; // Lead
        case SkillLevel.ARCHITECT: return 'border-cyan-400 bg-black text-cyan-400 shadow-[0_0_25px_cyan] border-4'; // Cyber
        case SkillLevel.CTO: return 'border-red-600 bg-black text-red-500 shadow-[0_0_30px_red] animate-rgb-wave border-4'; // CTO
        default: return 'border-slate-500 bg-slate-200';
    }
  };

  return (
    <div 
        className={`relative w-full h-full overflow-hidden transition-all duration-1000 ${wallClass} bg-cover bg-center font-sans select-none scale-[1] md:scale-100 origin-top-left`}
        style={{ transformOrigin: 'top left' }} // Mobile scaling handled in container
        onClick={() => setCustomizingSlot(null)}
    >
       <div className="absolute inset-0 md:transform-none transform scale-[0.6] origin-top-left w-[166%] h-[166%] md:w-full md:h-full">
       
       {/* ==================== 1. BACKGROUND LAYERS ==================== */}
       <div 
        className="absolute inset-0 z-0 cursor-pointer"
        onClick={(e) => handleItemClick(e, 'wall')}
        title="Click to change Wall"
       ></div>

       {getEquippedCatalogItem('window')?.id !== 'window_wall' && (
           <div 
             className={`absolute top-20 left-10 md:left-32 w-48 h-48 md:w-80 md:h-64 border-8 border-slate-800 bg-black overflow-hidden shadow-2xl z-0 cursor-pointer hover:border-blue-500/50 transition-colors`}
             onClick={(e) => handleItemClick(e, 'window')}
            >
                <div className={`w-full h-full ${windowClass} bg-cover bg-center transition-opacity duration-1000 ${isNight ? 'opacity-60' : 'opacity-100'}`}></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
                {isNight && <div className="absolute inset-0 bg-blue-900/40 mix-blend-overlay"></div>}
           </div>
       )}

       {getEquippedCatalogItem('poster')?.id !== 'poster_none' && (
           <div className={`absolute top-24 right-10 md:right-1/4 w-32 h-48 md:w-40 md:h-56 shadow-lg transform rotate-3 origin-top ${posterClass} flex items-center justify-center border-2 border-white/10 z-0`}>
                {getEquippedCatalogItem('poster')?.id === 'poster_ai' && <div className="text-center font-bold text-white/90 uppercase text-[10px] leading-tight drop-shadow-md">I WANT TO<br/><span className="text-xl">BELIEVE</span><br/>IN AGI</div>}
                {getEquippedCatalogItem('poster')?.id === 'poster_code' && <div className="text-[10px] font-mono text-green-500 p-2 bg-black/80 w-full h-full flex items-center justify-center opacity-80">CODE<br/>IS<br/>LIFE</div>}
           </div>
       )}
       
       <div className={`absolute top-10 right-4 md:right-20 w-32 h-24 md:w-48 md:h-36 border-4 rounded-lg flex flex-col items-center justify-center p-2 transform -rotate-2 shadow-2xl transition-all duration-500 z-0 origin-top hover:rotate-0 hover:scale-105 cursor-help group ${getCertStyle(state.level)}`}>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full shadow-sm"></div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-slate-400"></div>
            <div className="text-[8px] md:text-[10px] uppercase tracking-widest opacity-70 mb-1 font-serif">DevTycoon Certification</div>
            <div className="text-xl md:text-3xl mb-1 filter drop-shadow-sm">🎖️</div>
            <div className="text-[10px] md:text-sm font-bold text-center leading-tight font-serif border-b border-current pb-1 mb-1 w-full">{state.level}</div>
            <div className="text-[6px] opacity-60 w-full text-right">Signed: AI_Architect</div>
       </div>

       {/* ==================== 2. DESK & WORKSTATION ==================== */}
       
       <div className="absolute bottom-0 w-full h-full flex flex-col items-center justify-end pointer-events-none">
           
           <div 
             onClick={onEnterComputer}
             className="relative z-20 mb-[0px] pointer-events-auto cursor-pointer group transform transition-transform hover:scale-[1.01]"
           >
               <div className={`absolute top-10 left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-blue-500/20 blur-[80px] rounded-full transition-opacity duration-500 ${state.energy > 0 ? 'opacity-100' : 'opacity-0'}`}></div>

               <div className={`relative ${getEquippedCatalogItem('monitor')?.id === 'monitor_ultrawide' ? 'w-[500px] h-[200px] md:w-[700px] md:h-[300px]' : getEquippedCatalogItem('monitor')?.id === 'monitor_led' ? 'w-[400px] h-[220px] md:w-[600px] md:h-[320px]' : 'w-[320px] h-[240px] md:w-[400px] md:h-[300px]'} transition-all duration-500`}>
                  <div className={`w-full h-full ${getVisual('monitor')} relative overflow-hidden flex items-center justify-center p-4 pt-4 pb-8 shadow-2xl`}>
                      <div className={`w-full h-full bg-black overflow-hidden relative flex flex-col items-center justify-center border border-slate-800 ${state.energy <= 0 ? 'brightness-50 grayscale' : ''}`}>
                          {state.energy > 0 ? (
                             <>
                                <div className="absolute inset-0 bg-slate-900">
                                    <div className="w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
                                </div>
                                <div className="z-10 text-green-500 font-mono text-[10px] md:text-sm animate-pulse mb-2 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">
                                    DevOS v3.0 :: {t.system_ready}
                                </div>
                                <div className="z-10 w-1/2 h-1 bg-slate-800 rounded overflow-hidden">
                                    <div className="h-full bg-green-500 w-1/3 animate-scanline shadow-[0_0_10px_lime]"></div>
                                </div>
                                <div className="z-10 mt-4 text-[10px] text-slate-400 border border-slate-700 px-2 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors">
                                    [{t.enter_pc}]
                                </div>
                             </>
                          ) : (
                             <div className="text-red-500/50 font-mono text-sm animate-pulse tracking-widest">{t.offline}</div>
                          )}
                          <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                      </div>
                      <div className={`absolute bottom-3 right-6 w-1.5 h-1.5 rounded-full ${state.energy > 0 ? 'bg-green-400 shadow-[0_0_8px_lime]' : 'bg-red-900'} transition-colors`}></div>
                  </div>
                  <div className="absolute top-[98%] left-1/2 -translate-x-1/2 w-1/3 h-12 bg-gradient-to-b from-slate-700 to-black clip-path-polygon-[20%_0,_80%_0,_100%_100%,_0%_100%]"></div>
               </div>
           </div>


           <div 
             className={`relative w-full md:w-[95%] h-56 ${deskClass} shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 flex justify-center items-end border-t border-white/5 perspective-1000 pointer-events-auto`}
             onClick={(e) => handleItemClick(e, 'desk')}
             title="Click to change Desk"
            >
                <div 
                    onClick={(e) => { e.stopPropagation(); onOpenPCInternals(); }}
                    className={`absolute bottom-16 left-4 md:left-20 w-24 h-32 md:w-32 md:h-44 ${getVisual('case')} cursor-pointer hover:brightness-110 transition-all z-20 shadow-2xl pointer-events-auto transform hover:scale-105`}
                >
                    <div className="absolute top-4 left-4 right-4 h-[1px] bg-white/10"></div>
                    {getEquippedCatalogItem('case')?.id !== 'case_basic' && state.energy > 0 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 animate-spin-slow blur-md"></div>
                    )}
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${state.energy > 0 ? 'bg-blue-500 shadow-[0_0_10px_blue] animate-pulse' : 'bg-slate-800'}`}></div>
                    <div className={`absolute top-2 right-5 w-1 h-1 rounded-full ${state.energy > 0 ? 'bg-red-500 shadow-[0_0_5px_red] animate-ping' : 'bg-red-900'}`} style={{animationDuration: '0.2s'}}></div>
                </div>

                {getEquippedCatalogItem('speakers')?.id !== 'sp_none' && (
                    <>
                        <div className="absolute bottom-32 left-[10%] md:left-[25%] w-12 h-20 md:w-16 md:h-24 bg-[#1a1a1a] border border-slate-700 rounded shadow-lg flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-black border border-slate-600 shadow-inner bg-[radial-gradient(circle_at_30%_30%,_#333,_#000)]"></div>
                            <div className="w-5 h-5 rounded-full bg-black border border-slate-600 shadow-inner"></div>
                        </div>
                        <div className="absolute bottom-32 right-[10%] md:right-[25%] w-12 h-20 md:w-16 md:h-24 bg-[#1a1a1a] border border-slate-700 rounded shadow-lg flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-black border border-slate-600 shadow-inner bg-[radial-gradient(circle_at_30%_30%,_#333,_#000)]"></div>
                            <div className="w-5 h-5 rounded-full bg-black border border-slate-600 shadow-inner"></div>
                        </div>
                    </>
                )}

                <div className="relative mb-2 z-30 flex items-center justify-center gap-6 transform perspective-500 rotate-x-10">
                    <div 
                        className={`relative w-64 h-24 md:w-96 md:h-32 flex items-center justify-center cursor-pointer group hover:scale-[1.02] transition-transform`}
                        onClick={(e) => handleItemClick(e, 'keyboard')}
                        title="Click to change Keyboard"
                    >
                        <div className={`relative w-full h-20 md:h-24 rounded-lg p-1.5 shadow-xl transition-all ${getEquippedCatalogItem('keyboard')?.id === 'kb_mech' ? 'bg-[#1a1a1a] border-b-4 border-black' : getEquippedCatalogItem('keyboard')?.id === 'kb_custom' ? 'bg-transparent' : 'bg-slate-300 border-b-4 border-slate-400'}`}>
                             {getEquippedCatalogItem('keyboard')?.id !== 'kb_custom' ? (
                                <div className="grid grid-cols-[repeat(15,1fr)] grid-rows-4 gap-1 h-full w-full pointer-events-none">
                                    {Array.from({length: 60}).map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={`rounded-[2px] shadow-[0_1px_0_rgba(0,0,0,0.5)] relative top-0
                                                ${getEquippedCatalogItem('keyboard')?.id === 'kb_mech' ? 'bg-[#0f0f0f]' : 'bg-white'} 
                                                ${state.energy > 0 && getEquippedCatalogItem('keyboard')?.id === 'kb_mech' ? 'animate-rgb-wave' : ''}
                                            `} 
                                            style={{animationDelay: `${i * 0.03}s`}}
                                        ></div>
                                    ))}
                                </div>
                             ) : (
                                 <div className="flex gap-4 w-full h-full pointer-events-none">
                                     <div className="flex-1 bg-[#1a1a1a] rounded-lg transform -rotate-6 shadow-xl border-b-4 border-black grid grid-cols-4 gap-1 p-2">
                                         {Array.from({length: 16}).map((_,i) => <div key={i} className="bg-black rounded-sm shadow-sm"></div>)}
                                     </div>
                                     <div className="flex-1 bg-[#1a1a1a] rounded-lg transform rotate-6 shadow-xl border-b-4 border-black grid grid-cols-4 gap-1 p-2">
                                         {Array.from({length: 16}).map((_,i) => <div key={i} className="bg-black rounded-sm shadow-sm"></div>)}
                                     </div>
                                 </div>
                             )}
                             <div className="absolute -top-10 left-1/2 w-1 h-10 bg-slate-800 -z-10"></div>
                        </div>
                    </div>

                    <div 
                        className={`relative w-24 h-32 md:w-32 md:h-40 flex items-center justify-center cursor-pointer group hover:scale-[1.02] transition-transform`}
                        onClick={(e) => handleItemClick(e, 'mouse')}
                        title="Click to change Mouse/Pad"
                    >
                         <div 
                            className={`absolute inset-0 ${mousepadClass} rounded-lg opacity-90 shadow-sm z-0 pointer-events-auto`}
                            onClick={(e) => handleItemClick(e, 'mousepad')}
                            title="Click to change Mousepad"
                         ></div>
                         
                         <div className={`w-14 h-22 md:w-16 md:h-24 rounded-t-[3rem] rounded-b-[2rem] shadow-[0_5px_15px_rgba(0,0,0,0.5)] relative transition-all z-10
                             ${getEquippedCatalogItem('mouse')?.id === 'mouse_gamer' ? 'bg-[#111] border-l border-r border-slate-800' : 'bg-white border-b-2 border-slate-300'}
                         `}>
                             <div className="absolute top-0 w-full h-[45%] border-b border-black/10 flex pointer-events-none">
                                 <div className="flex-1 border-r border-black/10"></div>
                                 <div className="flex-1"></div>
                             </div>
                             
                             <div className={`absolute top-[15%] left-1/2 -translate-x-1/2 w-3 h-8 rounded-full bg-slate-900 border border-slate-700 shadow-sm ${getEquippedCatalogItem('mouse')?.id === 'mouse_gamer' ? 'shadow-[0_0_5px_red]' : ''}`}></div>
                             
                             {getEquippedCatalogItem('mouse')?.id === 'mouse_gamer' && state.energy > 0 && (
                                 <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center pointer-events-none">
                                     <div className="w-4 h-4 bg-red-600 blur-[2px] opacity-80 animate-pulse rounded-full"></div>
                                     <div className="absolute text-[8px] font-bold text-black/50 z-10">G</div>
                                 </div>
                             )}
                         </div>
                         <div className="absolute -top-8 left-1/2 w-0.5 h-16 bg-slate-800 -z-10"></div>
                    </div>

                </div>

                {getEquippedCatalogItem('headphones')?.id !== 'hp_none' && (
                    <div 
                        className="absolute bottom-8 right-8 w-24 h-20 pointer-events-auto cursor-pointer hover:scale-105 transition-transform transform rotate-12 z-20"
                        onClick={(e) => handleItemClick(e, 'headphones')}
                    >
                         <div className={`w-20 h-20 rounded-full border-[6px] border-b-transparent ${getEquippedCatalogItem('headphones')?.id === 'hp_pro' ? 'border-white' : 'border-slate-800'}`}></div>
                         <div className={`absolute bottom-0 left-0 w-8 h-10 rounded-xl ${getEquippedCatalogItem('headphones')?.id === 'hp_pro' ? 'bg-white shadow-[0_0_10px_white]' : 'bg-slate-800'} flex items-center justify-center`}>
                             <div className="w-1 h-6 bg-black/10 rounded-full"></div>
                         </div>
                         <div className={`absolute bottom-0 right-4 w-8 h-10 rounded-xl ${getEquippedCatalogItem('headphones')?.id === 'hp_pro' ? 'bg-white shadow-[0_0_10px_white]' : 'bg-slate-800'} flex items-center justify-center`}>
                             <div className="w-1 h-6 bg-black/10 rounded-full"></div>
                         </div>
                    </div>
                )}

           </div>
       </div>

       {customizingSlot && (
           <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setCustomizingSlot(null)}>
               <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="text-white font-bold text-lg uppercase flex items-center gap-2">
                           <span>🛠️</span> Change {customizingSlot}
                       </h3>
                       <button onClick={() => setCustomizingSlot(null)} className="text-slate-400 hover:text-white">✕</button>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                       {getInventoryForSlot(customizingSlot).map(item => (
                           <div 
                            key={item.uid}
                            onClick={() => handleEquip(item.uid)}
                            className={`p-3 rounded border cursor-pointer transition-all flex flex-col gap-2 relative group
                                ${equipped[customizingSlot as keyof typeof equipped] === item.uid 
                                    ? 'bg-green-900/30 border-green-500' 
                                    : 'bg-slate-700 border-slate-600 hover:border-blue-400 hover:bg-slate-600'
                                }
                            `}
                           >
                               <div className="flex justify-between items-center">
                                   <span className="text-sm font-bold text-slate-200">{getName(item.itemId)}</span>
                                   {equipped[customizingSlot as keyof typeof equipped] === item.uid && <span className="text-xs text-green-400">EQUIPPED</span>}
                               </div>
                               <div className="text-[10px] text-slate-400">{getDesc(item.itemId)}</div>
                               
                               {item.isStolen && (
                                   <div className="mt-2 border-t border-slate-600 pt-2 flex justify-between items-center">
                                       <span className="text-[10px] text-red-400 font-bold uppercase">STOLEN ID</span>
                                       <button 
                                           onClick={(e) => handleCleanClick(e, item)}
                                           className="px-2 py-0.5 bg-red-900 text-red-200 text-[10px] rounded border border-red-500 hover:bg-red-700"
                                       >
                                           {t.clean}
                                       </button>
                                   </div>
                               )}
                           </div>
                       ))}
                       {getInventoryForSlot(customizingSlot).length === 0 && (
                           <div className="col-span-2 text-center py-4 text-slate-500 italic">
                               Нет предметов в инвентаре. Купите их в CyberNet.
                           </div>
                       )}
                   </div>
               </div>
           </div>
       )}

       {getEquippedCatalogItem('chair')?.id !== 'chair_stool' ? (
           <div 
            className={`absolute -bottom-48 left-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer z-40 transition-transform duration-300 hover:translate-y-4 ${getEquippedCatalogItem('chair')?.id === 'chair_gamer' ? 'w-80' : 'w-64'}`}
            onClick={(e) => handleItemClick(e, 'chair')}
           >
                <div className={`mx-auto rounded-t-[3rem] shadow-2xl ${chairClass} relative h-96 flex justify-center`}>
                    {getEquippedCatalogItem('chair')?.id === 'chair_gamer' && (
                        <>
                            <div className="absolute top-12 w-20 h-10 bg-black/40 rounded-lg border-2 border-black/50"></div>
                            <div className="absolute top-0 bottom-0 left-8 w-4 bg-red-600/80"></div>
                            <div className="absolute top-0 bottom-0 right-8 w-4 bg-red-600/80"></div>
                        </>
                    )}
                </div>
           </div>
       ) : (
           <div 
             className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#5D4037] rounded-full shadow-2xl z-40 border-b-[16px] border-[#3E2723] cursor-pointer"
             onClick={(e) => handleItemClick(e, 'chair')}
            ></div>
       )}

       <div className="absolute top-4 left-4 z-50 flex flex-col gap-2 font-mono select-none scale-[1] md:scale-100">
           <div className="bg-slate-900/80 backdrop-blur border border-green-500/30 px-3 py-1 rounded text-green-400 text-xl font-bold shadow-[0_0_10px_rgba(34,197,94,0.2)]">
               {timeString}
           </div>
           
           <div className="flex gap-2">
               <div className="bg-slate-900/80 backdrop-blur border border-slate-600 px-3 py-1 rounded text-xs flex items-center gap-2 text-slate-300">
                   <span>⚡</span>
                   <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-500 ${state.energy > 50 ? 'bg-yellow-400' : state.energy > 20 ? 'bg-orange-500' : 'bg-red-600 animate-pulse'}`}
                         style={{width: `${state.energy}%`}}
                       ></div>
                   </div>
               </div>
               
               <div className={`bg-slate-900/80 backdrop-blur border border-slate-600 px-3 py-1 rounded text-xs flex items-center gap-2 ${state.temperature > 80 ? 'text-red-400 border-red-500 animate-pulse' : 'text-blue-400'}`}>
                   <span>🌡️ {Math.floor(state.temperature)}°C</span>
               </div>
           </div>
           
           {state.tracePercent > 0 && (
               <div className="bg-red-900/90 backdrop-blur border border-red-500 px-3 py-1 rounded text-xs flex items-center gap-2 text-white animate-pulse">
                   <span>☢️ TRACE: {Math.floor(state.tracePercent)}%</span>
               </div>
           )}
       </div>

       <div 
           onClick={onSleep}
           className="absolute bottom-32 right-[-50px] md:right-10 w-48 h-24 cursor-pointer hover:scale-105 transition-transform z-30 group"
       >
           <div className="w-full h-full bg-indigo-900 rounded-lg transform -skew-x-12 border-t-4 border-indigo-700 shadow-xl relative overflow-hidden">
               <div className="absolute top-2 right-2 w-12 h-16 bg-indigo-800 rounded-sm shadow-sm"></div>
               <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
           </div>
           <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white font-bold text-xs bg-black/50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
               ZZZ... ({t.sleep})
           </div>
       </div>

       <div 
         className="absolute inset-0 bg-[#0f172a] pointer-events-none mix-blend-multiply transition-opacity duration-1000 z-50"
         style={{ opacity: nightOpacity }}
       ></div>
       </div>

       {/* Journal on nightstand - OUTSIDE the scaled container for proper click handling */}
       <div 
           onClick={(e) => { 
               console.log('Journal clicked!'); 
               e.stopPropagation(); 
               onOpenJournal(); 
               playSound('click'); 
           }}
           className="absolute bottom-[25%] right-[15%] md:right-[18%] w-12 h-16 md:w-16 md:h-20 cursor-pointer hover:scale-125 transition-all z-[100] group"
           style={{ pointerEvents: 'auto' }}
       >
           <div className="w-full h-full bg-amber-800 rounded-sm border-l-4 border-amber-900 shadow-2xl relative overflow-hidden transform rotate-6 group-hover:rotate-0 transition-transform">
               <div className="absolute inset-1 bg-amber-100 rounded-sm">
                   <div className="p-1 text-[5px] md:text-[6px] text-amber-900 font-mono leading-tight font-bold">
                       📓
                   </div>
                   <div className="mx-1 space-y-0.5">
                       <div className="h-[2px] bg-amber-300 rounded"></div>
                       <div className="h-[2px] bg-amber-300 rounded w-3/4"></div>
                       <div className="h-[2px] bg-amber-300 rounded w-1/2"></div>
                   </div>
               </div>
           </div>
           <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-amber-300 font-bold text-xs bg-black/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
               📓 Журнал
           </div>
       </div>
    </div>
  );
};
