import React, { useState, useEffect, useRef } from 'react';

interface Channel {
  id: string;
  name: string;
  description?: string;
  type: string;
  member_count: number;
}

interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  mentions: string[];
  is_edited: boolean;
  created_at: string;
  reactions: Record<string, number>;
}

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function Signal2Messenger() {
  // State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mentionSuggestions, setMentionSuggestions] = useState<string[]>([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsReconnectRef = useRef<NodeJS.Timeout | null>(null);

  const userId = localStorage.getItem('userId') || 'guest-' + Math.random().toString(36).substr(2, 9);

  // Fetch channels on mount
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch('/api/channels');
        const data = await res.json();
        setChannels(data);
        if (data.length > 0) {
          setSelectedChannel(data[0]);
        }
      } catch (e) {
        console.error('Failed to fetch channels:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannels();
  }, []);

  // Fetch messages when channel changes
  useEffect(() => {
    if (!selectedChannel) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/channels/${selectedChannel.id}/messages?limit=50`);
        const data = await res.json();
        setMessages(data);
      } catch (e) {
        console.error('Failed to fetch messages:', e);
      }
    };

    fetchMessages();
    scrollToBottom();
  }, [selectedChannel]);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/messages`;

      try {
        const wsClient = new WebSocket(wsUrl);

        wsClient.onopen = () => {
          console.log('[Signal2] WebSocket connected');
          if (wsReconnectRef.current) {
            clearTimeout(wsReconnectRef.current);
          }
        };

        wsClient.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleWSMessage(data);
        };

        wsClient.onclose = () => {
          console.log('[Signal2] WebSocket disconnected');
          wsReconnectRef.current = setTimeout(connectWebSocket, 3000);
        };

        wsClient.onerror = (error) => {
          console.error('[Signal2] WebSocket error:', error);
        };

        setWs(wsClient);
      } catch (e) {
        console.error('[Signal2] Failed to connect WebSocket:', e);
        wsReconnectRef.current = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsReconnectRef.current) clearTimeout(wsReconnectRef.current);
    };
  }, []);

  // Subscribe to channel when selected
  useEffect(() => {
    if (ws && selectedChannel && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel_id: selectedChannel.id
      }));
    }
  }, [ws, selectedChannel]);

  // Handle WebSocket messages
  const handleWSMessage = (data: any) => {
    switch (data.type) {
      case 'new_message':
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
        break;
      case 'user_typing':
        console.log(`${data.user_id} is typing in ${data.channel_id}`);
        break;
      case 'mentioned':
        setNotifications(prev => [...prev, data]);
        break;
      case 'notification':
        setNotifications(prev => [...prev, data]);
        break;
    }
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  // Handle mention detection
  const handleMessageChange = (text: string) => {
    setMessageInput(text);

    const lastAtSign = text.lastIndexOf('@');
    if (lastAtSign !== -1) {
      const afterAt = text.substring(lastAtSign + 1);
      if (!afterAt.includes(' ')) {
        setShowMentionMenu(true);
        // Simple mention suggestions - in real app would fetch from users list
        const suggestions = ['admin', 'moderator', 'friend1', 'friend2'].filter(
          name => name.includes(afterAt.toLowerCase())
        );
        setMentionSuggestions(suggestions);
      }
    } else {
      setShowMentionMenu(false);
    }
  };

  // Handle mention selection
  const selectMention = (username: string) => {
    const lastAtSign = messageInput.lastIndexOf('@');
    const beforeMention = messageInput.substring(0, lastAtSign);
    const afterMention = messageInput.substring(messageInput.length);
    setMessageInput(`${beforeMention}@${username} `);
    setShowMentionMenu(false);
  };

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChannel || !ws) return;

    // Extract mentions
    const mentionRegex = /@(\w+)/g;
    const mentions = Array.from(messageInput.matchAll(mentionRegex)).map(m => m[1]);

    try {
      // Send via WebSocket
      ws.send(JSON.stringify({
        type: 'message',
        channel_id: selectedChannel.id,
        content: messageInput,
        sender_name: localStorage.getItem('userName') || userId,
        mentions
      }));

      setMessageInput('');
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  // Render mention in message
  const renderMessage = (text: string) => {
    const parts = text.split(/(@\w+)/);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="font-bold text-blue-400">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-900 text-white">
      {/* Channel Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-cyan-400">Signal 2.0</h2>
          <p className="text-xs text-gray-500">Channels & Messages</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className={`w-full text-left px-4 py-2 transition-colors ${
                selectedChannel?.id === channel.id
                  ? 'bg-gray-700 text-cyan-400 border-l-2 border-cyan-400'
                  : 'hover:bg-gray-700'
              }`}
            >
              <div className="font-semibold">
                {channel.type === 'dm' ? '💬' : channel.type === 'guild' ? '⚔️' : '#'} {channel.name}
              </div>
              <div className="text-xs text-gray-400">
                {channel.member_count} members
              </div>
            </button>
          ))}
        </div>

        <button
          className="m-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded font-bold transition-colors text-sm"
        >
          + New Channel
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {selectedChannel && (
          <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-cyan-400">
                {selectedChannel.type === 'dm' ? '💬' : selectedChannel.type === 'guild' ? '⚔️' : '#'} {selectedChannel.name}
              </h1>
              <p className="text-sm text-gray-400">{selectedChannel.description || 'No description'}</p>
            </div>
            <div className="text-sm">
              <span className="px-3 py-1 bg-cyan-900 rounded">
                {selectedChannel.member_count} online
              </span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg">No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="group hover:bg-gray-800 p-2 rounded transition-colors">
                <div className="flex items-baseline space-x-2">
                  <span className="font-bold text-cyan-400">{msg.sender_name}</span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                  {msg.is_edited && (
                    <span className="text-xs text-gray-600">(edited)</span>
                  )}
                </div>
                <div className="text-gray-100 mt-1 break-words">
                  {renderMessage(msg.content)}
                </div>
                {Object.keys(msg.reactions).length > 0 && (
                  <div className="flex gap-1 mt-2 text-sm">
                    {Object.entries(msg.reactions).map(([emoji, count]) => (
                      <span key={emoji} className="bg-gray-700 px-2 py-1 rounded">
                        {emoji} {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          {/* Mention Menu */}
          {showMentionMenu && mentionSuggestions.length > 0 && (
            <div className="mb-2 bg-gray-700 rounded border border-gray-600 shadow-lg">
              {mentionSuggestions.map(name => (
                <button
                  key={name}
                  onClick={() => selectMention(name)}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-600 text-sm transition-colors first:rounded-t last:rounded-b"
                >
                  @{name}
                </button>
              ))}
            </div>
          )}

          {/* Notifications */}
          {notifications.filter(n => !n.is_read).length > 0 && (
            <div className="mb-2 bg-blue-900 border border-blue-700 rounded p-3">
              <div className="text-xs font-bold text-blue-300 mb-1">📢 {notifications.filter(n => !n.is_read).length} Unread</div>
              {notifications.filter(n => !n.is_read).slice(0, 2).map(notif => (
                <div key={notif.id} className="text-xs text-blue-100 mt-1">
                  • {notif.title}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={e => handleMessageChange(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  sendMessage(e as any);
                }
              }}
              placeholder="Type a message (use @ to mention)..."
              className="flex-1 bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-500 text-sm"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded font-bold transition-colors text-sm"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
