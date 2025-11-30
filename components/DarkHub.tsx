
import React, { useState, useEffect } from 'react';
import { HARDWARE_CATALOG } from '../constants';

interface DarkHubItem {
    id: number;
    name: string;
    description?: string;
    risk_level: string;
    price: number;
    stock: number;
    commission_rate: number;
}

interface DarkHubProps {
    onClose: () => void;
    shadowCredits: number;
    money: number;
    globalHeat: number;
    onBuy: (id: string, isShadow: boolean) => void;
    onExchange: (amountUSD: number) => void;
    accessExpiry?: number; // New Prop
}

export const DarkHub: React.FC<DarkHubProps> = ({ onClose, shadowCredits, money, globalHeat, onBuy, onExchange, accessExpiry }) => {
    const [tab, setTab] = useState<'market' | 'laundry' | 'darkhub'>('market');
    const [exchangeAmount, setExchangeAmount] = useState('');
    const [timeLeft, setTimeLeft] = useState('00:00:00');
    const [darkhubItems, setDarkhubItems] = useState<DarkHubItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Exchange Rate: Higher Heat = Worse Rate
    const exchangeRate = Math.max(0.1, 1 - (globalHeat / 150)); 
    // DarkHub Price Multiplier
    const riskMultiplier = 1 + (globalHeat / 200); 

    useEffect(() => {
        const timer = setInterval(() => {
            if (accessExpiry) {
                const diff = accessExpiry - Date.now();
                if (diff <= 0) {
                    onClose();
                } else {
                    const h = Math.floor(diff / 3600000);
                    const m = Math.floor((diff % 3600000) / 60000);
                    const s = Math.floor((diff % 60000) / 1000);
                    setTimeLeft(`${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
                }
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [accessExpiry, onClose]);

    // Load DarkHub items with TOR-like delay
    useEffect(() => {
        if (tab === 'darkhub') {
            setLoading(true);
            const timer = setTimeout(() => {
                fetch('/api/darkhub/items')
                    .then(r => r.json())
                    .then(setDarkhubItems)
                    .catch(console.error)
                    .finally(() => setLoading(false));
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [tab]);

    const handleExchange = () => {
        const val = parseInt(exchangeAmount);
        if (val > 0 && val <= money) {
            onExchange(val);
            setExchangeAmount('');
        }
    };

    const buyDarkhubItem = async (item: DarkHubItem) => {
        try {
            const res = await fetch('/api/darkhub/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'player', itemId: item.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Purchase failed');
            alert(`🔥 DarkHub покупка: ${item.name}\n💰 ${data.total}\n📊 Комиссия: ${data.commission}\n⚠️ Риск: ${data.risk}`);
            // Reload items
            setTab('market');
            setTimeout(() => setTab('darkhub'), 100);
        } catch (e: any) {
            alert('❌ ' + e.message);
        }
    };

    return (
        <div className="absolute inset-0 bg-black font-mono text-red-600 p-6 animate-in fade-in z-50 overflow-hidden">
            {/* Background Glitch */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] bg-cover mix-blend-screen"></div>
            
            {/* Header */}
            <div className="flex justify-between items-end border-b-2 border-red-600 pb-4 mb-6 relative">
                <div>
                    <h1 className="text-4xl font-bold animate-pulse">DARK_HUB_v0.9</h1>
                    <div className="text-xs text-red-400">ENCRYPTED CONNECTION /// NODE_ID: 0xDEADBEEF</div>
                </div>
                <div className="text-right">
                    <div className="text-xl font-bold text-white mb-1">CONNECTION TIMEOUT: <span className="text-red-500 animate-pulse">{timeLeft}</span></div>
                    <div className="text-2xl font-bold text-white">{shadowCredits} SC</div>
                    <div className="text-xs text-red-400">GLOBAL_HEAT: {globalHeat}% (Risk Multiplier: x{riskMultiplier.toFixed(2)})</div>
                </div>
                <button onClick={onClose} className="absolute top-0 right-0 text-red-500 hover:text-white border border-red-500 px-3 hover:bg-red-900">EXIT_NODE</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
                <button 
                    onClick={() => setTab('market')}
                    className={`px-6 py-2 border ${tab === 'market' ? 'bg-red-600 text-black border-red-600' : 'border-red-800 text-red-800 hover:text-red-500 hover:border-red-500'}`}
                >
                    BLACK_MARKET
                </button>
                <button 
                    onClick={() => setTab('laundry')}
                    className={`px-6 py-2 border ${tab === 'laundry' ? 'bg-red-600 text-black border-red-600' : 'border-red-800 text-red-800 hover:text-red-500 hover:border-red-500'}`}
                >
                    THE_LAUNDRY (EXCHANGE)
                </button>
                <button 
                    onClick={() => setTab('darkhub')}
                    className={`px-6 py-2 border ${tab === 'darkhub' ? 'bg-red-600 text-black border-red-600' : 'border-red-800 text-red-800 hover:text-red-500 hover:border-red-500'}`}
                >
                    DARKHUB_ITEMS
                </button>
            </div>

            {/* Content */}
            <div className="h-[calc(100%-150px)] overflow-y-auto custom-scrollbar border border-red-900/30 p-4 bg-black/50 backdrop-blur-sm">
                
                {tab === 'darkhub' && (
                    <div className="space-y-4">
                        {loading && <div className="text-center text-red-400 animate-pulse">CONNECTING TO TOR NODE...</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {darkhubItems.map(item => {
                                const riskColor = item.risk_level === 'legendary' ? 'text-orange-400' : 
                                                 item.risk_level === 'high' ? 'text-red-400' :
                                                 item.risk_level === 'medium' ? 'text-yellow-400' : 'text-green-400';
                                return (
                                    <div key={item.id} className="border border-green-700 p-3 bg-[#0b0b0b] shadow-[0_0_10px_#00ff0055] hover:shadow-[0_0_20px_#00ff0099] transition-all">
                                        <div className="font-bold text-green-300">{item.name}</div>
                                        <div className={`text-xs ${riskColor} mb-2`}>RISK: {item.risk_level.toUpperCase()}</div>
                                        {item.description && <div className="text-sm text-slate-300 mb-2">{item.description}</div>}
                                        <div className="flex justify-between items-center mt-3">
                                            <div>
                                                <div className="text-green-400 font-bold">${item.price}</div>
                                                <div className="text-xs text-green-600">Commission: {item.commission_rate}%</div>
                                                <div className="text-xs text-slate-500">Stock: {item.stock}</div>
                                            </div>
                                            <button 
                                                onClick={() => buyDarkhubItem(item)}
                                                disabled={item.stock === 0}
                                                className="px-3 py-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm rounded"
                                            >
                                                BUY
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {tab === 'laundry' && (
                    <div className="max-w-xl mx-auto text-center space-y-8 mt-10">
                        <div className="border border-red-500 p-8 rounded shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                            <h2 className="text-2xl font-bold mb-4">CURRENCY_MIXER</h2>
                            <p className="text-sm text-red-400 mb-6">
                                Конвертация чистых долларов в неслеживаемые ShadowCredits.
                                <br/>Текущий курс: <span className="text-white font-bold">$1 = {exchangeRate.toFixed(2)} SC</span>
                            </p>
                            
                            <div className="flex gap-4 items-center justify-center mb-6">
                                <input 
                                    type="number" 
                                    value={exchangeAmount}
                                    onChange={(e) => setExchangeAmount(e.target.value)}
                                    placeholder="Amount in USD"
                                    className="bg-black border border-red-700 text-red-500 p-2 text-center outline-none focus:border-red-400 w-48"
                                />
                                <span className="text-xl">→</span>
                                <div className="text-xl font-bold text-white">
                                    {Math.floor((parseInt(exchangeAmount) || 0) * exchangeRate)} SC
                                </div>
                            </div>

                            <button 
                                onClick={handleExchange}
                                disabled={!exchangeAmount || parseInt(exchangeAmount) > money}
                                className={`w-full py-3 font-bold border ${parseInt(exchangeAmount) > money ? 'border-gray-700 text-gray-700 cursor-not-allowed' : 'bg-red-900/20 border-red-500 hover:bg-red-600 hover:text-black transition-colors'}`}
                            >
                                LAUNDER_FUNDS
                            </button>
                            <div className="mt-2 text-xs text-gray-500">Available Balance: ${money}</div>
                        </div>
                    </div>
                )}

                {tab === 'market' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {HARDWARE_CATALOG.filter(i => i.isIllegal).map(item => {
                            const currentCost = Math.floor((item.shadowCost || 0) * riskMultiplier);
                            return (
                                <div key={item.id} className="border border-red-800 p-4 hover:border-red-500 transition-colors group relative bg-black">
                                    <div className="h-32 mb-4 bg-red-900/10 flex items-center justify-center border border-red-900/30 overflow-hidden">
                                        <div className="text-4xl animate-pulse opacity-50">?</div>
                                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(255,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                                    </div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-white group-hover:text-red-400">{item.name}</h3>
                                        <span className="text-xs border border-red-800 px-1 text-red-500">ILLEGAL</span>
                                    </div>
                                    <p className="text-sm text-red-400/70 mb-4">{item.description}</p>
                                    
                                    <div className="space-y-1 text-xs font-mono mb-4 text-gray-400">
                                        <div>HEAT_OUTPUT: <span className="text-red-500">{item.heatOutput}W</span></div>
                                        <div>TRACE_RISK: <span className="text-red-500">{item.traceSignature}%</span></div>
                                        <div className="text-white">PERFORMANCE: MAX</div>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-red-900">
                                        <div className="flex flex-col">
                                            <span className="text-xl font-bold">{currentCost} SC</span>
                                            {riskMultiplier > 1 && <span className="text-[10px] text-red-500">RISK PREMIUM</span>}
                                        </div>
                                        <button 
                                            onClick={() => onBuy(item.id, true)}
                                            disabled={shadowCredits < currentCost}
                                            className={`px-4 py-1 text-sm font-bold ${shadowCredits >= currentCost ? 'bg-red-600 text-black hover:bg-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                                        >
                                            ACQUIRE
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
};
