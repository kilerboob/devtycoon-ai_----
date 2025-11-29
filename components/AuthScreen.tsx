
import React, { useState, useEffect } from 'react';
import { playSound } from '../utils/sound';
import { ServerRegion } from '../types';
import { networkService, Shard, NetworkStats } from '../services/networkService';

interface AuthScreenProps {
    hasSave: boolean;
    onLogin: () => void;
    onRegister: (username: string, region: ServerRegion) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ hasSave, onLogin, onRegister }) => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(hasSave ? 'LOGIN' : 'REGISTER');
    const [username, setUsername] = useState('');
    const [region, setRegion] = useState<ServerRegion>('US-East');
    const [error, setError] = useState('');
    const [ping, setPing] = useState(45);
    
    // Network/Shards state
    const [shards, setShards] = useState<Shard[]>([]);
    const [selectedShard, setSelectedShard] = useState<Shard | null>(null);
    const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
    const [showShardPanel, setShowShardPanel] = useState(false);
    const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');

    // Load shards on mount
    useEffect(() => {
        const loadedShards = networkService.getShards();
        setShards(loadedShards);
        // Auto-select recommended shard
        const recommended = networkService.getRecommendedShard();
        if (recommended) {
            setSelectedShard(recommended);
            setPing(recommended.ping);
        }
    }, []);

    // Ping simulation and stats subscription
    useEffect(() => {
        const interval = setInterval(() => {
            // Refresh shards with live data
            setShards(networkService.getShards());
            
            // Update ping with variation
            setPing(prev => Math.max(20, Math.min(150, prev + (Math.random() * 20 - 10))));
            
            // Get stats if connected
            const stats = networkService.getStats();
            setNetworkStats(stats);
            setConnectionQuality(stats.connectionQuality);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleShardSelect = async (shard: Shard) => {
        if (shard.status !== 'online') {
            setError(`Сервер ${shard.name} недоступен`);
            return;
        }
        
        setSelectedShard(shard);
        setPing(shard.ping);
        playSound('click');
        
        // Map shard region to ServerRegion type
        const regionMap: Record<string, ServerRegion> = {
            'eu-west': 'EU-West',
            'eu-east': 'EU-West',
            'us-east': 'US-East',
            'us-west': 'US-East',
            'asia': 'Asia-Pacific',
            'ru': 'RU-Moscow',
            'ua': 'EU-West',
            'br': 'US-East'
        };
        setRegion(regionMap[shard.id] || 'US-East');
    };

    const getStatusColor = (status: Shard['status']) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'maintenance': return 'bg-orange-500';
            case 'offline': return 'bg-red-500';
        }
    };

    const getLoadBar = (load: number) => {
        const color = load > 80 ? 'bg-red-500' : load > 50 ? 'bg-yellow-500' : 'bg-green-500';
        return (
            <div className="w-full h-1 bg-slate-700 rounded overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${load}%` }}></div>
            </div>
        );
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if(!username.trim()) { setError('Username required'); return; }
        playSound('success');
        onRegister(username, region);
    };

    const handleLogin = () => {
        playSound('click');
        onLogin();
    }

    return (
        <div className="w-full h-screen bg-black flex flex-col items-center justify-center font-mono text-slate-200 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-purple-900/20 pointer-events-none"></div>
            
            {/* Connection Quality & Ping Indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-3 text-xs font-mono">
                <div className={`px-2 py-1 rounded text-xs font-bold ${
                    connectionQuality === 'excellent' ? 'bg-green-600' :
                    connectionQuality === 'good' ? 'bg-blue-600' :
                    connectionQuality === 'fair' ? 'bg-yellow-600' : 'bg-red-600'
                }`}>
                    {connectionQuality.toUpperCase()}
                </div>
                <div className={`w-2 h-2 rounded-full ${ping < 50 ? 'bg-green-500' : ping < 100 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className="text-slate-500">PING: {Math.floor(ping)}ms</span>
                <span className="text-slate-600">[{selectedShard?.name || region}]</span>
            </div>

            {/* Shard Selection Button */}
            <button
                onClick={() => setShowShardPanel(!showShardPanel)}
                className="absolute top-4 left-4 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded text-xs font-mono hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
                <span className="text-purple-400">⚡</span>
                <span>SERVERS ({shards.filter(s => s.status === 'online').length}/{shards.length})</span>
            </button>

            {/* Shard Selection Panel */}
            {showShardPanel && (
                <div className="absolute top-16 left-4 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl z-50 animate-in slide-in-from-left">
                    <div className="p-3 border-b border-slate-700">
                        <div className="text-sm font-bold text-purple-400">🌐 ВЫБОР СЕРВЕРА</div>
                        <div className="text-xs text-slate-500">Выберите регион для подключения</div>
                    </div>
                    <div className="p-2 max-h-64 overflow-y-auto">
                        {shards.map(shard => (
                            <div
                                key={shard.id}
                                onClick={() => handleShardSelect(shard)}
                                className={`p-3 rounded mb-1 cursor-pointer transition-all ${
                                    selectedShard?.id === shard.id 
                                        ? 'bg-purple-600/30 border border-purple-500' 
                                        : 'bg-slate-800/50 hover:bg-slate-700/50 border border-transparent'
                                } ${shard.status !== 'online' ? 'opacity-50' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${getStatusColor(shard.status)}`}></div>
                                        <span className="font-bold text-sm">{shard.flag} {shard.name}</span>
                                    </div>
                                    <span className="text-xs text-slate-400">{shard.ping}ms</span>
                                </div>
                                <div className="text-xs text-slate-500 mb-1">{shard.region}</div>
                                <div className="flex items-center gap-2">
                                    {getLoadBar(shard.load)}
                                    <span className="text-xs text-slate-400">{shard.playerCount.toLocaleString()}/{shard.maxPlayers.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Network Stats Log */}
            {networkStats && networkStats.packetLoss > 0 && (
                <div className="absolute bottom-16 left-4 w-72 bg-slate-900/80 border border-slate-700 rounded p-2 text-xs font-mono">
                    <div className="text-slate-500 mb-1">NETWORK STATUS:</div>
                    <div className={`${networkStats.packetLoss > 1 ? 'text-red-400' : 'text-yellow-400'}`}>
                        Packet Loss: {networkStats.packetLoss.toFixed(1)}% | Jitter: {networkStats.jitter}ms
                    </div>
                </div>
            )}

            <div className="z-10 bg-slate-900/80 backdrop-blur-md p-8 rounded-xl border border-slate-700 shadow-[0_0_50px_rgba(59,130,246,0.2)] max-w-md w-full animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">DEV_NET</h1>
                    <div className="text-xs text-slate-500 uppercase tracking-[0.3em]">Global Access Terminal</div>
                </div>

                <div className="flex bg-slate-800 rounded p-1 mb-6">
                    <button 
                        onClick={() => { setMode('LOGIN'); setError(''); }}
                        disabled={!hasSave}
                        className={`flex-1 py-2 rounded text-sm font-bold transition-all ${mode === 'LOGIN' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'} ${!hasSave ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        LOGIN
                    </button>
                    <button 
                        onClick={() => { setMode('REGISTER'); setError(''); }}
                        className={`flex-1 py-2 rounded text-sm font-bold transition-all ${mode === 'REGISTER' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        REGISTER
                    </button>
                </div>

                {mode === 'LOGIN' && (
                    <div className="space-y-4 animate-in slide-in-from-right">
                        <div className="bg-slate-800/50 p-4 rounded border border-slate-700 text-center">
                            <div className="text-sm text-slate-400 mb-2">Local Profile Found</div>
                            <div className="text-green-400 font-bold text-lg animate-pulse">● SYSTEM READY</div>
                        </div>
                        <button 
                            onClick={handleLogin}
                            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all transform hover:scale-105"
                        >
                            CONNECT TO NEURAL LINK
                        </button>
                    </div>
                )}

                {mode === 'REGISTER' && (
                    <form onSubmit={handleRegister} className="space-y-4 animate-in slide-in-from-left">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold ml-1">Codename</label>
                            <input 
                                type="text" 
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white outline-none focus:border-purple-500 transition-colors"
                                placeholder="Enter your alias..."
                                maxLength={12}
                            />
                        </div>
                        
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold ml-1">Server Region</label>
                            <select 
                                value={region}
                                onChange={e => setRegion(e.target.value as ServerRegion)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white outline-none focus:border-purple-500 transition-colors appearance-none"
                            >
                                <option value="US-East">US-East (Virginia)</option>
                                <option value="EU-West">EU-West (Frankfurt)</option>
                                <option value="Asia-Pacific">Asia-Pacific (Tokyo)</option>
                                <option value="RU-Moscow">RU-Moscow (Datacenter)</option>
                            </select>
                        </div>

                        {error && <div className="text-red-500 text-xs">{error}</div>}
                        <button 
                            type="submit"
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all transform hover:scale-105"
                        >
                            INITIALIZE IDENTITY
                        </button>
                    </form>
                )}
            </div>
            
            <div className="absolute bottom-4 text-[10px] text-slate-700 font-mono">
                <div className="animate-pulse">CONNECTING TO GATEWAY... OK</div>
            </div>
        </div>
    );
};
