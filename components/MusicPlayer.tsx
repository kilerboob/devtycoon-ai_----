
import React, { useState, useRef, useEffect } from 'react';
import { RADIO_STATIONS } from '../constants';

interface MusicPlayerProps {
    onClose: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ onClose }) => {
    const [currentStationIndex, setCurrentStationIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [customUrl, setCustomUrl] = useState('');
    const [mode, setMode] = useState<'RADIO' | 'CUSTOM'>('RADIO');
    
    const audioRef = useRef<HTMLAudioElement>(null);

    const activeSource = mode === 'RADIO' ? RADIO_STATIONS[currentStationIndex].url : customUrl;
    const activeTitle = mode === 'RADIO' ? RADIO_STATIONS[currentStationIndex].name : 'Custom Stream';

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        // When source changes, if playing, reload and play
        if (isPlaying && audioRef.current) {
            audioRef.current.src = activeSource;
            audioRef.current.play().catch(e => console.error("Stream error", e));
        }
    }, [activeSource]);

    const handlePlayToggle = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.src = activeSource;
            audioRef.current.play().catch(e => console.error("Play error", e));
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (time: number) => {
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="absolute top-20 right-20 w-80 bg-[#2d2d2d] border-2 border-slate-500 rounded-t-lg shadow-2xl overflow-hidden font-mono z-50 select-none animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="h-6 bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-between px-2 cursor-move border-b border-black">
                <span className="text-[10px] text-yellow-500 font-bold">NET_RADIO_TUNER_v3.0</span>
                <button onClick={onClose} className="w-3 h-3 bg-red-500 rounded-sm hover:bg-red-400 text-[8px] flex items-center justify-center">x</button>
            </div>

            <div className="p-3 bg-[#1e1e1e]">
                
                {/* Display */}
                <div className="flex gap-2 mb-3">
                    <div className="bg-black border border-slate-600 px-2 py-1 text-green-400 font-digital text-xl w-24 text-center">
                        {formatTime(currentTime)}
                    </div>
                    {/* Visualizer */}
                    <div className="flex-1 bg-black border border-slate-600 flex items-end gap-[2px] p-1 h-10 overflow-hidden relative">
                        {/* Static text if not playing */}
                        {!isPlaying && <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500">OFF AIR</div>}
                        {Array.from({length: 20}).map((_, i) => (
                            <div 
                                key={i} 
                                className={`flex-1 bg-green-500 transition-all duration-75 ${isPlaying ? 'animate-pulse' : ''}`}
                                style={{ height: isPlaying ? `${Math.random() * 100}%` : '5%' }}
                            ></div>
                        ))}
                    </div>
                </div>

                {/* Info Marquee */}
                <div className="bg-black border border-slate-600 p-1 mb-3 text-xs text-yellow-400 truncate">
                    {isPlaying ? `>>> ON AIR: ${activeTitle} <<<` : "READY TO TUNE"}
                </div>

                {/* Source Selection */}
                <div className="flex gap-2 mb-2 text-[10px]">
                    <button 
                        onClick={() => setMode('RADIO')} 
                        className={`flex-1 py-1 border ${mode === 'RADIO' ? 'bg-green-700 text-white border-green-500' : 'bg-slate-800 text-slate-400 border-slate-600'}`}
                    >
                        PRESETS
                    </button>
                    <button 
                        onClick={() => setMode('CUSTOM')} 
                        className={`flex-1 py-1 border ${mode === 'CUSTOM' ? 'bg-green-700 text-white border-green-500' : 'bg-slate-800 text-slate-400 border-slate-600'}`}
                    >
                        URL INPUT
                    </button>
                </div>

                {mode === 'RADIO' ? (
                     <div className="grid grid-cols-2 gap-2 mb-3">
                         {RADIO_STATIONS.map((station, i) => (
                             <button 
                                key={i}
                                onClick={() => setCurrentStationIndex(i)}
                                className={`text-[9px] py-1 border rounded truncate px-1 ${currentStationIndex === i ? 'border-yellow-500 text-yellow-500 bg-yellow-900/20' : 'border-slate-600 text-slate-400 hover:bg-slate-800'}`}
                             >
                                 {station.name}
                             </button>
                         ))}
                     </div>
                ) : (
                    <div className="mb-3">
                        <input 
                            type="text" 
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="https://stream-url.mp3"
                            className="w-full bg-black border border-slate-600 text-slate-300 text-[10px] p-1 outline-none focus:border-green-500"
                        />
                    </div>
                )}

                {/* Controls */}
                <div className="flex justify-between items-center">
                    <button 
                        onClick={handlePlayToggle} 
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg active:scale-95 transition-all ${isPlaying ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                    >
                        {isPlaying ? '■' : '▶'}
                    </button>
                    
                    <div className="flex flex-col w-32 gap-1">
                         <span className="text-[9px] text-slate-500">MASTER GAIN</span>
                         <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.05" 
                            value={volume} 
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:rounded-full"
                         />
                    </div>
                </div>
            </div>

            <audio 
                ref={audioRef}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                crossOrigin="anonymous"
                onError={() => { if(isPlaying) setIsPlaying(false); alert("Stream failed to load"); }}
            />
        </div>
    );
};
