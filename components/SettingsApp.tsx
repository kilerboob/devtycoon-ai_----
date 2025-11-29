
import React from 'react';
import { Language } from '../types';

interface SettingsAppProps {
    onClose: () => void;
    onLogout: () => void;
    username: string;
    currentLanguage: Language;
    onSetLanguage: (lang: Language) => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({ onClose, onLogout, username, currentLanguage, onSetLanguage }) => {
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-slate-200 rounded-lg shadow-2xl border border-slate-400 overflow-hidden font-sans animate-in zoom-in duration-200">
            {/* Header */}
            <div className="h-8 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-between px-2">
                <span className="text-xs font-bold text-white">Control Panel</span>
                <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
            </div>

            <div className="p-4 bg-slate-100">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-300 pb-4">
                    <div className="w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center text-2xl border border-slate-400">
                        👤
                    </div>
                    <div>
                        <div className="font-bold text-slate-700">{username}</div>
                        <div className="text-xs text-slate-500">Administrator</div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="w-full bg-white border border-slate-300 rounded text-sm text-slate-700 p-2 flex justify-between items-center">
                        <span>Language / Язык</span>
                        <select 
                            value={currentLanguage}
                            onChange={(e) => onSetLanguage(e.target.value as Language)}
                            className="bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs outline-none"
                        >
                            <option value="en">English</option>
                            <option value="ru">Русский</option>
                            <option value="uk">Українська</option>
                        </select>
                    </div>

                    <button className="w-full text-left px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50 flex justify-between items-center">
                        <span>Sound Volume</span>
                        <span className="text-slate-400">100%</span>
                    </button>
                    <button className="w-full text-left px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50 flex justify-between items-center">
                        <span>Display Resolution</span>
                        <span className="text-slate-400">1080p</span>
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-300">
                    <button 
                        onClick={onLogout}
                        className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <span>⏻</span> SHUT DOWN / EXIT
                    </button>
                </div>
            </div>
        </div>
    );
};
