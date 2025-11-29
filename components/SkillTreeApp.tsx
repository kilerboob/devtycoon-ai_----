
import React from 'react';
import { GameState, SkillPerk } from '../types';
import { SKILL_TREE } from '../constants';
import { playSound } from '../utils/sound';

interface SkillTreeAppProps {
    state: GameState;
    onUnlock: (perkId: string, cost: number) => void;
    onClose: () => void;
}

export const SkillTreeApp: React.FC<SkillTreeAppProps> = ({ state, onUnlock, onClose }) => {
    
    const handleUnlock = (perk: SkillPerk) => {
        if (state.unlockedPerks.includes(perk.id)) return;
        if (state.reputation >= perk.cost) {
            playSound('success');
            onUnlock(perk.id, perk.cost);
        } else {
            playSound('error');
        }
    };

    return (
        <div className="absolute top-10 left-10 right-10 bottom-10 bg-slate-900 rounded-lg shadow-2xl flex flex-col border border-slate-700 animate-in zoom-in duration-300 overflow-hidden font-sans">
            {/* Header */}
            <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-2xl">🧠</div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Neural Upgrade System</h2>
                        <div className="text-xs text-purple-400">Available Reputation: {state.reputation} XP</div>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Grid */}
            <div className="flex-1 p-8 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {SKILL_TREE.map(perk => {
                        const isUnlocked = state.unlockedPerks.includes(perk.id);
                        const canAfford = state.reputation >= perk.cost;

                        return (
                            <div 
                                key={perk.id}
                                className={`relative p-6 rounded-xl border-2 transition-all duration-300 group
                                    ${isUnlocked 
                                        ? 'bg-purple-900/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                                        : canAfford 
                                            ? 'bg-slate-800 border-slate-600 hover:border-purple-400 hover:scale-105 cursor-pointer' 
                                            : 'bg-slate-800/50 border-slate-700 opacity-70 cursor-not-allowed grayscale'
                                    }
                                `}
                                onClick={() => !isUnlocked && handleUnlock(perk)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="text-4xl">{perk.icon}</div>
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${isUnlocked ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                        {isUnlocked ? 'ACTIVE' : `${perk.cost} REP`}
                                    </div>
                                </div>
                                <h3 className={`text-lg font-bold mb-2 ${isUnlocked ? 'text-purple-400' : 'text-white'}`}>{perk.name}</h3>
                                <p className="text-sm text-slate-400">{perk.description}</p>
                                
                                {isUnlocked && (
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
