
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types';
import { wsClient, ConnectionState, SyncEvent, ChatMessage as WSChatMessage } from '../services/wsClient';

interface GlobalChatProps {
    messages: ChatMessage[];
    onClose: () => void;
    onSendMessage: (text: string, channel: 'general' | 'trade' | 'shadow_net') => void;
    isShadowUnlocked: boolean;
    username: string;
    playerId?: string;
    shardId?: string;
}

export const GlobalChat: React.FC<GlobalChatProps> = ({ 
    messages, 
    onClose, 
    onSendMessage, 
    isShadowUnlocked, 
    username,
    playerId = 'local_player',
    shardId = 'local'
}) => {
    const [channel, setChannel] = useState<'general' | 'trade' | 'shadow_net'>('general');
    const [input, setInput] = useState('');
    const [wsMessages, setWsMessages] = useState<Array<{
        id: string;
        sender: string;
        senderId: string;
        text: string;
        timestamp: number;
        channel: string;
        isMe: boolean;
    }>>([]);
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [onlineCount, setOnlineCount] = useState(0);
    const [latency, setLatency] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Connect to WebSocket server
    useEffect(() => {
        const serverUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_WS_URL) || 'http://localhost:3001';
        
        // Try to connect
        wsClient.connect({
            serverUrl,
            playerId,
            playerName: username,
            shardId
        }).then(connected => {
            if (connected) {
                console.log('[GlobalChat] WebSocket connected');
            } else {
                console.warn('[GlobalChat] WebSocket connection failed, using local mode');
            }
        });

        // Connection state listener
        const unsubState = wsClient.onStateChange((state) => {
            setConnectionState(state);
            if (state === 'connected') {
                setOnlineCount(wsClient.getOnlineCount());
            }
        });

        // Chat message listener
        const unsubChat = wsClient.on<WSChatMessage>('CHAT_MESSAGE', (event) => {
            const payload = event.payload;
            setWsMessages(prev => [...prev, {
                id: payload.messageId,
                sender: payload.senderName,
                senderId: payload.senderId,
                text: payload.content,
                timestamp: payload.timestamp,
                channel: mapWSChannel(payload.channel),
                isMe: payload.senderId === playerId
            }]);
        });

        const unsubGlobalChat = wsClient.on<WSChatMessage>('CHAT_GLOBAL', (event) => {
            const payload = event.payload;
            setWsMessages(prev => [...prev, {
                id: payload.messageId,
                sender: payload.senderName,
                senderId: payload.senderId,
                text: payload.content,
                timestamp: payload.timestamp,
                channel: 'general',
                isMe: payload.senderId === playerId
            }]);
        });

        // Player join/leave notifications
        const unsubJoin = wsClient.on('PLAYER_JOIN', (event) => {
            const payload = event.payload as { playerName: string };
            setWsMessages(prev => [...prev, {
                id: `join-${Date.now()}`,
                sender: 'System',
                senderId: 'system',
                text: `${payload.playerName} joined the server`,
                timestamp: Date.now(),
                channel: 'general',
                isMe: false
            }]);
            setOnlineCount(wsClient.getOnlineCount());
        });

        const unsubLeave = wsClient.on('PLAYER_LEAVE', (event) => {
            const payload = event.payload as { playerId: string };
            const players = wsClient.getShardPlayers();
            const player = players.find(p => p.playerId === payload.playerId);
            if (player) {
                setWsMessages(prev => [...prev, {
                    id: `leave-${Date.now()}`,
                    sender: 'System',
                    senderId: 'system',
                    text: `${player.playerName} left the server`,
                    timestamp: Date.now(),
                    channel: 'general',
                    isMe: false
                }]);
            }
            setOnlineCount(wsClient.getOnlineCount());
        });

        // Latency update
        const latencyInterval = setInterval(() => {
            if (wsClient.isConnected()) {
                setLatency(wsClient.getLatency());
                setOnlineCount(wsClient.getOnlineCount());
            }
        }, 5000);

        return () => {
            unsubState();
            unsubChat();
            unsubGlobalChat();
            unsubJoin();
            unsubLeave();
            clearInterval(latencyInterval);
        };
    }, [playerId, username, shardId]);

    // Map WS channel to local channel
    const mapWSChannel = (wsChannel: string): 'general' | 'trade' | 'shadow_net' => {
        switch (wsChannel) {
            case 'global': return 'general';
            case 'shard': return 'trade';
            case 'corp': return 'shadow_net';
            default: return 'general';
        }
    };

    // Map local channel to WS channel
    const mapLocalChannel = (localChannel: string): 'global' | 'shard' | 'corp' | 'private' => {
        switch (localChannel) {
            case 'general': return 'global';
            case 'trade': return 'shard';
            case 'shadow_net': return 'corp';
            default: return 'global';
        }
    };

    // Combined messages (local + WS)
    const allMessages = [
        ...messages.map(m => ({
            ...m,
            isMe: m.sender === username,
            senderId: m.isMe ? playerId : 'other'
        })),
        ...wsMessages
    ].sort((a, b) => a.timestamp - b.timestamp);

    const filteredMessages = allMessages.filter(m => m.channel === channel);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [allMessages, channel]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            // Send via WebSocket if connected
            if (wsClient.isConnected()) {
                wsClient.sendChatMessage(input, mapLocalChannel(channel));
                // Add to local messages immediately (optimistic update)
                setWsMessages(prev => [...prev, {
                    id: `local-${Date.now()}`,
                    sender: username,
                    senderId: playerId,
                    text: input,
                    timestamp: Date.now(),
                    channel: channel,
                    isMe: true
                }]);
            } else {
                // Fallback to local handler
                onSendMessage(input, channel);
            }
            setInput('');
        }
    };

    // Connection status indicator
    const getConnectionIndicator = () => {
        switch (connectionState) {
            case 'connected':
                return <span className="text-green-400">● Online</span>;
            case 'connecting':
                return <span className="text-yellow-400">◐ Connecting...</span>;
            case 'reconnecting':
                return <span className="text-orange-400">◑ Reconnecting...</span>;
            default:
                return <span className="text-red-400">○ Offline</span>;
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
                
                <div className="mt-auto px-2 pb-2 space-y-1">
                    <div className="text-xs text-slate-600">
                        {getConnectionIndicator()}
                    </div>
                    <div className="text-xs text-slate-600">
                        Online: {onlineCount}
                    </div>
                    {connectionState === 'connected' && (
                        <div className="text-xs text-slate-600">
                            Ping: <span className={latency < 50 ? 'text-green-400' : latency < 150 ? 'text-yellow-400' : 'text-red-400'}>{latency}ms</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative bg-[#1a1a1a]">
                <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
                    <div className="font-bold text-slate-200">
                        {channel === 'shadow_net' ? '🕵️ DarkHub Connection' : channel === 'trade' ? '💰 Global Trade' : '🌐 General Chat'}
                        {connectionState === 'connected' && <span className="ml-2 text-xs text-green-500">(Live)</span>}
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {filteredMessages.map((msg, i) => (
                        <div key={msg.id || i} className={`flex gap-3 group animate-in slide-in-from-left-2 duration-200 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center text-xs font-bold ${msg.isMe ? 'bg-blue-600 text-white' : msg.senderId === 'system' ? 'bg-slate-600 text-slate-300' : 'bg-slate-700 text-slate-300'}`}>
                                {msg.senderId === 'system' ? '📢' : msg.sender[0]}
                            </div>
                            <div className={`flex flex-col max-w-[80%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-xs font-bold ${msg.isMe ? 'text-blue-400' : msg.senderId === 'system' ? 'text-yellow-400' : msg.channel === 'shadow_net' ? 'text-red-400' : 'text-slate-400'}`}>
                                        {msg.sender}
                                    </span>
                                    <span className="text-[10px] text-slate-600">
                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <div className={`px-3 py-2 rounded-lg text-sm ${msg.isMe ? 'bg-blue-600/20 text-blue-100' : msg.senderId === 'system' ? 'bg-yellow-900/20 text-yellow-200 italic' : 'bg-slate-800/50 text-slate-300'}`}>
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
