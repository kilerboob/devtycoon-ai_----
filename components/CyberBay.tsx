import React from 'react';
import { HARDWARE_CATALOG } from '../constants';
import { InventoryItem } from '../types';

interface CyberBayProps {
    onClose: () => void;
    inventory: InventoryItem[];
    onSell: (uid: string, value: number) => void;
    marketTrends?: Record<string, number>;
}

export const CyberBay: React.FC<CyberBayProps> = ({ onClose, inventory, onSell, marketTrends }) => {
    
    // Join inventory with catalog
    const items = inventory.map(item => {
        const catalog = HARDWARE_CATALOG.find(c => c.id === item.itemId);
        return {
            ...item,
            catalog
        };
    }).filter(i => i.catalog !== undefined);

    return (
        <div className="absolute top-10 left-10 right-10 bottom-10 bg-slate-50 rounded-lg shadow-2xl overflow-hidden font-sans flex flex-col animate-in zoom-in">
            {/* Header */}
            <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold italic">CB</div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight">CyberBay</span>
                </div>
                <div className="flex gap-4 text-sm text-slate-500">
                    <button className="hover:text-blue-600">Buying</button>
                    <button className="text-blue-600 font-bold border-b-2 border-blue-600">Selling</button>
                    <button className="hover:text-blue-600">Community</button>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕ Close</button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Manage Listings</h1>
                <p className="text-slate-500 mb-8">Sell your pre-owned hardware to millions of gamers worldwide.</p>

                <div className="grid grid-cols-1 gap-4">
                    {items.length === 0 && (
                        <div className="text-center py-20 text-slate-400">Your inventory is empty.</div>
                    )}

                    {items.map((item, idx) => {
                         const cat = item.catalog!;
                         // Skip items with 0 resale value (starter trash) unless it's just cheap
                         if (!cat.resaleValue && !cat.cost) return null;

                         let resalePrice = cat.resaleValue || 0;
                         if (marketTrends && marketTrends[cat.type]) {
                             resalePrice = Math.floor(resalePrice * marketTrends[cat.type]);
                         }

                         const isTrendUp = marketTrends && marketTrends[cat.type] && marketTrends[cat.type] > 1;
                         const isTrendDown = marketTrends && marketTrends[cat.type] && marketTrends[cat.type] < 1;

                         return (
                            <div key={item.uid} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center gap-6 hover:shadow-md transition-shadow">
                                <div className={`w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center text-4xl ${cat.visualClass.includes('bg-') ? '' : 'bg-slate-200'}`}>
                                    {cat.type === 'gpu' ? '🎮' : cat.type === 'cpu' ? '🧠' : '📦'}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg text-slate-900">{cat.name}</h3>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{cat.type}</span>
                                        {cat.isIllegal && <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-600 uppercase">ILLEGAL ORIGIN</span>}
                                    </div>
                                    <p className="text-slate-500 text-sm mt-1">{cat.description}</p>
                                    <div className="flex gap-4 mt-2 text-xs text-slate-400">
                                        <span>Condition: Used - Good</span>
                                        <span>ID: {item.uid.split('_')[1]}</span>
                                    </div>
                                </div>

                                <div className="text-right min-w-[150px]">
                                    <div className="text-xs text-slate-400 uppercase font-bold mb-1">Estimated Net</div>
                                    <div className="text-2xl font-bold text-green-600 mb-2">
                                        +${resalePrice.toLocaleString()}
                                        {isTrendUp && <span className="text-xs text-green-500 ml-1">▲</span>}
                                        {isTrendDown && <span className="text-xs text-red-500 ml-1">▼</span>}
                                    </div>
                                    
                                    {item.isStolen ? (
                                        <div className="group relative">
                                            <button disabled className="w-full py-2 bg-red-100 text-red-500 rounded text-sm font-bold cursor-not-allowed border border-red-200">
                                                FLAGGED STOLEN
                                            </button>
                                            <div className="absolute top-full right-0 text-[10px] text-red-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white p-1 border border-red-200 rounded">
                                                Requires Hardware Flasher tool
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => onSell(item.uid, resalePrice)}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold shadow-sm transition-colors"
                                        >
                                            List Item
                                        </button>
                                    )}
                                </div>
                            </div>
                         );
                    })}
                </div>
            </div>
        </div>
    );
};