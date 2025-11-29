
import React, { useState, useEffect } from 'react';
import { playSound } from '../utils/sound';
import { ServerRegion } from '../types';

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

    useEffect(() => {
        const interval = setInterval(() => {
            setPing(prev => Math.max(20, Math.min(150, prev + (Math.random() * 20 - 10))));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

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
            
            {/* Ping Indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-mono">
                <div className={`w-2 h-2 rounded-full ${ping < 50 ? 'bg-green-500' : ping < 100 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className="text-slate-500">PING: {Math.floor(ping)}ms</span>
                <span className="text-slate-600">[{region}]</span>
            </div>

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
