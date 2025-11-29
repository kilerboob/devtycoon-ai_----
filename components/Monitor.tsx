

import React, { useEffect, useRef, useState } from 'react';
import { ProgrammingLanguage } from '../types';

interface MonitorProps {
  codeLines: string[];
  onClick: () => void;
  isCrunchMode: boolean;
  onConsoleSubmit: (command: string) => void;
  currentTaskHint?: string;
  currentTaskSolution?: string; 
  isWindowed?: boolean;
  language: ProgrammingLanguage;
}

export const Monitor: React.FC<MonitorProps> = ({ codeLines, onClick, isCrunchMode, onConsoleSubmit, currentTaskHint, currentTaskSolution, isWindowed = false, language }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [codeLines]);

  useEffect(() => {
      setShowHint(false);
  }, [currentTaskHint]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onConsoleSubmit(inputValue);
      setInputValue('');
    }
  };

  // Syntax Highlighting Engine
  const highlightSyntax = (line: string) => {
    // Simple tokenizer based on language
    const parts = line.split(/(\s+|[(){}[\].,;:"'])/);
    
    // Config
    let keywords: string[] = [];
    let commentChar = '//';
    
    switch (language) {
        case 'javascript':
            keywords = ['const', 'let', 'var', 'function', 'class', 'import', 'export', 'return', 'if', 'else', 'try', 'catch', 'await', 'async'];
            break;
        case 'python':
            commentChar = '#';
            keywords = ['def', 'class', 'import', 'from', 'if', 'else', 'elif', 'return', 'try', 'except', 'with', 'as', 'print'];
            break;
        case 'cpp':
            keywords = ['int', 'void', 'float', 'char', 'class', 'struct', 'public', 'private', 'using', 'namespace', 'include', 'return', 'if', 'else'];
            break;
        case 'rust':
            keywords = ['fn', 'let', 'mut', 'struct', 'impl', 'use', 'mod', 'pub', 'match', 'if', 'else', 'return'];
            break;
        case 'go':
            keywords = ['func', 'package', 'import', 'type', 'struct', 'interface', 'return', 'if', 'else', 'go', 'defer'];
            break;
        case 'sql':
            commentChar = '--';
            keywords = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'TABLE', 'JOIN', 'ON', 'GROUP', 'BY', 'ORDER', 'VALUES'];
            break;
        case 'lua':
            commentChar = '--';
            keywords = ['local', 'function', 'end', 'if', 'then', 'else', 'elseif', 'return', 'nil', 'true', 'false', 'for', 'while', 'do', 'in', 'print'];
            break;
    }

    let isComment = false;

    return parts.map((part, i) => {
      if (part.trim() === '') return <span key={i}>{part}</span>;
      if (part.startsWith(commentChar)) isComment = true;
      
      let color = 'text-slate-300';
      
      if (isComment) color = 'text-slate-500 italic';
      else if (keywords.includes(part) || (language === 'sql' && keywords.includes(part.toUpperCase()))) color = 'text-purple-400 font-bold';
      else if (['(', ')', '{', '}', '[', ']'].includes(part)) color = 'text-blue-300';
      else if (part.startsWith("'") || part.startsWith('"')) color = 'text-green-400';
      else if (!isNaN(Number(part))) color = 'text-orange-400';
      else if (part.match(/^[A-Z][a-zA-Z0-9_]*$/) && language !== 'sql') color = 'text-yellow-200'; // Classes/Types often uppercase
      
      return <span key={i} className={color}>{part}</span>;
    });
  };

  const getFileName = () => {
      switch(language) {
          case 'javascript': return 'main.js';
          case 'python': return 'script.py';
          case 'cpp': return 'core.cpp';
          case 'rust': return 'main.rs';
          case 'go': return 'main.go';
          case 'sql': return 'query.sql';
          case 'lua': return 'script.lua';
          default: return 'code.txt';
      }
  };

  const Content = (
    <div className={`bg-[#0d1117] w-full h-full relative font-mono text-sm flex flex-col ${isWindowed ? '' : 'rounded overflow-hidden border-2 border-black shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]'} ${isCrunchMode ? 'animate-pulse-fast' : ''}`}>
           
           {/* Quest Overlay */}
           {currentTaskHint && (
               <div className="absolute top-2 right-2 left-2 z-10 bg-yellow-900/80 backdrop-blur-sm border border-yellow-600/50 p-3 rounded text-xs shadow-lg animate-in slide-in-from-top duration-500">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                            <span className="animate-pulse">●</span> Active Quest
                        </span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowHint(!showHint); }}
                            className="text-[10px] bg-yellow-800 hover:bg-yellow-700 text-yellow-200 px-2 py-1 rounded border border-yellow-600/50 transition-colors"
                        >
                            {showHint ? 'Скрыть подсказку' : 'Показать подсказку'}
                        </button>
                    </div>
                    <p className="text-slate-200 mb-2 font-medium">{currentTaskHint}</p>
                    <div className="bg-black/50 p-2 rounded border border-yellow-500/10 font-mono relative group/hint cursor-help">
                        <div className={`transition-all duration-300 ${showHint ? 'opacity-100 blur-0' : 'opacity-40 blur-[4px] hover:opacity-60 hover:blur-[2px]'}`}>
                             <span className="text-green-400">{'>'}</span> <span className="text-slate-300">{currentTaskSolution || "..."}</span>
                        </div>
                    </div>
               </div>
           )}

           {/* Top Bar (VS Code style) */}
           <div className="flex text-[10px] bg-[#161b22] text-slate-400 p-1 border-b border-slate-700 items-center justify-between shrink-0">
               <div className="flex">
                 <span className="px-2 bg-[#0d1117] border-t-2 border-blue-500 text-slate-200 flex items-center gap-1">
                     {getFileName()}
                 </span>
               </div>
               <div className="px-2">{language.toUpperCase()}</div>
           </div>

           {/* Code Area */}
           <div ref={scrollRef} className="p-4 flex-1 overflow-y-auto flex flex-col justify-start items-start leading-tight relative pt-10" onClick={() => inputRef.current?.focus()}>
              
              {codeLines.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap animate-fade-in opacity-90 w-full break-all">
                      <span className="text-slate-600 select-none w-6 inline-block text-right mr-3 text-xs">{codeLines.length > 20 ? codeLines.length - 20 + idx : idx + 1}</span>
                      {highlightSyntax(line)}
                  </div>
              ))}
              
              <div className="flex w-full mt-2 items-center group">
                 <span className="text-slate-500 mr-2 text-xs">{codeLines.length + 1}</span>
                 <span className="text-green-500 mr-2 font-bold">{'>'}</span>
                 <form onSubmit={handleSubmit} className="flex-1">
                    <input 
                      ref={inputRef}
                      type="text" 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-slate-200 font-mono focus:ring-0 p-0 placeholder-slate-700"
                      placeholder={currentTaskHint ? "Введи команду здесь..." : "Пиши код..."}
                      autoComplete="off"
                    />
                 </form>
              </div>
           </div>
    </div>
  );

  if (isWindowed) return Content;

  // Physical Monitor Bezel wrapper
  return (
    <div className="flex flex-col items-center w-full">
      <div onClick={onClick} className={`relative w-full bg-slate-800 rounded-t-xl rounded-b-lg p-3 shadow-2xl border-4 border-slate-700 select-none group ${isCrunchMode ? 'ring-4 ring-red-500/20' : ''}`}>
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black rounded-full z-20 opacity-50"></div>
        <div className="h-64 md:h-80 w-full relative">
            {Content}
        </div>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-500 tracking-widest uppercase opacity-50">
            DevStation Pro
        </div>
      </div>
    </div>
  );
};
