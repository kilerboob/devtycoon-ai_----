
import React, { useState, useEffect, useRef } from 'react';
import { playSound } from '../utils/sound';

interface HackingMinigameProps {
    onSuccess: () => void;
    onFail: () => void;
    difficulty?: number; // 1-5
}

const HEX_CHARS = ['1C', 'BD', '55', 'E9', '7A', 'FF'];

export const HackingMinigame: React.FC<HackingMinigameProps> = ({ onSuccess, onFail, difficulty = 1 }) => {
    const [gridSize, setGridSize] = useState(6);
    const [grid, setGrid] = useState<string[][]>([]);
    const [targets, setTargets] = useState<string[]>([]);
    const [buffer, setBuffer] = useState<string[]>([]);
    const [timeLeft, setTimeLeft] = useState(40); // Shorter timer
    const [activeIndex, setActiveIndex] = useState(0); // Row or Col index depending on orientation
    const [orientation, setOrientation] = useState<'ROW' | 'COL'>('ROW'); // Start horizontal
    const [usedCoords, setUsedCoords] = useState<Set<string>>(new Set());
    const [status, setStatus] = useState<'ACTIVE' | 'WIN' | 'FAIL'>('ACTIVE');

    // Init Game
    useEffect(() => {
        // Dynamic Grid Size: 6 to 8
        const size = 6 + Math.floor(Math.random() * 3);
        setGridSize(size);

        // Generate Grid
        const newGrid = Array(size).fill(0).map(() => 
            Array(size).fill(0).map(() => HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)])
        );
        setGrid(newGrid);

        // Generate Target Sequence: Length 5-7
        const seqLen = 5 + Math.floor(Math.random() * 3);
        const newTargets = Array(seqLen).fill(0).map(() => HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]);
        setTargets(newTargets);
        
        // Start timer
        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    setStatus('FAIL');
                    clearInterval(timer);
                    setTimeout(onFail, 2000);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []); // Run once on mount

    const handleCellClick = (row: number, col: number, val: string) => {
        if (status !== 'ACTIVE') return;
        
        // Validation: Must be in active row/col
        if (orientation === 'ROW' && row !== activeIndex) return;
        if (orientation === 'COL' && col !== activeIndex) return;
        
        // Validation: Already used
        const coordKey = `${row}-${col}`;
        if (usedCoords.has(coordKey)) return;

        playSound('key');

        // Logic
        const newBuffer = [...buffer, val];
        setBuffer(newBuffer);
        
        const newUsed = new Set(usedCoords);
        newUsed.add(coordKey);
        setUsedCoords(newUsed);

        // Switch orientation
        if (orientation === 'ROW') {
            setOrientation('COL');
            setActiveIndex(col);
        } else {
            setOrientation('ROW');
            setActiveIndex(row);
        }

        // Check Win/Fail
        const bufferStr = newBuffer.join('');
        const targetStr = targets.join('');
        
        if (bufferStr.includes(targetStr)) {
            setStatus('WIN');
            playSound('success');
            setTimeout(onSuccess, 1500);
        } else if (newBuffer.length >= 10) { // Max buffer limit
            setStatus('FAIL');
            playSound('error');
            setTimeout(onFail, 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center font-mono p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-5xl h-[650px] border-2 border-red-600 bg-black relative flex flex-col md:flex-row shadow-[0_0_50px_rgba(220,38,38,0.3)]">
                
                {/* Overlay Status */}
                {status === 'WIN' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-green-900/80 backdrop-blur-sm">
                        <div className="text-4xl font-bold text-white animate-pulse tracking-widest">ACCESS GRANTED</div>
                    </div>
                )}
                {status === 'FAIL' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/80 backdrop-blur-sm">
                        <div className="text-4xl font-bold text-white animate-pulse tracking-widest">BREACH DETECTED</div>
                    </div>
                )}

                {/* LEFT: Code Matrix */}
                <div className="flex-1 p-8 border-r border-red-800/50 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-scanline opacity-50 pointer-events-none"></div>
                    
                    <div className="flex justify-between mb-6 text-red-500 font-bold">
                        <span>NEURAL_LINK_V2.0</span>
                        <span className={`${timeLeft < 10 ? 'text-red-500 animate-ping' : 'text-white'}`}>TIMER: {timeLeft.toString().padStart(2, '0')}s</span>
                    </div>

                    <div className="grid gap-2 w-max mx-auto" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
                        {grid.map((row, rIdx) => (
                            row.map((cell, cIdx) => {
                                const isUsed = usedCoords.has(`${rIdx}-${cIdx}`);
                                const isActive = (orientation === 'ROW' && rIdx === activeIndex) || (orientation === 'COL' && cIdx === activeIndex);
                                const isHoverable = isActive && !isUsed;

                                return (
                                    <button
                                        key={`${rIdx}-${cIdx}`}
                                        onClick={() => handleCellClick(rIdx, cIdx, cell)}
                                        disabled={isUsed || !isActive}
                                        className={`
                                            w-10 h-10 flex items-center justify-center text-sm md:text-base font-bold border
                                            transition-all duration-150
                                            ${isUsed ? 'text-slate-800 border-slate-800 bg-transparent' : 
                                              isActive ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-black cursor-pointer' : 
                                              'text-slate-600 border-transparent'
                                            }
                                            ${isHoverable && 'animate-pulse'}
                                        `}
                                    >
                                        {isUsed ? '[]' : cell}
                                    </button>
                                );
                            })
                        ))}
                    </div>
                </div>

                {/* RIGHT: Info & Buffer */}
                <div className="w-full md:w-80 bg-[#0a0a0a] p-6 flex flex-col">
                    <h3 className="text-red-500 font-bold mb-6 text-center border-b border-red-900 pb-2">TARGET SEQUENCE</h3>
                    
                    <div className="flex justify-center flex-wrap gap-2 mb-10">
                        {targets.map((t, i) => (
                            <div key={i} className="w-10 h-10 border border-red-500 flex items-center justify-center text-white font-bold shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                                {t}
                            </div>
                        ))}
                    </div>

                    <h3 className="text-slate-500 font-bold mb-4 text-center text-xs">BUFFER MEMORY</h3>
                    <div className="flex gap-2 justify-center flex-wrap">
                        {Array.from({length: 10}).map((_, i) => (
                            <div key={i} className={`w-8 h-8 border flex items-center justify-center text-xs ${buffer[i] ? 'border-red-500 text-white bg-red-900/20' : 'border-slate-800 bg-slate-900'}`}>
                                {buffer[i] || ''}
                            </div>
                        ))}
                    </div>

                      <div className="mt-auto text-[10px] text-red-800 font-mono leading-relaxed space-y-1">
                          <p>{'>'} INITIALIZING BRUTE FORCE...</p>
                          <p>{'>'} BYPASSING FIREWALL LAYER 2...</p>
                          <p className="text-white">{'>'} {orientation === 'ROW' ? 'SELECT ROW VECTOR' : 'SELECT COLUMN VECTOR'}</p>
                          {status === 'FAIL' && <p className="text-red-500 font-bold animate-pulse">{'>'} CRITICAL FAILURE DETECTED</p>}
                      </div>
                </div>

            </div>
        </div>
    );
};
