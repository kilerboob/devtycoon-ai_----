
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_MESSAGES } from '../constants';
import { Message, ChatMessage, Email } from '../types';

interface MessengerProps {
  onClose: () => void;
  hasUnread: boolean;
  // Global Chat Props
  globalMessages?: ChatMessage[];
  onSendGlobal?: (text: string, channel: 'general' | 'trade' | 'shadow_net') => void;
  isShadowUnlocked?: boolean;
  username?: string;
  emails?: Email[];
}

type ViewMode = 'DM' | 'CHANNEL' | 'EMAIL';

export const Messenger: React.FC<MessengerProps> = ({ onClose, hasUnread, globalMessages = [], onSendGlobal, isShadowUnlocked = false, username = "Me", emails = [] }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('DM');
  
  // DM State
  const [activeContact, setActiveContact] = useState<string | null>('Mom');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [showVideo, setShowVideo] = useState(false);

  // Global Chat State
  const [activeChannel, setActiveChannel] = useState<'general' | 'trade' | 'shadow_net'>('general');
  const [chatInput, setChatInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Email State
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [messages, globalMessages, activeContact, activeChannel, viewMode]);

  // DM Helper: Filter messages
  const filteredDMs = activeContact ? messages.filter(m => m.sender === activeContact || m.sender === 'Me') : [];

  // Global Helper: Filter messages
  const filteredGlobal = globalMessages.filter(m => m.channel === activeChannel);

  const handleDMReply = (text: string) => {
      const newMsg: Message = {
          id: Date.now().toString(),
          sender: 'Me',
          text: text,
          avatar: '😎',
          timestamp: Date.now(),
          isRead: true
      };
      setMessages(prev => [...prev, newMsg]);
      
      // Sim response
      setTimeout(() => {
          const response: Message = {
             id: Date.now().toString(),
             sender: activeContact || 'Unknown',
             text: 'Хорошо. Береги себя.',
             avatar: activeContact === 'Mom' ? '👩' : '👁️',
             timestamp: Date.now(),
             isRead: true
          };
          setMessages(prev => [...prev, response]);
      }, 2000);
  };

  const handleGlobalSend = (e: React.FormEvent) => {
      e.preventDefault();
      if (chatInput.trim() && onSendGlobal) {
          onSendGlobal(chatInput, activeChannel);
          setChatInput('');
      }
  };

  return (
    <div className="absolute top-10 left-10 right-10 bottom-10 bg-white rounded-lg shadow-2xl flex overflow-hidden animate-in fade-in zoom-in duration-300 font-sans">
       {/* Sidebar */}
       <div className="w-64 bg-slate-100 border-r border-slate-200 flex flex-col">
           <div className="p-4 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center bg-slate-50">
               <span className="text-blue-600">Signal v4.0</span>
               <button onClick={onClose} className="text-slate-400 hover:text-red-500">✕</button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 space-y-6">
               {/* Section: INBOX */}
               <div>
                   <button 
                        onClick={() => { setViewMode('EMAIL'); setSelectedEmail(null); }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors flex items-center gap-2 ${viewMode === 'EMAIL' ? 'bg-blue-100 text-blue-800' : 'text-slate-700 hover:bg-slate-200'}`}
                   >
                       <span>📧</span> Inbox
                       {emails.filter(e => !e.isRead).length > 0 && (
                           <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 rounded-full">{emails.filter(e => !e.isRead).length}</span>
                       )}
                   </button>
               </div>

               {/* Section: DIRECT MESSAGES */}
               <div>
                   <div className="text-xs font-bold text-slate-400 uppercase px-2 mb-2">Direct Messages</div>
                   {['Mom', 'Unknown', 'Alice (HR)'].map(contact => (
                       <div 
                          key={contact}
                          onClick={() => { setViewMode('DM'); setActiveContact(contact); }}
                          className={`p-2 flex items-center gap-3 cursor-pointer rounded-md transition-colors hover:bg-slate-200 ${viewMode === 'DM' && activeContact === contact ? 'bg-blue-100 text-blue-800' : 'text-slate-700'}`}
                       >
                           <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-sm">
                               {contact === 'Mom' ? '👩' : contact === 'Unknown' ? '👁️' : '💼'}
                           </div>
                           <div className="text-sm font-medium truncate">{contact}</div>
                       </div>
                   ))}
               </div>

               {/* Section: GLOBAL CHANNELS */}
               <div>
                   <div className="text-xs font-bold text-slate-400 uppercase px-2 mb-2">Global Network</div>
                   <button 
                        onClick={() => { setViewMode('CHANNEL'); setActiveChannel('general'); }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors flex items-center gap-2 ${viewMode === 'CHANNEL' && activeChannel === 'general' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                    >
                        <span className="text-slate-400">#</span> general
                    </button>
                    <button 
                        onClick={() => { setViewMode('CHANNEL'); setActiveChannel('trade'); }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors flex items-center gap-2 ${viewMode === 'CHANNEL' && activeChannel === 'trade' ? 'bg-green-900 text-green-400' : 'text-green-700 hover:bg-green-50'}`}
                    >
                        <span className="text-green-500">$</span> trade
                    </button>
                    {isShadowUnlocked && (
                         <button 
                            onClick={() => { setViewMode('CHANNEL'); setActiveChannel('shadow_net'); }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors flex items-center gap-2 border border-transparent ${viewMode === 'CHANNEL' && activeChannel === 'shadow_net' ? 'bg-red-950 text-red-500 border-red-900' : 'text-red-700 hover:bg-red-50'}`}
                        >
                            <span className="text-red-500">☠</span> shadow_net
                        </button>
                    )}
               </div>
           </div>
           
           <div className="p-4 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Connected as {username}
           </div>
       </div>

       {/* Content Area */}
       <div className="flex-1 flex flex-col bg-[#e5ddd5] relative overflow-hidden">
           
           {viewMode === 'EMAIL' ? (
               // EMAIL INTERFACE
               <div className="flex h-full bg-white">
                   {/* Email List */}
                   <div className="w-72 border-r border-slate-200 overflow-y-auto bg-slate-50">
                       {emails.slice().reverse().map(email => (
                           <div 
                                key={email.id}
                                onClick={() => setSelectedEmail(email)}
                                className={`p-4 border-b border-slate-200 cursor-pointer hover:bg-white transition-colors ${selectedEmail?.id === email.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''} ${!email.isRead ? 'font-bold' : ''}`}
                           >
                               <div className="text-xs text-slate-500 mb-1 flex justify-between">
                                   <span>{email.sender}</span>
                                   <span>{new Date(email.timestamp).toLocaleDateString()}</span>
                               </div>
                               <div className="text-sm text-slate-800 truncate">{email.subject}</div>
                           </div>
                       ))}
                       {emails.length === 0 && <div className="p-4 text-center text-slate-400">Inbox Empty</div>}
                   </div>
                   {/* Email Reading Pane */}
                   <div className="flex-1 bg-white p-8 overflow-y-auto">
                       {selectedEmail ? (
                           <div className="max-w-2xl mx-auto animate-in fade-in">
                               <div className="border-b border-slate-200 pb-4 mb-6">
                                   <h1 className="text-2xl font-bold text-slate-800 mb-2">{selectedEmail.subject}</h1>
                                   <div className="flex justify-between items-center">
                                       <div className="flex items-center gap-3">
                                           <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${selectedEmail.type === 'spam' ? 'bg-yellow-100' : selectedEmail.type === 'bill' ? 'bg-red-100' : 'bg-blue-100'}`}>
                                               {selectedEmail.type === 'spam' ? '💩' : selectedEmail.type === 'bill' ? '📄' : selectedEmail.type === 'job' ? '💼' : '✉️'}
                                           </div>
                                           <div>
                                               <div className="font-bold text-slate-700">{selectedEmail.sender}</div>
                                               <div className="text-xs text-slate-500">To: {username}@ang.net</div>
                                           </div>
                                       </div>
                                       <div className="text-xs text-slate-400">{new Date(selectedEmail.timestamp).toLocaleString()}</div>
                                   </div>
                               </div>
                               <div className="prose prose-slate text-slate-600 leading-relaxed whitespace-pre-wrap">
                                   {selectedEmail.body}
                               </div>
                               <div className="mt-8 flex gap-2">
                                   <button className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 text-sm">Archive</button>
                                   <button className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 text-sm">Delete</button>
                               </div>
                           </div>
                       ) : (
                           <div className="h-full flex flex-col items-center justify-center text-slate-300">
                               <div className="text-6xl mb-4">✉️</div>
                               <div>Select an email to read</div>
                           </div>
                       )}
                   </div>
               </div>
           ) : (
               // CHAT INTERFACE (Existing)
               <>
               {/* Header */}
               <div className="h-14 border-b border-slate-200 bg-white flex items-center px-4 justify-between shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        {viewMode === 'DM' ? (
                            <>
                                <span className="text-xl">{activeContact === 'Mom' ? '👩' : activeContact === 'Unknown' ? '👁️' : '💼'}</span>
                                <span className="font-bold text-lg text-slate-800">{activeContact}</span>
                            </>
                        ) : (
                            <>
                                <span className="text-xl text-slate-500">#</span>
                                <span className={`font-bold text-lg ${activeChannel === 'shadow_net' ? 'text-red-600' : 'text-slate-800'}`}>{activeChannel}</span>
                                <span className="text-xs text-slate-500 ml-2 border-l border-slate-300 pl-2">
                                    {activeChannel === 'general' ? 'Off-topic & Chill' : activeChannel === 'trade' ? 'Buy / Sell / HODL' : 'Encrypted Tunnel'}
                                </span>
                            </>
                        )}
                    </div>
                    
                    {viewMode === 'DM' && (
                        <div className="flex gap-4 text-blue-500">
                            <button onClick={() => setShowVideo(true)} className="hover:bg-slate-100 p-2 rounded transition-colors">📹</button>
                            <button className="hover:bg-slate-100 p-2 rounded transition-colors">📞</button>
                        </div>
                    )}
                    {viewMode === 'CHANNEL' && (
                        <div className="text-xs text-slate-400">
                            {Math.floor(Math.random() * 1000) + 50} Online
                        </div>
                    )}
               </div>

               {/* Messages Area */}
               <div 
                 ref={scrollRef}
                 className={`flex-1 p-4 overflow-y-auto space-y-4 ${viewMode === 'CHANNEL' && activeChannel === 'shadow_net' ? 'bg-[#111]' : activeChannel === 'trade' ? 'bg-[#f0fdf4]' : 'bg-[#e5ddd5]'}`}
               >
                   {/* DM RENDERING */}
                   {viewMode === 'DM' && filteredDMs.map(msg => (
                       <div key={msg.id} className={`flex ${msg.sender === 'Me' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[70%] p-3 rounded-lg shadow-sm ${msg.sender === 'Me' ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                               <p className="text-sm text-slate-800">{msg.text}</p>
                               <span className="text-[10px] text-slate-500 block text-right mt-1">
                                   {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                               </span>
                               {msg.replies && (
                                   <div className="mt-2 pt-2 border-t border-black/10 flex gap-2">
                                       {msg.replies.map((reply, i) => (
                                           <button key={i} onClick={reply.action} className="text-xs bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-50 text-blue-600">
                                               {reply.text}
                                           </button>
                                       ))}
                                   </div>
                               )}
                           </div>
                       </div>
                   ))}

                   {/* GLOBAL CHAT RENDERING */}
                   {viewMode === 'CHANNEL' && filteredGlobal.map((msg, i) => (
                        <div key={i} className={`flex gap-3 group animate-in slide-in-from-left-1 duration-200 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center text-xs font-bold text-white ${msg.isMe ? 'bg-blue-600' : 'bg-slate-500'}`}>
                                {msg.sender[0]}
                            </div>
                            <div className={`flex flex-col max-w-[80%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-xs font-bold ${msg.isMe ? 'text-blue-600' : activeChannel === 'shadow_net' ? 'text-red-400' : 'text-slate-600'}`}>
                                        {msg.sender}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <div className={`px-3 py-2 rounded-lg text-sm shadow-sm ${activeChannel === 'shadow_net' ? 'bg-slate-800 text-slate-300 border border-slate-700' : msg.isMe ? 'bg-blue-100 text-blue-900' : 'bg-white text-slate-800'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                   ))}
                   
                   {viewMode === 'CHANNEL' && filteredGlobal.length === 0 && (
                       <div className="text-center text-slate-400 mt-10 italic opacity-50">Channel is quiet...</div>
                   )}
               </div>
               
               {/* Input Area */}
               <div className={`p-4 border-t border-slate-200 flex gap-2 ${viewMode === 'CHANNEL' && activeChannel === 'shadow_net' ? 'bg-[#1a1a1a] border-slate-800' : 'bg-white'}`}>
                   {viewMode === 'DM' ? (
                       <>
                           <input type="text" placeholder="Type a private message..." className="flex-1 p-2 rounded border border-slate-300 focus:outline-none focus:border-blue-500" />
                           <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold">➤</button>
                       </>
                   ) : (
                       <form onSubmit={handleGlobalSend} className="flex gap-2 w-full">
                            <input 
                                type="text" 
                                placeholder={`Message #${activeChannel}...`} 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                className={`flex-1 p-2 rounded border focus:outline-none ${activeChannel === 'shadow_net' ? 'bg-black border-red-900 text-red-500 focus:border-red-500 placeholder-red-900' : 'bg-slate-100 border-slate-300 focus:border-blue-500'}`}
                            />
                            <button className={`px-4 py-2 text-white rounded font-bold ${activeChannel === 'shadow_net' ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                                SEND
                            </button>
                       </form>
                   )}
               </div>
               </>
           )}

           {/* Video Call Overlay (Mock) */}
           {showVideo && (
               <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in">
                   <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                        <div className="text-center">
                           <div className="w-32 h-32 rounded-full border-4 border-red-500 animate-pulse flex items-center justify-center text-4xl bg-slate-800 text-white mx-auto mb-4">
                               📵
                           </div>
                           <div className="text-white font-mono">CONNECTION FAILED</div>
                           <div className="text-red-500 text-xs">NO SIGNAL</div>
                        </div>
                       <div className="absolute bottom-10 left-0 w-full flex justify-center gap-4">
                           <button onClick={() => setShowVideo(false)} className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 text-white shadow-lg transform hover:scale-110 transition-all">✕</button>
                       </div>
                   </div>
               </div>
           )}
       </div>
    </div>
  );
};
