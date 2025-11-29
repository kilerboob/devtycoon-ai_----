
import React from 'react';
import { GameState } from '../types';

interface LeaderboardAppProps {
    state: GameState;
    onClose: () => void;
}

export const LeaderboardApp: React.FC<LeaderboardAppProps> = ({ state, onClose }) => {
    // Mock data based on player's current money to always put them somewhere in the middle
    const mockRankings = [
        { rank: 1, name: "ZeroCool", score: "$99,999,999", level: "CTO" },
        { rank: 2, name: "AcidBurn", score: "$54,200,000", level: "Architect" },
        { rank: 3, name: "Neo", score: "$12,500,000", level: "Lead" },
        // ... gap ...
    ];

    return (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] max-w-full bg-slate-900 border border-slate-600 rounded-lg shadow-2xl z-50 flex flex-col font-mono animate-in slide-in-from-bottom-10">
            <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
                <span className="text-yellow-500 font-bold">🏆 GLOBAL RANKINGS</span>
                <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-4">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-slate-500 border-b border-slate-700">
                            <th className="pb-2 pl-2">#</th>
                            <th className="pb-2">User</th>
                            <th className="pb-2">Net Worth</th>
                            <th className="pb-2 text-right pr-2">Level</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {mockRankings.map(r => (
                            <tr key={r.rank} className="bg-yellow-900/10">
                                <td className="py-2 pl-2 text-yellow-500 font-bold">{r.rank}</td>
                                <td className="py-2 text-white">{r.name}</td>
                                <td className="py-2 text-green-400">{r.score}</td>
                                <td className="py-2 text-right pr-2 text-purple-400">{r.level}</td>
                            </tr>
                        ))}
                        <tr>
                            <td className="py-2 text-center text-slate-600" colSpan={4}>...</td>
                        </tr>
                        <tr className="bg-blue-900/20 border border-blue-500/30">
                            <td className="py-2 pl-2 text-white font-bold">{Math.floor(10000 / (state.money + 1)) + 4}</td>
                            <td className="py-2 text-blue-300 font-bold">{state.username} (YOU)</td>
                            <td className="py-2 text-green-400">${Math.floor(state.money).toLocaleString()}</td>
                            <td className="py-2 text-right pr-2 text-purple-400">{state.level}</td>
                        </tr>
                         <tr>
                            <td className="py-2 text-center text-slate-600" colSpan={4}>...</td>
                        </tr>
                         <tr className="opacity-50">
                            <td className="py-2 pl-2 text-slate-500">999</td>
                            <td className="py-2 text-slate-400">ScriptKiddie</td>
                            <td className="py-2 text-green-400">$10</td>
                            <td className="py-2 text-right pr-2 text-slate-500">Intern</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
