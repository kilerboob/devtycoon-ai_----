import React from 'react';

interface StoryModalProps {
  title: string;
  content: string;
  type: 'intro' | 'quest_start' | 'quest_end';
  onClose: () => void;
  explanation?: string;
}

export const StoryModal: React.FC<StoryModalProps> = ({ title, content, type, onClose, explanation }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-green-500/30 rounded-lg max-w-lg w-full shadow-[0_0_50px_rgba(34,197,94,0.1)] relative overflow-hidden">
        
        {/* Header */}
        <div className={`p-4 border-b ${type === 'intro' ? 'border-blue-500/30 bg-blue-900/20' : 'border-green-500/30 bg-green-900/20'} flex justify-between items-center`}>
           <h2 className={`text-xl font-bold font-mono ${type === 'intro' ? 'text-blue-400' : 'text-green-400'}`}>
             {type === 'intro' ? 'SYSTEM_INIT' : 'INCOMING_MESSAGE'}
           </h2>
           <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse delay-75"></div>
              <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse delay-150"></div>
           </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
            <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
            
            <p className="text-slate-300 leading-relaxed font-mono text-sm md:text-base border-l-2 border-slate-700 pl-4">
                {content}
            </p>

            {explanation && (
                <div className="bg-slate-800/50 p-4 rounded border border-yellow-500/20 mt-4">
                    <h4 className="text-yellow-400 font-bold text-sm mb-1 uppercase">🧠 База знаний:</h4>
                    <p className="text-slate-300 text-sm italic">{explanation}</p>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
            <button 
                onClick={onClose}
                className={`px-6 py-2 rounded font-bold font-mono text-sm transition-all
                    ${type === 'intro' 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50' 
                        : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/50'
                    }
                `}
            >
                {type === 'intro' ? 'ВОЙТИ В СИСТЕМУ' : type === 'quest_end' ? 'ПРОДОЛЖИТЬ' : 'ПРИНЯТЬ ЗАДАЧУ'}
            </button>
        </div>

        {/* Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
      </div>
    </div>
  );
};