/**
 * Syntax Highlighting Utility
 * Подсветка синтаксиса для разных языков программирования
 */

import React from 'react';
import { ProgrammingLanguage } from '../types';

// Цветовая схема (VS Code Dark+)
const COLORS = {
  keyword: '#569CD6',      // Ключевые слова (if, for, function)
  string: '#CE9178',       // Строки
  number: '#B5CEA8',       // Числа
  comment: '#6A9955',      // Комментарии
  function: '#DCDCAA',     // Функции
  variable: '#9CDCFE',     // Переменные
  type: '#4EC9B0',         // Типы
  operator: '#D4D4D4',     // Операторы
  bracket: '#FFD700',      // Скобки
  property: '#9CDCFE',     // Свойства
  default: '#D4D4D4',      // По умолчанию
};

// Ключевые слова по языкам
const KEYWORDS: Record<ProgrammingLanguage, string[]> = {
  javascript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new',
    'class', 'extends', 'constructor', 'static', 'get', 'set', 'async', 'await',
    'import', 'export', 'default', 'from', 'as', 'typeof', 'instanceof', 'in', 'of',
    'this', 'super', 'true', 'false', 'null', 'undefined', 'void', 'delete', 'yield'
  ],
  python: [
    'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except',
    'finally', 'raise', 'import', 'from', 'as', 'with', 'pass', 'break', 'continue',
    'and', 'or', 'not', 'in', 'is', 'True', 'False', 'None', 'lambda', 'yield',
    'global', 'nonlocal', 'assert', 'del', 'async', 'await', 'self', 'print'
  ],
  cpp: [
    'int', 'float', 'double', 'char', 'void', 'bool', 'long', 'short', 'unsigned',
    'signed', 'const', 'static', 'extern', 'struct', 'class', 'enum', 'union',
    'public', 'private', 'protected', 'virtual', 'override', 'template', 'typename',
    'namespace', 'using', 'new', 'delete', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'throw', 'true', 'false',
    'nullptr', 'sizeof', 'typedef', 'auto', 'inline', 'constexpr', '#include', '#define'
  ],
  rust: [
    'fn', 'let', 'mut', 'const', 'static', 'if', 'else', 'match', 'loop', 'while',
    'for', 'in', 'break', 'continue', 'return', 'struct', 'enum', 'impl', 'trait',
    'pub', 'mod', 'use', 'crate', 'self', 'super', 'as', 'type', 'where', 'async',
    'await', 'move', 'ref', 'dyn', 'true', 'false', 'Some', 'None', 'Ok', 'Err',
    'Box', 'Vec', 'String', 'Option', 'Result', 'println', 'print', 'macro_rules'
  ],
  go: [
    'package', 'import', 'func', 'return', 'var', 'const', 'type', 'struct', 'interface',
    'map', 'chan', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'break',
    'continue', 'fallthrough', 'go', 'select', 'defer', 'panic', 'recover', 'make',
    'new', 'append', 'len', 'cap', 'copy', 'delete', 'true', 'false', 'nil', 'iota',
    'int', 'string', 'bool', 'byte', 'rune', 'float64', 'error', 'fmt', 'Println'
  ],
  sql: [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS',
    'NULL', 'ORDER', 'BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'GROUP', 'HAVING',
    'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AS', 'DISTINCT', 'COUNT',
    'SUM', 'AVG', 'MIN', 'MAX', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
    'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW', 'DATABASE',
    'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'DEFAULT', 'AUTO_INCREMENT'
  ],
  lua: [
    'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
    'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
    'true', 'until', 'while', 'print', 'pairs', 'ipairs', 'type', 'tostring',
    'tonumber', 'require', 'module', 'setmetatable', 'getmetatable', 'self'
  ]
};

// Типы для языков с статической типизацией
const TYPES: Record<string, string[]> = {
  cpp: ['int', 'float', 'double', 'char', 'void', 'bool', 'long', 'short', 'string', 'vector', 'map', 'set', 'array'],
  rust: ['i32', 'i64', 'u32', 'u64', 'f32', 'f64', 'bool', 'char', 'str', 'String', 'Vec', 'Option', 'Result', 'Box'],
  go: ['int', 'int32', 'int64', 'uint', 'float32', 'float64', 'bool', 'string', 'byte', 'rune', 'error'],
};

interface Token {
  text: string;
  type: 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'type' | 'operator' | 'bracket' | 'default';
}

/**
 * Токенизация строки кода
 */
export function tokenize(code: string, language: ProgrammingLanguage): Token[] {
  const tokens: Token[] = [];
  const keywords = KEYWORDS[language] || [];
  const types = TYPES[language] || [];
  
  // Регулярные выражения для разных токенов
  const patterns = [
    // Многострочные комментарии
    { regex: /\/\*[\s\S]*?\*\//g, type: 'comment' as const },
    // Однострочные комментарии
    { regex: /\/\/.*$/gm, type: 'comment' as const },
    { regex: /#.*$/gm, type: 'comment' as const }, // Python/Lua
    { regex: /--.*$/gm, type: 'comment' as const }, // SQL/Lua
    // Строки
    { regex: /"(?:[^"\\]|\\.)*"/g, type: 'string' as const },
    { regex: /'(?:[^'\\]|\\.)*'/g, type: 'string' as const },
    { regex: /`(?:[^`\\]|\\.)*`/g, type: 'string' as const }, // Template literals
    // Числа
    { regex: /\b\d+\.?\d*\b/g, type: 'number' as const },
    { regex: /\b0x[0-9a-fA-F]+\b/g, type: 'number' as const }, // Hex
    // Скобки
    { regex: /[{}[\]()]/g, type: 'bracket' as const },
    // Операторы
    { regex: /[+\-*/%=<>!&|^~?:;,.]/g, type: 'operator' as const },
  ];

  // Простой токенизатор - разбивает код на части
  let remaining = code;
  let position = 0;
  
  while (remaining.length > 0) {
    let matched = false;
    
    // Пробелы
    const wsMatch = remaining.match(/^\s+/);
    if (wsMatch) {
      tokens.push({ text: wsMatch[0], type: 'default' });
      remaining = remaining.slice(wsMatch[0].length);
      position += wsMatch[0].length;
      continue;
    }
    
    // Комментарии
    if (remaining.startsWith('//') || remaining.startsWith('#') || remaining.startsWith('--')) {
      const endOfLine = remaining.indexOf('\n');
      const comment = endOfLine === -1 ? remaining : remaining.slice(0, endOfLine);
      tokens.push({ text: comment, type: 'comment' });
      remaining = remaining.slice(comment.length);
      position += comment.length;
      continue;
    }
    
    // Многострочные комментарии
    if (remaining.startsWith('/*')) {
      const end = remaining.indexOf('*/');
      const comment = end === -1 ? remaining : remaining.slice(0, end + 2);
      tokens.push({ text: comment, type: 'comment' });
      remaining = remaining.slice(comment.length);
      position += comment.length;
      continue;
    }
    
    // Строки
    if (remaining[0] === '"' || remaining[0] === "'" || remaining[0] === '`') {
      const quote = remaining[0];
      let i = 1;
      while (i < remaining.length && (remaining[i] !== quote || remaining[i-1] === '\\')) {
        i++;
      }
      const str = remaining.slice(0, i + 1);
      tokens.push({ text: str, type: 'string' });
      remaining = remaining.slice(str.length);
      position += str.length;
      continue;
    }
    
    // Числа
    const numMatch = remaining.match(/^(0x[0-9a-fA-F]+|\d+\.?\d*)/);
    if (numMatch) {
      tokens.push({ text: numMatch[0], type: 'number' });
      remaining = remaining.slice(numMatch[0].length);
      position += numMatch[0].length;
      continue;
    }
    
    // Идентификаторы и ключевые слова
    const identMatch = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
    if (identMatch) {
      const word = identMatch[0];
      let type: Token['type'] = 'default';
      
      if (keywords.includes(word) || keywords.includes(word.toUpperCase())) {
        type = 'keyword';
      } else if (types.includes(word)) {
        type = 'type';
      } else if (remaining.slice(word.length).match(/^\s*\(/)) {
        type = 'function';
      }
      
      tokens.push({ text: word, type });
      remaining = remaining.slice(word.length);
      position += word.length;
      continue;
    }
    
    // Скобки
    if ('{}[]()'.includes(remaining[0])) {
      tokens.push({ text: remaining[0], type: 'bracket' });
      remaining = remaining.slice(1);
      position += 1;
      continue;
    }
    
    // Операторы
    const opMatch = remaining.match(/^([+\-*/%=<>!&|^~?:;,.])+/);
    if (opMatch) {
      tokens.push({ text: opMatch[0], type: 'operator' });
      remaining = remaining.slice(opMatch[0].length);
      position += opMatch[0].length;
      continue;
    }
    
    // Остальное
    tokens.push({ text: remaining[0], type: 'default' });
    remaining = remaining.slice(1);
    position += 1;
  }
  
  return tokens;
}

/**
 * Генерация HTML с подсветкой синтаксиса
 */
export function highlightCode(code: string, language: ProgrammingLanguage): string {
  const tokens = tokenize(code, language);
  
  return tokens.map(token => {
    const color = COLORS[token.type] || COLORS.default;
    const escaped = token.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    
    return `<span style="color: ${color}">${escaped}</span>`;
  }).join('');
}

/**
 * Генерация React элементов с подсветкой
 */
export function highlightCodeReact(code: string, language: ProgrammingLanguage): React.ReactElement[] {
  const tokens = tokenize(code, language);
  
  return tokens.map((token, i) => {
    const color = COLORS[token.type] || COLORS.default;
    return (
      <span key={i} style={{ color }}>{token.text}</span>
    );
  });
}

/**
 * Получить цвет для языка (для иконки)
 */
export function getLanguageColor(language: ProgrammingLanguage): string {
  const colors: Record<ProgrammingLanguage, string> = {
    javascript: '#F7DF1E',
    python: '#3776AB',
    cpp: '#00599C',
    rust: '#DEA584',
    go: '#00ADD8',
    sql: '#E38C00',
    lua: '#000080',
  };
  return colors[language] || '#888888';
}

/**
 * Получить расширение файла для языка
 */
export function getFileExtension(language: ProgrammingLanguage): string {
  const extensions: Record<ProgrammingLanguage, string> = {
    javascript: '.js',
    python: '.py',
    cpp: '.cpp',
    rust: '.rs',
    go: '.go',
    sql: '.sql',
    lua: '.lua',
  };
  return extensions[language] || '.txt';
}
