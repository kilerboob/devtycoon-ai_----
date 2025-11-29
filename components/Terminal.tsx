import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
}

export const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref to track if we should stick to the bottom. Defaults to true.
  const shouldAutoScroll = useRef(true);

  // Check scroll position to determine if we should stick to the bottom
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      // If we are within 50px of the bottom, we consider it "at the bottom" and enable auto-scroll
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      shouldAutoScroll.current = isAtBottom;
    }
  };

  useEffect(() => {
    // Only scroll to bottom if the user hasn't scrolled up manually
    if (shouldAutoScroll.current && containerRef.current) {
        // We use direct scrollTop modification for a snappy "log" feel without jank
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-code-term border border-slate-600 rounded-lg p-4 h-full w-full overflow-hidden flex flex-col font-mono text-sm shadow-inner relative">
        <div className="text-slate-400 border-b border-slate-600 pb-2 mb-2 flex justify-between items-center shrink-0">
          <span>{'>'} TERMINAL_OUTPUT</span>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto terminal-scroll space-y-2 pr-1"
      >
        {logs.map((log) => (
          <div key={log.id} className="animate-fade-in break-words leading-tight">
            <span className="text-slate-500 mr-2 text-[10px] uppercase">[{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
            <span className={`${
              log.type === 'error' ? 'text-code-error' :
              log.type === 'success' ? 'text-code-accent' :
              log.type === 'ai' ? 'text-purple-400' :
              log.type === 'warn' ? 'text-yellow-400' :
              'text-slate-200'
            }`}>
              {log.type === 'ai' && '🤖 '}
              {log.type === 'error' && '❌ '}
              {log.type === 'success' && '✅ '}
              {log.type === 'warn' && '⚠️ '}
              <span dangerouslySetInnerHTML={{ __html: log.message }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};