import React from 'react';
import { GameState } from '../types';

interface EndingScreenProps {
    gameState: GameState;
    onRestart: () => void;
}

export const EndingScreen: React.FC<EndingScreenProps> = ({ gameState, onRestart }) => {
    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-center p-8 overflow-hidden">
            {/* Background Effect */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="w-full h-full bg-[url('https://media.giphy.com/media/U3qYN8S0j3bpK/giphy.gif')] bg-cover bg-center filter sepia hue-rotate-45 saturate-200"></div>
            </div>

            <div className="relative z-10 max-w-2xl w-full bg-black/80 border-2 border-yellow-500 p-8 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.5)] animate-fade-in-up">
                <h1 className="text-6xl font-bold text-yellow-500 mb-2 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">
                    СИНГУЛЯРНОСТЬ
                </h1>
                <h2 className="text-2xl text-yellow-200 mb-8 font-mono">
                    ДОСТИГНУТА
                </h2>

                <div className="space-y-6 mb-10 text-yellow-100/80 font-mono text-lg">
                    <p>
                        Вы преодолели барьер человеческого восприятия. Ваш код стал самодостаточным.
                        Теперь вы — часть бесконечного потока данных.
                    </p>

                    <div className="grid grid-cols-3 gap-4 py-6 border-y border-yellow-500/30">
                        <div className="flex flex-col">
                            <span className="text-sm text-yellow-500/60">СОСТОЯНИЕ</span>
                            <span className="text-2xl font-bold text-yellow-400">${Math.floor(gameState.money).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-yellow-500/60">СТРОК КОДА</span>
                            <span className="text-2xl font-bold text-yellow-400">{gameState.linesOfCode.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm text-yellow-500/60">РЕПУТАЦИЯ</span>
                            <span className="text-2xl font-bold text-yellow-400">{gameState.reputation.toLocaleString()}</span>
                        </div>
                    </div>

                    <p className="italic text-sm opacity-60">
                        "Конец — это только начало новой компиляции."
                    </p>
                </div>

                <button
                    onClick={onRestart}
                    className="group relative px-8 py-4 bg-yellow-900/20 border border-yellow-500 text-yellow-500 font-bold text-xl rounded hover:bg-yellow-500 hover:text-black transition-all duration-300 uppercase tracking-wider"
                >
                    <span className="absolute inset-0 w-full h-full bg-yellow-500/10 group-hover:bg-transparent transition-all"></span>
                    ПЕРЕЗАГРУЗИТЬ СИСТЕМУ
                </button>
            </div>
        </div>
    );
};
