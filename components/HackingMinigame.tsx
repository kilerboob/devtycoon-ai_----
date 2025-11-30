/**
 * LAYER 14: Enhanced HackingMinigame
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../utils/sound';

interface HackingMinigameProps {
    onSuccess: () => void;
    onFail: () => void;
    difficulty?: number;
}

const HEX_CHARS = ['1C', 'BD', '55', 'E9', '7A', 'FF', 'A3', '2D', '8F', 'C7'];

const getDifficultyParams = (diff: number) => {
    const d = Math.max(1, Math.min(10, diff));
    return {
        gridSize: 5 + Math.min(5, Math.floor(d / 2)),
        targetLength: 4 + Math.min(6, Math.floor(d / 1.5)),
        timer: Math.max(20, 50 - d * 3),
        bufferSize: Math.max(8, 12 - Math.floor(d / 3)),
        hasICE: d >= 3,
        iceCount: d >= 3 ? Math.floor(d / 2) : 0,
        hasScramble: d >= 5,
        scrambleInterval: d >= 5 ? Math.max(5, 15 - d) : 0,
        hasFirewall: d >= 7,
        firewallDuration: d >= 7 ? 3 : 0,
        hasDecoy: d >= 8,
        decoyCount: d >= 8 ? Math.floor((d - 7) / 2) + 1 : 0,
        charCount: Math.min(10, 6 + Math.floor(d / 3)),
    };
};

export const HackingMinigame: React.FC<HackingMinigameProps> = ({ onSuccess, onFail, difficulty = 1 }) => {
    const params = getDifficultyParams(difficulty);
    const [gridSize] = useState(params.gridSize);
    const [grid, setGrid] = useState<string[][]>([]);
    const [targets, setTargets] = useState<string[]>([]);
    const [decoys, setDecoys] = useState<string[][]>([]);
    const [buffer, setBuffer] = useState<string[]>([]);
    const [timeLeft, setTimeLeft] = useState(params.timer);
    const [activeIndex, setActiveIndex] = useState(0);
    const [orientation, setOrientation] = useState<'ROW' | 'COL'>('ROW');
    const [usedCoords, setUsedCoords] = useState<Set<string>>(new Set());
    const [iceCoords, setIceCoords] = useState<Set<string>>(new Set());
    const [status, setStatus] = useState<'ACTIVE' | 'WIN' | 'FAIL'>('ACTIVE');
    const [firewallActive, setFirewallActive] = useState<{ type: 'ROW' | 'COL'; index: number } | null>(null);
    const [scrambleWarning, setScrambleWarning] = useState(false);
    const [iceHit, setIceHit] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const scrambleRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const usedCoordsRef = useRef<Set<string>>(new Set());

    const getAvailableChars = useCallback(() => HEX_CHARS.slice(0, params.charCount), [params.charCount]);

    useEffect(() => {
        const chars = getAvailableChars();
        const size = params.gridSize;
        setGrid(Array(size).fill(0).map(() => Array(size).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)])));
        setTargets(Array(params.targetLength).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]));
        if (params.hasICE) {
            const iceSet = new Set<string>();
            while (iceSet.size < params.iceCount) iceSet.add(`${Math.floor(Math.random() * size)}-${Math.floor(Math.random() * size)}`);
            setIceCoords(iceSet);
        }
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { setStatus('FAIL'); if (timerRef.current) clearInterval(timerRef.current); setTimeout(onFail, 2000); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); if (scrambleRef.current) clearInterval(scrambleRef.current); };
    }, []);

    const handleCellClick = (row: number, col: number, cell: string) => {
        if (status !== 'ACTIVE') return;
        if (usedCoords.has(`${row}-${col}`)) return;
        if ((orientation === 'ROW' && row !== activeIndex) || (orientation === 'COL' && col !== activeIndex)) return;
        if (iceCoords.has(`${row}-${col}`)) { setIceHit(true); playSound('error'); setTimeLeft(t => Math.max(1, t - 5)); setTimeout(() => setIceHit(false), 500); }
        playSound('key');
        const newBuffer = [...buffer, cell];
        setBuffer(newBuffer);
        setUsedCoords(new Set([...usedCoords, `${row}-${col}`]));
        if (orientation === 'ROW') { setOrientation('COL'); setActiveIndex(col); } else { setOrientation('ROW'); setActiveIndex(row); }
        if (newBuffer.join('').includes(targets.join(''))) { setStatus('WIN'); playSound('success'); if (timerRef.current) clearInterval(timerRef.current); setTimeout(onSuccess, 1500); }
        else if (newBuffer.length >= params.bufferSize) { setStatus('FAIL'); playSound('error'); if (timerRef.current) clearInterval(timerRef.current); setTimeout(onFail, 2000); }
    };

    const diffLabel = difficulty <= 2 ? { text: 'EASY', color: 'text-green-500' } : difficulty <= 4 ? { text: 'MEDIUM', color: 'text-yellow-500' } : difficulty <= 6 ? { text: 'HARD', color: 'text-orange-500' } : { text: 'EXTREME', color: 'text-red-500' };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center font-mono p-4">
            <div className={`w-full max-w-5xl h-[700px] border-2 bg-black relative flex flex-col md:flex-row shadow-[0_0_50px_rgba(220,38,38,0.3)] ${iceHit ? 'border-cyan-500' : 'border-red-600'}`}>
                {status === 'WIN' && <div className="absolute inset-0 z-50 flex items-center justify-center bg-green-900/80"><div className="text-4xl font-bold text-white animate-pulse">ACCESS GRANTED</div></div>}
                {status === 'FAIL' && <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/80"><div className="text-4xl font-bold text-white animate-pulse">BREACH DETECTED</div></div>}
                <div className="flex-1 p-6 border-r border-red-800/50 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-red-500 font-bold">NEURAL_LINK [LVL {difficulty}]</span>
                        <span className={`font-bold ${timeLeft < 10 ? 'text-red-500 animate-ping' : 'text-white'}`}>TIMER: {timeLeft}s</span>
                    </div>
                    <div className="flex gap-2 mb-4 text-[10px]">
                        {params.hasICE && <span className="px-2 py-0.5 bg-cyan-900/50 border border-cyan-500 text-cyan-400 rounded">ICE ({params.iceCount})</span>}
                    </div>
                    <div className="grid gap-1.5 w-max mx-auto" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
                        {grid.map((row, rIdx) => row.map((cell, cIdx) => {
                            const isUsed = usedCoords.has(`${rIdx}-${cIdx}`);
                            const isICE = iceCoords.has(`${rIdx}-${cIdx}`) && !isUsed;
                            const isActive = (orientation === 'ROW' && rIdx === activeIndex) || (orientation === 'COL' && cIdx === activeIndex);
                            return <button key={`${rIdx}-${cIdx}`} onClick={() => handleCellClick(rIdx, cIdx, cell)} disabled={isUsed || !isActive}
                                className={`w-9 h-9 flex items-center justify-center text-sm font-bold border ${isUsed ? 'text-slate-800 border-slate-800' : isICE && isActive ? 'border-cyan-500 text-cyan-400 hover:bg-cyan-500' : isActive ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-black' : 'text-slate-600 border-transparent'}`}>
                                {isUsed ? '[]' : cell}
                            </button>;
                        }))}
                    </div>
                </div>
                <div className="w-full md:w-80 bg-[#0a0a0a] p-6 flex flex-col">
                    <h3 className="text-red-500 font-bold mb-4 text-center border-b border-red-900 pb-2">TARGET SEQUENCE</h3>
                    <div className="flex justify-center flex-wrap gap-2 mb-6">{targets.map((t, i) => <div key={i} className="w-10 h-10 border border-red-500 flex items-center justify-center text-white font-bold">{t}</div>)}</div>
                    <h3 className="text-slate-500 font-bold mb-3 text-center text-xs">BUFFER [{buffer.length}/{params.bufferSize}]</h3>
                    <div className="flex gap-1.5 justify-center flex-wrap">{Array.from({length: params.bufferSize}).map((_, i) => <div key={i} className={`w-8 h-8 border flex items-center justify-center text-xs ${buffer[i] ? 'border-red-500 text-white' : 'border-slate-800'}`}>{buffer[i] || ''}</div>)}</div>
                    <div className="mt-auto text-[10px] text-red-800 space-y-1">
                        <p>&gt; {orientation === 'ROW' ? 'SELECT ROW' : 'SELECT COLUMN'}</p>
                        {iceHit && <p className="text-cyan-500">&gt; ICE TRIGGERED [-5s]</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
