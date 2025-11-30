/**
 * CodeEditor - Редактор кода с подсветкой синтаксиса
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ProgrammingLanguage } from '../types';
import { highlightCodeReact, getLanguageColor } from '../utils/syntaxHighlighter';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: ProgrammingLanguage;
  readOnly?: boolean;
  onRun?: () => void;
  showLineNumbers?: boolean;
  height?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  readOnly = false,
  onRun,
  showLineNumbers = true,
  height = '100%'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Синхронизация скролла
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
    
    if (highlightRef.current) {
      highlightRef.current.scrollTop = target.scrollTop;
      highlightRef.current.scrollLeft = target.scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = target.scrollTop;
    }
  }, []);

  // Обработка Tab
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Восстановить позицию курсора
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
    
    // Ctrl+Enter для запуска
    if (e.ctrlKey && e.key === 'Enter' && onRun) {
      e.preventDefault();
      onRun();
    }
    
    // Auto-close brackets
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
    if (pairs[e.key]) {
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      if (start === end) {
        e.preventDefault();
        const newValue = value.substring(0, start) + e.key + pairs[e.key] + value.substring(end);
        onChange(newValue);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 1;
        }, 0);
      }
    }
  }, [value, onChange, onRun]);

  // Подготовка строк с номерами
  const lines = value.split('\n');
  const lineNumbers = lines.map((_, i) => i + 1);

  return (
    <div className="relative w-full bg-[#1e1e1e] rounded overflow-hidden" style={{ height }}>
      {/* Language badge */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
        <div 
          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
          style={{ 
            backgroundColor: getLanguageColor(language) + '20',
            color: getLanguageColor(language),
            border: `1px solid ${getLanguageColor(language)}40`
          }}
        >
          {language}
        </div>
        {onRun && (
          <button
            onClick={onRun}
            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded transition-colors"
            title="Run (Ctrl+Enter)"
          >
            ▶ RUN
          </button>
        )}
      </div>

      <div className="flex h-full">
        {/* Line numbers */}
        {showLineNumbers && (
          <div 
            ref={lineNumbersRef}
            className="flex-shrink-0 bg-[#1e1e1e] border-r border-slate-700 text-slate-500 text-xs font-mono select-none overflow-auto"
            style={{ 
              paddingTop: '16px',
              paddingRight: '8px',
              paddingLeft: '8px'
            }}
          >
            {lineNumbers.map(num => (
              <div key={num} className="h-[20px] text-right pr-2 leading-[20px]">
                {num}
              </div>
            ))}
          </div>
        )}

        {/* Editor area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Highlighted code (background) */}
          <div
            ref={highlightRef}
            className="absolute inset-0 p-4 font-mono text-sm whitespace-pre overflow-auto pointer-events-none"
            style={{ 
              lineHeight: '20px',
              paddingTop: '16px'
            }}
          >
            {lines.map((line, i) => (
              <div key={i} className="h-[20px]">
                {highlightCodeReact(line || ' ', language)}
              </div>
            ))}
          </div>

          {/* Textarea (foreground, transparent) */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-transparent text-transparent caret-white resize-none outline-none"
            style={{ 
              lineHeight: '20px',
              paddingTop: '16px'
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />

          {/* Current line highlight */}
          <div 
            className="absolute left-0 right-0 bg-white/5 pointer-events-none"
            style={{
              top: `${16 + Math.floor(textareaRef.current?.selectionStart ? 
                value.substring(0, textareaRef.current.selectionStart).split('\n').length - 1 : 0) * 20 - scrollTop}px`,
              height: '20px'
            }}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#007ACC] flex items-center justify-between px-3 text-[10px] text-white">
        <div className="flex items-center gap-4">
          <span>Ln {lines.length}, Col 1</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{language.toUpperCase()}</span>
          <span>{value.length} chars</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
