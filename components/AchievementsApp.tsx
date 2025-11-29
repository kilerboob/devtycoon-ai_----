import React from 'react';
import { GameState } from '../types';
import { ACHIEVEMENTS } from '../constants';

interface AchievementsAppProps {
    state: GameState;
    onClose: () => void;
}

export const AchievementsApp: React.FC<AchievementsAppProps> = ({ state, onClose }) => {
    const categories = ['all', 'economy', 'coding', 'hacking', 'hardware', 'story'] as const;
    const [selectedCategory, setSelectedCategory] = React.useState<typeof categories[number]>('all');

    const filteredAchievements = ACHIEVEMENTS.filter(ach => {
        if (selectedCategory !== 'all' && ach.category !== selectedCategory) return false;
        if (ach.hidden && !state.unlockedAchievements.includes(ach.id)) return false;
        return true;
    });

    const unlockedCount = state.unlockedAchievements.length;
    const totalCount = ACHIEVEMENTS.filter(a => !a.hidden).length;
    const progress = Math.floor((unlockedCount / totalCount) * 100);

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'economy': return '💰';
            case 'coding': return '💻';
            case 'hacking': return '🔓';
            case 'hardware': return '🖥️';
            case 'story': return '📖';
            default: return '🏆';
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-purple-500 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                {/* Header */}
                <div className="p-6 border-b border-purple-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl font-bold text-purple-400 flex items-center gap-3">
                            🏆 Достижения
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-3xl text-slate-400 hover:text-white transition-colors"
                        >
                            ×
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-400">
                            <span>Прогресс</span>
                            <span>{unlockedCount} / {totalCount} ({progress}%)</span>
                        </div>
                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="p-4 border-b border-purple-500/30 flex gap-2 overflow-x-auto">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`
                px-4 py-2 rounded-lg font-mono text-sm whitespace-nowrap transition-all
                ${selectedCategory === cat
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }
              `}
                        >
                            {getCategoryIcon(cat)} {cat === 'all' ? 'Все' : cat}
                        </button>
                    ))}
                </div>

                {/* Achievements Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredAchievements.map(ach => {
                            const isUnlocked = state.unlockedAchievements.includes(ach.id);

                            return (
                                <div
                                    key={ach.id}
                                    className={`
                    p-4 rounded-lg border-2 transition-all
                    ${isUnlocked
                                            ? 'bg-purple-900/30 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                            : 'bg-slate-800/50 border-slate-700 opacity-60'
                                        }
                  `}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`text-4xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                                            {ach.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className={`font-bold ${isUnlocked ? 'text-purple-300' : 'text-slate-500'}`}>
                                                    {ach.title}
                                                </h3>
                                                {isUnlocked && (
                                                    <span className="text-green-500 text-sm">✓</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-400 mb-2">
                                                {ach.description}
                                            </p>
                                            {ach.reward && (
                                                <div className="flex gap-2 text-xs text-slate-500">
                                                    {ach.reward.money && <span>💵 ${ach.reward.money}</span>}
                                                    {ach.reward.reputation && <span>⭐ {ach.reward.reputation}</span>}
                                                    {ach.reward.shadowCredits && <span>🔮 {ach.reward.shadowCredits}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
