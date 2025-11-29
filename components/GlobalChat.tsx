
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface GlobalChatProps {
    messages: ChatMessage[];
    onClose: () => void;
    onSendMessage: (text: string, channel: 'general' | 'trade' | 'shadow_net') => void;
    isShadowUnlocked: boolean;
    username: string;
}

export const GlobalChat: React.FC<GlobalChatProps> = ({ messages, onClose, onSendMessage, isShadowUnlocked, username }) => {
    const [channel, setChannel] = useState<'general' | 'trade' | 'shadow_net'>('general');
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const filteredMessages = messages.filter(m => m.channel === channel);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, channel]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input, channel);
            setInput('');
        }
    };

    return (
        <div className="absolute top-16 left-16 right-16 bottom-16 bg-[#1a1a1a] rounded-lg shadow-2xl flex border border-slate-700 font-sans z-50 animate-in fade-in zoom-in duration-300">
            {/* Sidebar Channels */}
            <div className="w-48 bg-[#111] border-r border-slate-800 p-2 flex flex-col">
                <div className="text-xs font-bold text-slate-500 uppercase px-2 mb-2 pt-2">Servers</div>
                
                <button 
                    onClick={() => setChannel('general')}
                    className={`text-left px-3 py-2 rounded text-sm mb-1 transition-colors ${channel === 'general' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    # general
                </button>
                <button 
                    onClick={() => setChannel('trade')}
                    className={`text-left px-3 py-2 rounded text-sm mb-1 transition-colors ${channel === 'trade' ? 'bg-slate-800 text-green-400' : 'text-slate-400 hover:text-green-300'}`}
                >
                    # market
                </button>
                {isShadowUnlocked && (
                     <button 
                        onClick={() => setChannel('shadow_net')}
                        className={`text-left px-3 py-2 rounded text-sm mb-1 transition-colors border border-red-900/30 ${channel === 'shadow_net' ? 'bg-red-900/20 text-red-500' : 'text-slate-600 hover:text-red-700'}`}
                    >
                        # shadow_net
                    </button>
                )}
                
                <div className="mt-auto px-2 pb-2">
                    <div className="text-xs text-slate-600">Online: {Math.floor(Math.random() * 500) + 100}</div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative bg-[#1a1a1a]">
                <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
                    <div className="font-bold text-slate-200">
                        {channel === 'shadow_net' ? '🕵️ DarkHub Connection' : channel === 'trade' ? '💰 Global Trade' : '🌐 General Chat'}
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {filteredMessages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 group animate-in slide-in-from-left-2 duration-200 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center text-xs font-bold ${msg.isMe ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                {msg.sender[0]}
                            </div>
                            <div className={`flex flex-col max-w-[80%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-xs font-bold ${msg.isMe ? 'text-blue-400' : msg.channel === 'shadow_net' ? 'text-red-400' : 'text-slate-400'}`}>
                                        {msg.sender}
                                    </span>
                                    <span className="text-[10px] text-slate-600">
                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <div className={`px-3 py-2 rounded-lg text-sm ${msg.isMe ? 'bg-blue-600/20 text-blue-100' : 'bg-slate-800/50 text-slate-300'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredMessages.length === 0 && (
                        <div className="text-center text-slate-600 mt-10 italic">Channel is empty...</div>
                    )}
                </div>

                <form onSubmit={handleSend} className="p-4 bg-[#111] border-t border-slate-800 flex gap-2">
                    <input 
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 text-sm"
                        placeholder={`Message #${channel}...`}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm">
                        SEND
                    </button>
                </form>
            </div>
        </div>
    );
};
