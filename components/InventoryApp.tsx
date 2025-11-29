
import React, { useState } from 'react';
import { GameState, InventoryItem } from '../types';
import { HARDWARE_CATALOG } from '../constants';

interface InventoryAppProps {
    state: GameState;
    onClose: () => void;
}

export const InventoryApp: React.FC<InventoryAppProps> = ({ state, onClose }) => {
    const [filter, setFilter] = useState<string>('all');
    const [selectedItemUid, setSelectedItemUid] = useState<string | null>(null);

    const categories = ['all', 'component', 'peripheral', 'decor'];

    const getCategory = (type: string) => {
        if (['cpu', 'gpu', 'ram', 'storage', 'cooler', 'case'].includes(type)) return 'component';
        if (['keyboard', 'mouse', 'mousepad', 'monitor', 'headphones', 'speakers'].includes(type)) return 'peripheral';
        return 'decor';
    };

    const filteredItems = state.inventory.filter(item => {
        const catalog = HARDWARE_CATALOG.find(c => c.id === item.itemId);
        if (!catalog) return false;
        if (filter === 'all') return true;
        return getCategory(catalog.type) === filter;
    });

    const selectedItem = state.inventory.find(i => i.uid === selectedItemUid);
    const selectedCatalog = selectedItem ? HARDWARE_CATALOG.find(c => c.id === selectedItem.itemId) : null;

    const isEquipped = (uid: string) => Object.values(state.equipped).includes(uid);

    return (
        <div className="absolute top-10 left-10 right-10 bottom-10 bg-slate-800 rounded-lg shadow-2xl flex flex-col border border-slate-600 animate-in zoom-in duration-200 font-sans overflow-hidden">
            {/* Header */}
            <div className="h-10 bg-slate-700 border-b border-slate-600 flex items-center justify-between px-4 select-none">
                <div className="flex items-center gap-2">
                    <span className="text-xl">📦</span>
                    <span className="text-sm font-bold text-slate-200">Local Storage // Inventory</span>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-48 bg-slate-900 border-r border-slate-700 p-2 flex flex-col gap-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 px-2 mt-2">Categories</div>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setFilter(cat); setSelectedItemUid(null); }}
                            className={`text-left px-3 py-2 rounded text-sm capitalize transition-colors ${filter === cat ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                        >
                            {cat}
                        </button>
                    ))}
                    
                    <div className="mt-auto p-2">
                        <div className="bg-slate-800 rounded p-2 border border-slate-700">
                            <div className="text-[10px] text-slate-500">Capacity</div>
                            <div className="w-full h-2 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-green-500 w-[20%]"></div>
                            </div>
                            <div className="text-right text-[10px] text-slate-400 mt-1">{state.inventory.length} items</div>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 bg-slate-800 p-4 overflow-y-auto">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredItems.map(item => {
                            const catalog = HARDWARE_CATALOG.find(c => c.id === item.itemId);
                            if (!catalog) return null;
                            const equipped = isEquipped(item.uid);

                            return (
                                <div 
                                    key={item.uid}
                                    onClick={() => setSelectedItemUid(item.uid)}
                                    className={`aspect-square bg-slate-700 rounded-lg border-2 relative cursor-pointer hover:brightness-110 transition-all flex flex-col items-center justify-center p-2
                                        ${selectedItemUid === item.uid ? 'border-blue-500 bg-slate-600' : 'border-slate-600'}
                                        ${item.isStolen ? 'border-red-900/50' : ''}
                                    `}
                                >
                                    <div className="text-3xl mb-1">
                                        {catalog.type === 'gpu' ? '🎮' : catalog.type === 'cpu' ? '🧠' : catalog.type === 'case' ? '🖥️' : '📦'}
                                    </div>
                                    <div className="text-[10px] text-center text-slate-300 leading-tight line-clamp-2">{catalog.name}</div>
                                    
                                    {equipped && (
                                        <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_lime]"></div>
                                    )}
                                    {item.isStolen && (
                                        <div className="absolute top-1 left-1 text-[8px] bg-red-900 text-red-200 px-1 rounded">⚠️</div>
                                    )}
                                </div>
                            );
                        })}
                        {filteredItems.length === 0 && (
                            <div className="col-span-full text-center text-slate-500 mt-10">No items in this category.</div>
                        )}
                    </div>
                </div>

                {/* Details Panel */}
                {selectedItem && selectedCatalog && (
                    <div className="w-64 bg-slate-900 border-l border-slate-700 p-4 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
                        <div className={`w-full h-32 rounded-lg mb-4 flex items-center justify-center text-5xl ${selectedCatalog.visualClass.includes('bg-') ? selectedCatalog.visualClass : 'bg-slate-700'}`}>
                             {!selectedCatalog.visualClass.includes('bg-') && '📦'}
                        </div>
                        
                        <h3 className="text-white font-bold text-lg">{selectedCatalog.name}</h3>
                        <div className="text-xs text-blue-400 mb-2 font-mono">{selectedItem.uid.split('_').slice(-1)[0]}</div>
                        
                        <div className="space-y-3 mt-2">
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                <div className="text-[10px] text-slate-500 uppercase">Type</div>
                                <div className="text-sm text-slate-200 capitalize">{selectedCatalog.type}</div>
                            </div>
                            
                            <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                <div className="text-[10px] text-slate-500 uppercase">Status</div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-200">{isEquipped(selectedItem.uid) ? 'Installed' : 'In Storage'}</span>
                                    {isEquipped(selectedItem.uid) && <span className="text-green-500">●</span>}
                                </div>
                            </div>

                            {selectedItem.isStolen && (
                                <div className="bg-red-900/20 p-2 rounded border border-red-900">
                                    <div className="text-[10px] text-red-500 uppercase font-bold">⚠ ILLEGAL ITEM</div>
                                    <div className="text-[10px] text-red-400 mt-1">
                                        Trace Signature Detected. Cannot be sold on legal markets.
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1 pt-2 border-t border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Specs</div>
                                {selectedCatalog.effect.type === 'auto_code' && <div className="text-xs text-slate-300">Speed: <span className="text-green-400">+{selectedCatalog.effect.value} LOC/s</span></div>}
                                {selectedCatalog.heatOutput && <div className="text-xs text-slate-300">Heat: <span className="text-red-400">{selectedCatalog.heatOutput}W</span></div>}
                                {selectedCatalog.resaleValue && <div className="text-xs text-slate-300">Value: <span className="text-yellow-400">${selectedCatalog.resaleValue}</span></div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
