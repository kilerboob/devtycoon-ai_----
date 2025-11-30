
import React, { useState, useEffect, useRef } from 'react';
import { GameState, AppId, Project, ProjectTemplate, UserApp, GraphNode, GraphConnection, ProgrammingLanguage, ChatMessage, FileNode, Language, DesktopItem } from '../types';
import { Browser } from './Browser';
import { Messenger } from './Messenger';
import { ProjectsApp } from './ProjectsApp';
import { Monitor } from './Monitor'; 
import { Terminal } from './Terminal';
import { UserAppRunner } from './UserAppRunner';
import { MusicPlayer } from './MusicPlayer';
import { SkillTreeApp } from './SkillTreeApp';
import { VisualEditor } from './VisualEditor';
import { devFsService } from '../services/devFsService';
import { LeaderboardApp } from './LeaderboardApp';
import { InventoryApp } from './InventoryApp';
import { SettingsApp } from './SettingsApp';
import { BankApp } from './BankApp';
import { StorageApp } from './StorageApp';
import { CorporationsApp } from './CorporationsApp';
import { BlueprintsApp } from './BlueprintsApp';
import { TutorialGuide } from './TutorialGuide';
import { CodeEditor } from './CodeEditor';
import { SocialHub } from './SocialHub';
import { LabsApp } from './LabsApp';
import { PlanetApp } from './PlanetApp';
import MarketApp from './MarketApp';
import { compileToRuntime } from '../utils/visualCompiler';
import { playSound } from '../utils/sound';
import { LORE_LIBRARY, TRANSLATIONS } from '../constants';

// ... (IDEDocs component remains unchanged) ...
// --- DOCUMENTATION COMPONENT ---
interface IDEDocsProps {
    language: Language;
}

const IDEDocs: React.FC<IDEDocsProps> = ({ language }) => {
    const [section, setSection] = useState<string>('intro');
    const contentLib = LORE_LIBRARY[language];

    return (
        <div className="flex h-full bg-[#0f172a] text-slate-300 font-sans animate-in fade-in duration-300">
            {/* Sidebar */}
            <div className="w-56 border-r border-slate-800 p-0 flex flex-col bg-[#1e293b]">
                <div className="p-4 border-b border-slate-700">
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="text-lg">📘</span> DOCS_V3
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto py-2">
                    {Object.keys(contentLib).map(key => (
                        <button 
                            key={key}
                            onClick={() => setSection(key)} 
                            className={`w-full text-left px-4 py-2 text-xs transition-all duration-200 flex items-center gap-3 border-l-2
                                ${section === key 
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500 font-bold' 
                                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'}
                            `}
                        >
                            <span className={`text-[10px] ${section === key ? 'text-pink-500' : 'text-slate-600'}`}>
                                {section === key ? '●' : '○'}
                            </span>
                            {key.toUpperCase().replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f172a] relative">
                <div className="max-w-4xl mx-auto p-8 md:p-12 space-y-8">
                    <div className="border-b border-slate-800 pb-6">
                        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                            {contentLib[section]?.title || 'UNKNOWN'}
                        </h1>
                    </div>
                    <div className="space-y-6 text-sm leading-relaxed text-slate-300">
                        {contentLib[section]?.content.map((para: string, i: number) => {
                            const isDiagram = para.startsWith('|') || para.startsWith('+') || para.startsWith('[') || para.includes('---') || para.startsWith('===');
                            if (isDiagram) {
                                return (
                                    <div key={i} className="font-mono text-xs bg-[#1e1e1e] p-4 rounded-lg border border-slate-700 shadow-lg overflow-x-auto whitespace-pre">
                                        {para.split('\n').map((line: string, lineIdx: number) => {
                                            const colorClass = 
                                                line.includes('===') ? 'text-pink-400 font-bold' :
                                                line.includes('->') ? 'text-blue-400' :
                                                line.includes('[EVENT]') ? 'text-green-400' :
                                                line.includes('[ACTION]') ? 'text-blue-300' :
                                                line.includes('[LOGIC]') ? 'text-purple-400' :
                                                line.includes('[VAR]') ? 'text-yellow-400' :
                                                'text-slate-400';
                                            return <div key={lineIdx} className={colorClass}>{line}</div>;
                                        })}
                                    </div>
                                );
                            }
                            const isList = para.startsWith('-');
                            const isHeader = para.toUpperCase() === para && para.length > 5 && !para.includes(' ');
                            return (
                                <div key={i} className={`${isList ? 'pl-4 border-l-2 border-slate-700 text-slate-400' : ''} ${isHeader ? 'text-lg font-bold text-white pt-4 border-b border-slate-800 pb-1' : ''}`}>
                                    {para}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- RECURSIVE FILE TREE COMPONENT ---
interface FileTreeItemProps {
    node: FileNode;
    depth: number;
    onSelect: (node: FileNode) => void;
    onToggle: (node: FileNode) => void;
    selectedId?: string;
}

const FileTreeItem: React.FC<FileTreeItemProps & { onRename?: (oldId: string, newId: string) => void }> = ({ node, depth, onSelect, onToggle, selectedId, onRename }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isRenaming, setIsRenaming] = useState(false);
    const [editName, setEditName] = useState(node.name || '');

    useEffect(() => {
        setEditName(node.name || '');
    }, [node.name]);

    const startRename = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRenaming(true);
        setTimeout(() => {
            const el = document.getElementById(`rename-input-${node.id}`) as HTMLInputElement | null;
            el?.focus();
            el?.select();
        }, 50);
    };

    const finishRename = () => {
        setIsRenaming(false);
        const newName = editName.trim();
        if (!newName || newName === node.name) return;
        // compute new id/path
        const parts = (node.id || '/').split('/').filter(Boolean);
        const parent = parts.length > 1 ? '/' + parts.slice(0, -1).join('/') : '/';
        const newId = parent === '/' ? `/${newName}` : `${parent}/${newName}`;
        try {
            onRename && onRename(node.id, newId);
        } catch (e) {
            console.warn('rename callback failed', e);
        }
    };

    const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            finishRename();
        } else if (e.key === 'Escape') {
            setIsRenaming(false);
            setEditName(node.name || '');
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isRenaming) return;
        if (node.type === 'folder') {
            setIsOpen(!isOpen);
        } else {
            onSelect(node);
        }
    };

    return (
        <div>
            <div 
                onClick={handleClick}
                className={`group flex items-center gap-1 py-0.5 px-2 cursor-pointer select-none text-xs hover:bg-slate-800 ${selectedId === node.id ? 'bg-blue-900/50 text-white' : 'text-slate-400'}`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onDoubleClick={(e) => { if (node.type !== 'folder') onSelect(node); }}
                onContextMenu={(e) => { e.preventDefault(); startRename(e); }}
            >
                <span className="text-xs w-4 text-center">{node.type === 'folder' ? (isOpen ? '📂' : '📁') : '📄'}</span>
                {!isRenaming && <span onDoubleClick={startRename}>{node.name}</span>}
                {isRenaming && (
                    <input id={`rename-input-${node.id}`} className="bg-[#0b1220] text-slate-200 px-1 py-0.5 rounded text-xs" value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={finishRename} onKeyDown={handleKey} />
                )}

                {/* Inline rename icon - visible on hover */}
                {!isRenaming && (
                    <button aria-label={`rename-${node.id}`} onClick={startRename} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-400 hover:text-slate-200">✏️</button>
                )}

                <div className="ml-auto text-[10px] text-slate-500 pr-2">{node.type === 'folder' ? '' : ''}</div>
            </div>
            {node.type === 'folder' && isOpen && node.children && (
                <div>
                    {node.children.map(child => (
                        <FileTreeItem key={child.id} node={child} depth={depth + 1} onSelect={onSelect} onToggle={onToggle} selectedId={selectedId} onRename={onRename} />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- DESKTOP PROPS ---
interface DesktopProps {
  state: GameState;
  activeProject: Project | null;
  logs: any[];
  chatMessages: ChatMessage[];
  onExit: () => void;
  onBuy: (id: string, isShadow?: boolean) => void;
  onSell: (id: string, value: number) => void;
  onCode: (lang: ProgrammingLanguage) => void;
  onDeploy: () => void;
  onConsoleSubmit: (cmd: string) => void;
  onStartProject: (t: ProjectTemplate) => void;
  onReleaseProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onInstallApp: (name: string, icon: string, code: string, domain?: string) => void;
  onUninstallApp: (id: string) => void;
  onUnlockPerk: (id: string, cost: number) => void;
  onChatSend: (text: string, channel: 'general' | 'trade' | 'shadow_net') => void;
  onExchange: (amount: number) => void;
  writtenCode: string[];
  isCrunchMode: boolean;
  onCreateFile: (parentId: string, name: string, type: 'file' | 'folder') => void;
  onDeleteFile: (id: string) => void;
  onUpdateFile: (id: string, content: string) => void;
    onRenameFile?: (oldId: string, newId: string) => void;
  storageStats: { totalCapacity: number, usedBytes: number, usedGB: number };
  onSetLanguage: (lang: Language) => void;
  // LAYER 6: Updated to pass lab context
  onStartHack?: (labId?: string, questId?: string) => void;
  onPayBill: (id: string) => void;
  onTakeLoan: (amount: number) => void;
  onRepayLoan: (amount: number) => void;
  // Optional notification callback provided by App
  onNotify?: (title: string, message: string, type?: 'info'|'error'|'success'|'achievement', icon?: string, duration?: number) => void;
  // LAYER 7: Blueprints
  onAddBlueprint?: (blueprint: import('../types').Blueprint) => void;
  onCraftBlueprint?: (blueprint: import('../types').Blueprint, craftedItem: any) => void;
  onSellBlueprint?: (blueprint: import('../types').Blueprint) => void;
  onSpendMoney?: (amount: number) => void;
  onSpendShadowCredits?: (amount: number) => void;
  // LAYER 5: Corporations
  onJoinCorp?: (corpId: import('../types').CorporationId) => void;
  onLeaveCorp?: () => void;
  onStartQuest?: (quest: import('../types').CorpQuest) => void;
  onCollectReward?: (quest: import('../types').CorpQuest) => void;
  onPayDues?: () => void;
  // LAYER 0: Desktop Layout Persistence
  onSaveDesktopLayout?: (layout: import('../types').DesktopItem[]) => void;
}

// --- DESKTOP CONSTANTS ---
const GRID_W = 90;
const GRID_H = 100;
const MARGIN_X = 20;
const MARGIN_Y = 20;

// Helper to snap coordinates to grid
const snapToGrid = (x: number, y: number) => {
    const col = Math.round((x - MARGIN_X) / GRID_W);
    const row = Math.round((y - MARGIN_Y) / GRID_H);
    return {
        x: Math.max(MARGIN_X, col * GRID_W + MARGIN_X),
        y: Math.max(MARGIN_Y, row * GRID_H + MARGIN_Y)
    };
};

const SYSTEM_APPS: DesktopItem[] = [
    { id: 'ide', type: 'app', title: 'DevStudio', icon: '💻', x: MARGIN_X, y: MARGIN_Y, appId: 'ide' },
    { id: 'browser', type: 'app', title: 'CyberNet', icon: '🌐', x: MARGIN_X, y: MARGIN_Y + GRID_H, appId: 'browser' },
    { id: 'messenger', type: 'app', title: 'Signal', icon: '💬', x: MARGIN_X, y: MARGIN_Y + GRID_H * 2, appId: 'messenger' },
    { id: 'storage', type: 'app', title: 'Storage', icon: '🗄️', x: MARGIN_X, y: MARGIN_Y + GRID_H * 3, appId: 'storage' },
    // DevFS file browser (StorageApp)
    { id: 'devfs', type: 'app', title: 'DevFS', icon: '💾', x: MARGIN_X, y: MARGIN_Y + GRID_H * 4, appId: 'devfs' },
    { id: 'bank', type: 'app', title: 'NeoBank', icon: '🏦', x: MARGIN_X + GRID_W, y: MARGIN_Y, appId: 'bank' },
    { id: 'projects', type: 'app', title: 'Projects', icon: '🚀', x: MARGIN_X + GRID_W, y: MARGIN_Y + GRID_H, appId: 'projects' },
    { id: 'skills', type: 'app', title: 'Skills', icon: '🧠', x: MARGIN_X + GRID_W, y: MARGIN_Y + GRID_H * 2, appId: 'skills' },
    { id: 'music', type: 'app', title: 'WinAmp', icon: '🎵', x: MARGIN_X + GRID_W, y: MARGIN_Y + GRID_H * 3, appId: 'music' },
    // Blueprints App (LAYER 7: Hardware blueprints)
    { id: 'blueprints', type: 'app', title: 'Чертежи', icon: '📜', x: MARGIN_X + GRID_W, y: MARGIN_Y + GRID_H * 4, appId: 'blueprints' },
    { id: 'leaderboard', type: 'app', title: 'Ranking', icon: '🏆', x: MARGIN_X + GRID_W * 2, y: MARGIN_Y, appId: 'leaderboard' },
    // Corporations App (LAYER 28: ANG Vers + others)
    { id: 'corporations', type: 'app', title: 'Corps', icon: '🏢', x: MARGIN_X + GRID_W * 2, y: MARGIN_Y + GRID_H, appId: 'corporations' },
    // Social Hub (LAYER 10-12: P2P Contracts & Guilds)
    { id: 'social', type: 'app', title: 'SocialHub', icon: '👥', x: MARGIN_X + GRID_W * 2, y: MARGIN_Y + GRID_H * 2, appId: 'social' },
    // Labs Network (LAYER 6: Independent Labs, hacking, prototypes)
    { id: 'labs', type: 'app', title: 'Labs', icon: '🔬', x: MARGIN_X + GRID_W * 2, y: MARGIN_Y + GRID_H * 3, appId: 'labs' },
    // Planet Sphere (LAYER 13: CyberNation visualization)
    { id: 'planet', type: 'app', title: 'Planet', icon: '🌍', x: MARGIN_X + GRID_W * 2, y: MARGIN_Y + GRID_H * 4, appId: 'planet' },
    // Market (LAYER 16: Legal & Shadow markets)
    { id: 'market', type: 'app', title: 'Market', icon: '🛒', x: MARGIN_X + GRID_W * 3, y: MARGIN_Y + GRID_H * 4, appId: 'market' },
    // Tutorial Guide App - Help system with all features walkthrough
    { id: 'tutorial', type: 'app', title: 'Гайд', icon: '📖', x: MARGIN_X + GRID_W * 3, y: MARGIN_Y, appId: 'tutorial' },
    // System folder shortcuts - open StorageApp with initial path
    { id: 'folder-projects', type: 'folder', title: 'Проекты', icon: '📂', x: MARGIN_X + GRID_W * 3, y: MARGIN_Y + GRID_H, appId: 'devfs' },
    { id: 'folder-sites', type: 'folder', title: 'Сайты', icon: '🌐', x: MARGIN_X + GRID_W * 3, y: MARGIN_Y + GRID_H * 2, appId: 'devfs' },
    { id: 'folder-storage', type: 'folder', title: 'Хранилище', icon: '📦', x: MARGIN_X + GRID_W * 3, y: MARGIN_Y + GRID_H * 3, appId: 'devfs' },
];

export const Desktop: React.FC<DesktopProps> = (props) => {
  // --- STATE ---
  const [activeApp, setActiveApp] = useState<AppId>('ide');
  const [minimized, setMinimized] = useState<AppId[]>([]);
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  // DEBUG: Log every startMenuOpen change
  // IDE State
  const [ideMode, setIdeMode] = useState<'WORK' | 'BUILDER' | 'HELP'>('WORK');
  const [builderMode, setBuilderMode] = useState<'CODE' | 'VISUAL'>('CODE'); 
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>('javascript');
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInp, setShowNewFileInp] = useState<'file'|'folder'|null>(null);
  const [ideSearchQuery, setIdeSearchQuery] = useState('');
  const [ideSearchResults, setIdeSearchResults] = useState<{file: FileNode, matches: number}[]>([]);
  const [fileWatcherNotifications, setFileWatcherNotifications] = useState<{path: string, event: string, time: number}[]>([]);
  const [builderCode, setBuilderCode] = useState(`<html>...</html>`);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphConnections, setGraphConnections] = useState<GraphConnection[]>([]);
  const [builderName, setBuilderName] = useState('My App');
  const [builderIcon, setBuilderIcon] = useState('📦');
  const [builderDomain, setBuilderDomain] = useState('myapp');

        // Autosave timer ref for VisualEditor
    const autoSaveTimer = useRef<number | null>(null);
            // Local saving status for UI badge: 'idle' | 'saving' | 'saved' | 'error'
            const [savingStatus, setSavingStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');

  // Desktop Icons State - load from saved layout or use defaults
  const [desktopItems, setDesktopItems] = useState<DesktopItem[]>(() => {
    // If we have saved layout, merge with SYSTEM_APPS to ensure new apps are included
    if (props.state.desktopLayout && props.state.desktopLayout.length > 0) {
      const savedMap = new Map(props.state.desktopLayout.map(item => [item.id, item]));
      // Merge: use saved positions for existing items, add new system apps
      const merged = SYSTEM_APPS.map(sysApp => {
        const saved = savedMap.get(sysApp.id);
        return saved ? { ...sysApp, x: saved.x, y: saved.y } : sysApp;
      });
      // Add any user-created items that are in saved but not in SYSTEM_APPS
      props.state.desktopLayout.forEach(saved => {
        if (!SYSTEM_APPS.find(s => s.id === saved.id)) {
          merged.push(saved);
        }
      });
      return merged;
    }
    return SYSTEM_APPS;
  });
  const [iconSize, setIconSize] = useState<'small' | 'medium'>('medium');
  const [dragItem, setDragItem] = useState<{id: string, startX: number, startY: number, initX: number, initY: number} | null>(null);
  const [openFolders, setOpenFolders] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, targetId?: string} | null>(null);
  
  // StorageApp initial path state
  const [storageAppPath, setStorageAppPath] = useState<string | undefined>(undefined);

  const t = TRANSLATIONS[props.state.language];

  // Ensure all SYSTEM_APPS are present (for new apps added after save)
  useEffect(() => {
    const missingApps = SYSTEM_APPS.filter(sysApp => !desktopItems.find(item => item.id === sysApp.id));
    if (missingApps.length > 0) {
      setDesktopItems(prev => [...prev, ...missingApps]);
    }
  }, []); // Run once on mount

  // Global hotkey to toggle Start Menu (Alt+S)
  useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
          if ((e.altKey && e.key.toLowerCase() === 's')) {
              e.preventDefault();
              setStartMenuOpen(prev => !prev);
              console.debug('StartMenu: toggle via Alt+S');
          }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Sync User Apps to Desktop
  useEffect(() => {
      const newItems = [...desktopItems];
      let hasChanges = false;
      props.state.userApps.forEach((app, i) => {
          if (!newItems.find(item => item.appId === app.id)) {
              // Find a free slot for new apps
              let col = 3; // Start from 4th column
              let row = 0;
              let x = MARGIN_X + col * GRID_W;
              let y = MARGIN_Y + row * GRID_H;
              
              // Simple collision check to find free spot
              while (newItems.some(it => Math.abs(it.x - x) < 10 && Math.abs(it.y - y) < 10)) {
                  row++;
                  if (row > 5) { row = 0; col++; }
                  x = MARGIN_X + col * GRID_W;
                  y = MARGIN_Y + row * GRID_H;
              }

              newItems.push({
                  id: app.id,
                  type: 'app',
                  title: app.name,
                  icon: app.icon,
                  appId: app.id,
                  x,
                  y
              });
              hasChanges = true;
          }
      });
      if (hasChanges) setDesktopItems(newItems);
  }, [props.state.userApps]);

  // File Content Sync
  useEffect(() => {
      if (activeFile && activeFile.type === 'file' && activeFile.content !== fileContent) {
          const timer = setTimeout(() => props.onUpdateFile(activeFile.id, fileContent), 1000);
          return () => clearTimeout(timer);
      }
  }, [fileContent, activeFile]);

  // File Watcher - подписка на изменения файловой системы
  useEffect(() => {
    if (activeApp === 'ide') {
      const unsubscribe = devFsService.registerListener((event) => {
        // Добавить уведомление о изменении
        const notification = {
          path: event.path,
          event: event.type === 'create' ? 'Created' : event.type === 'delete' ? 'Deleted' : 'Modified',
          time: Date.now()
        };
        setFileWatcherNotifications(prev => [...prev.slice(-4), notification]);
        
        // Показать toast
        if (props.onNotify) {
          const icon = event.type === 'create' ? '📄' : event.type === 'delete' ? '🗑️' : '✏️';
          props.onNotify(
            `File ${notification.event}`,
            event.path.split('/').pop() || event.path,
            event.type === 'delete' ? 'error' : 'info',
            icon,
            2000
          );
        }
        
        // Автоочистка через 5 сек
        setTimeout(() => {
          setFileWatcherNotifications(prev => prev.filter(n => n.time !== notification.time));
        }, 5000);
      });
      
      return () => unsubscribe();
    }
  }, [activeApp]);

  // Load project graph when IDE opens with active project
  useEffect(() => {
      if (activeApp === 'ide' && props.activeProject && graphNodes.length === 0) {
          (async () => {
              try {
                  const graphData = await devFsService.loadProjectGraph(props.activeProject!.id);
                  if (graphData) {
                      setBuilderName(graphData.name || props.activeProject!.name);
                      setBuilderDomain(graphData.domain || props.activeProject!.id);
                      setGraphNodes(graphData.nodes || []);
                      setGraphConnections(graphData.connections || []);
                      console.info('[Desktop] Loaded graph from DevFS for project', props.activeProject!.id);
                      if (props.onNotify) {
                          props.onNotify('✓ Проект загружен', `Граф "${graphData.name}" восстановлен`, 'success', '📂', 2000);
                      }
                  } else {
                      console.info('[Desktop] No saved graph for project', props.activeProject!.id);
                  }
              } catch (e) {
                  console.error('[Desktop] Failed to load project graph', e);
              }
          })();
      }
  }, [activeApp, props.activeProject?.id]);

  // Autosave VisualEditor graph (debounced)
  useEffect(() => {
      // Only autosave while in VISUAL builder mode
      if (builderMode !== 'VISUAL') return;

      // debounce
      if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current);
      setSavingStatus('saving');
      autoSaveTimer.current = window.setTimeout(async () => {
          try {
              // Ensure DevFS is initialized before any write
              await devFsService.init();
              const filenameBase = `${(builderDomain || 'untitled')}-${(builderName || 'app')}`.replace(/[^a-z0-9-_\.]/gi, '_');
              const filePath = `/visual/${filenameBase}.visual.json`;

              // ensure /visual folder exists
              const visFolder = await devFsService.getEntry('/visual');
              if (!visFolder) {
                  await devFsService.createFolder('/visual');
              }

              const payload = JSON.stringify({ name: builderName, domain: builderDomain, nodes: graphNodes, connections: graphConnections });

              // createFile uses put() semantics via dbService, so it will upsert
              await devFsService.createFile(filePath, payload);
              
              // Also save to active project if available
              if (props.activeProject) {
                  const graphData = { name: builderName, domain: builderDomain, nodes: graphNodes, connections: graphConnections };
                  await devFsService.saveProjectGraph(props.activeProject.id, graphData);
                  console.info('[Desktop] Saved graph to project DevFS:', props.activeProject.id);
              }
              
              console.info('[Desktop] VisualEditor autosaved', filePath);
              setSavingStatus('saved');
              // show UI notification if provided
              if (props.onNotify) props.onNotify('Autosave', `Visual saved — ${filePath}`, 'success', undefined, 2000);
              // clear saved state after short delay
              setTimeout(() => setSavingStatus('idle'), 2000);
          } catch (e) {
              console.warn('[Desktop] autosave failed', e);
              setSavingStatus('error');
              if (props.onNotify) props.onNotify('Autosave failed', `Не удалось сохранить визуал: ${e}`, 'error', undefined, 4000);
              // reset to idle after a bit so UI doesn't remain in error forever
              setTimeout(() => setSavingStatus('idle'), 4000);
          }
      }, 1000) as unknown as number;

      return () => {
          if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current);
      };
  }, [graphNodes, graphConnections, builderName, builderDomain, builderMode]);

  // Load existing visual file when entering VISUAL builder mode
  useEffect(() => {
      const loadIfExists = async () => {
          if (builderMode !== 'VISUAL') return;
          try {
              await devFsService.init();
              const filenameBase = `${(builderDomain || 'untitled')}-${(builderName || 'app')}`.replace(/[^a-z0-9-_\.]/gi, '_');
              const filePath = `/visual/${filenameBase}.visual.json`;
              const entry = await devFsService.getEntry(filePath);
              if (entry && entry.type === 'file' && entry.content) {
                  try {
                      const parsed = JSON.parse(entry.content);
                      if (parsed.nodes && parsed.connections) {
                          setGraphNodes(parsed.nodes);
                          setGraphConnections(parsed.connections);
                          if (props.onNotify) props.onNotify('Loaded', 'Загружен последний сохранённый визуал', 'info', undefined, 2000);
                      }
                  } catch (e) {
                      console.warn('[Desktop] Failed to parse visual file', e);
                  }
              }
          } catch (e) {
              console.warn('[Desktop] Failed to load visual file', e);
          }
      };
      loadIfExists();
  }, [builderMode]);

  const handleFileSelect = (node: FileNode) => {
      if (node.type === 'file') {
          setActiveFile(node);
          setFileContent(node.content || '');
          if (node.language) setSelectedLanguage(node.language);
      }
  };

  // Поиск в файлах
  const handleIdeSearch = (query: string) => {
    setIdeSearchQuery(query);
    if (!query.trim()) {
      setIdeSearchResults([]);
      return;
    }
    
    const results: {file: FileNode, matches: number}[] = [];
    const searchInNode = (node: FileNode) => {
      if (node.type === 'file' && node.content) {
        const regex = new RegExp(query, 'gi');
        const matches = (node.content.match(regex) || []).length;
        if (matches > 0) {
          results.push({ file: node, matches });
        }
      }
      if (node.children) {
        node.children.forEach(searchInNode);
      }
    };
    searchInNode(props.state.fileSystem);
    setIdeSearchResults(results.sort((a, b) => b.matches - a.matches));
  };

  const toggleApp = (app: AppId) => {
    playSound('click');
    if (activeApp === app) {
       setMinimized(prev => prev.includes(app) ? prev.filter(a => a !== app) : [...prev, app]);
    } else {
       setActiveApp(app);
       setMinimized(prev => prev.filter(a => a !== app));
    }
  };

  const handleInstallClick = () => {
      let code = builderCode;
      if (builderMode === 'VISUAL') {
          code = compileToRuntime(graphNodes, graphConnections);
      }
      props.onInstallApp(builderName, builderIcon, code, builderDomain);
  };

  // --- DRAG AND DROP ---
  const onMouseDownIcon = (e: React.MouseEvent, item: DesktopItem) => {
      e.stopPropagation();
      setDragItem({
          id: item.id,
          startX: e.clientX,
          startY: e.clientY,
          initX: item.x,
          initY: item.y
      });
  };

  const onMouseMove = (e: React.MouseEvent) => {
      if (!dragItem) return;
      const deltaX = e.clientX - dragItem.startX;
      const deltaY = e.clientY - dragItem.startY;
      
      setDesktopItems(prev => prev.map(item => 
          item.id === dragItem.id 
              ? { ...item, x: dragItem.initX + deltaX, y: dragItem.initY + deltaY } 
              : item
      ));
  };

  const onMouseUp = (e: React.MouseEvent) => {
      if (dragItem) {
          const currentItem = desktopItems.find(i => i.id === dragItem.id);
          
          if (currentItem) {
              // 1. Check drop on folder
              const droppedOnFolder = desktopItems.find(i => 
                  i.id !== dragItem.id && 
                  i.type === 'folder' &&
                  Math.abs(i.x - currentItem.x) < 40 &&
                  Math.abs(i.y - currentItem.y) < 40
              );

              if (droppedOnFolder) {
                  // Logic to move item into folder (for now just console log or prevent overlap)
                  // For this implementation, we will just bounce back if it's a folder collision to prevent chaos
                  // Real folder logic involves updating children array
                  setDesktopItems(prev => prev.map(item => 
                      item.id === dragItem.id 
                          ? { ...item, x: dragItem.initX, y: dragItem.initY } 
                          : item
                  ));
              } else {
                  // 2. Snap to Grid
                  const { x: snapX, y: snapY } = snapToGrid(currentItem.x, currentItem.y);
                  
                  // 3. Check Collision
                  const isOccupied = desktopItems.some(i => 
                      i.id !== dragItem.id &&
                      i.x === snapX && i.y === snapY
                  );

                  if (isOccupied) {
                      // Bounce back
                      setDesktopItems(prev => prev.map(item => 
                          item.id === dragItem.id 
                              ? { ...item, x: dragItem.initX, y: dragItem.initY } 
                              : item
                      ));
                      playSound('error');
                  } else {
                      // Apply Snap
                      const newItems = desktopItems.map(item => 
                          item.id === dragItem.id 
                              ? { ...item, x: snapX, y: snapY } 
                              : item
                      );
                      setDesktopItems(newItems);
                      playSound('click');
                      // LAYER 0: Save desktop layout
                      if (props.onSaveDesktopLayout) {
                          props.onSaveDesktopLayout(newItems);
                      }
                  }
              }
          }
          setDragItem(null);
      }
  };

  const handleRightClick = (e: React.MouseEvent, targetId?: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, targetId });
  };

  const handleContextMenuAction = (action: string) => {
      if (action === 'new_folder') {
          // Find free spot
          let col = 2; 
          let row = 0;
          let x = MARGIN_X + col * GRID_W;
          let y = MARGIN_Y + row * GRID_H;
          while (desktopItems.some(it => it.x === x && it.y === y)) {
              row++;
              if (row > 5) { row = 0; col++; }
              x = MARGIN_X + col * GRID_W;
              y = MARGIN_Y + row * GRID_H;
          }

          const newFolder: DesktopItem = {
              id: `folder_${Date.now()}`,
              type: 'folder',
              title: 'New Folder',
              icon: '📁',
              x,
              y,
              children: []
          };
          setDesktopItems([...desktopItems, newFolder]);
      } else if (action === 'size_small') {
          setIconSize('small');
      } else if (action === 'size_medium') {
          setIconSize('medium');
      } else if (action === 'sort_by_name') {
          // Sort icons by name and arrange in grid
          const sorted = [...desktopItems].sort((a, b) => a.title.localeCompare(b.title));
          const arranged = sorted.map((item, idx) => {
              const col = Math.floor(idx / 6);
              const row = idx % 6;
              return { ...item, x: MARGIN_X + col * GRID_W, y: MARGIN_Y + row * GRID_H };
          });
          setDesktopItems(arranged);
      } else if (action === 'sort_by_type') {
          // Sort: folders first, then apps, then by name
          const sorted = [...desktopItems].sort((a, b) => {
              if (a.type === 'folder' && b.type !== 'folder') return -1;
              if (a.type !== 'folder' && b.type === 'folder') return 1;
              return a.title.localeCompare(b.title);
          });
          const arranged = sorted.map((item, idx) => {
              const col = Math.floor(idx / 6);
              const row = idx % 6;
              return { ...item, x: MARGIN_X + col * GRID_W, y: MARGIN_Y + row * GRID_H };
          });
          setDesktopItems(arranged);
      } else if (action === 'auto_arrange') {
          // Auto-arrange icons to remove gaps
          const arranged = desktopItems.map((item, idx) => {
              const col = Math.floor(idx / 6);
              const row = idx % 6;
              return { ...item, x: MARGIN_X + col * GRID_W, y: MARGIN_Y + row * GRID_H };
          });
          setDesktopItems(arranged);
      } else if (action === 'hide_icon' && contextMenu?.targetId) {
          // Remove icon from desktop but keep the app installed
          setDesktopItems(prev => prev.filter(i => i.id !== contextMenu.targetId));
      } else if (action === 'delete' && contextMenu?.targetId) {
          // Full uninstall: remove from desktop AND delete user app
          setDesktopItems(prev => prev.filter(i => i.id !== contextMenu.targetId));
          const app = props.state.userApps.find(a => a.id === contextMenu.targetId);
          if (app) props.onUninstallApp(app.id);
      } else if (action === 'open_folder' && contextMenu?.targetId) {
          if (!openFolders.includes(contextMenu.targetId)) {
              setOpenFolders([...openFolders, contextMenu.targetId]);
          }
      }
      setContextMenu(null);
  };

  const renderIcon = (item: DesktopItem) => {
      const isDragging = dragItem?.id === item.id;
      
      const handleDoubleClick = () => {
          if (item.type === 'folder') {
              // Check if it's a system folder shortcut
              if (item.id === 'folder-projects') {
                  setStorageAppPath('/projects');
                  toggleApp('devfs');
              } else if (item.id === 'folder-sites') {
                  setStorageAppPath('/sites');
                  toggleApp('devfs');
              } else if (item.id === 'folder-storage') {
                  setStorageAppPath('/storage');
                  toggleApp('devfs');
              } else {
                  setOpenFolders([...openFolders, item.id]);
              }
          } else {
              toggleApp(item.appId!);
          }
      };
      
      return (
        <div 
            key={item.id}
            data-desktop-icon="true"
            onMouseDown={(e) => onMouseDownIcon(e, item)}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => { e.stopPropagation(); e.preventDefault(); handleRightClick(e, item.id); }}
            className={`absolute flex flex-col items-center gap-1 group cursor-pointer p-1 rounded transition-all select-none 
                ${isDragging ? 'z-50 scale-110' : 'transition-transform hover:bg-white/10'}
                ${iconSize === 'medium' ? 'w-[80px]' : 'w-[60px]'}
            `}
            style={{ 
                left: item.x, 
                top: item.y,
                // Smooth movement only when NOT dragging to allow snapping animation
                transition: isDragging ? 'none' : 'left 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
        >
            <div className={`
                ${iconSize === 'medium' ? 'w-12 h-12 text-2xl' : 'w-8 h-8 text-lg'} 
                ${item.type === 'folder' ? 'bg-yellow-600/80 border-yellow-400' : 'bg-slate-800/80 border-slate-500'}
                backdrop-blur rounded-lg border flex items-center justify-center shadow-lg
            `}>
                {item.icon}
            </div>
            <span className="text-white text-[10px] font-bold drop-shadow-md bg-black/50 px-2 rounded truncate max-w-full text-center">
                {item.title}
            </span>
        </div>
      );
  };

  return (
    <div 
        className="w-full h-screen bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover overflow-hidden flex flex-col relative font-sans"
        onClick={(e) => { 
            const target = e.target as HTMLElement;
            const isStartMenuClick = target.closest('#start-menu-button') || target.closest('[data-start-menu]');
            setContextMenu(null); 
            if (!isStartMenuClick) {
                setStartMenuOpen(false);
            }
        }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onContextMenu={(e) => handleRightClick(e)}
    >
    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-none"></div>
      
      {/* Desktop Area - clickable for context menu */}
      <div 
          className="flex-1 relative overflow-hidden"
          onContextMenu={(e) => {
              // Only show desktop menu if clicking on empty space (not on icon)
              const target = e.target as HTMLElement;
              if (!target.closest('[data-desktop-icon]')) {
                  handleRightClick(e);
              }
          }}
      >
          {desktopItems.map(renderIcon)}
          
          {/* Open Folders */}
          {openFolders.map(fid => {
              const folder = desktopItems.find(i => i.id === fid);
              if (!folder) return null;
              return (
                  <div key={fid} className="absolute bg-slate-800 border border-slate-600 shadow-2xl rounded-lg w-64 h-48 flex flex-col z-40" style={{ left: folder.x + 20, top: folder.y + 20 }}>
                      <div className="h-6 bg-slate-700 flex justify-between items-center px-2">
                          <span className="text-xs text-white">{folder.title}</span>
                          <button onClick={() => setOpenFolders(openFolders.filter(id => id !== fid))} className="text-white hover:text-red-400">×</button>
                      </div>
                      <div className="flex-1 p-2 flex flex-wrap gap-2 content-start">
                          {/* Empty for now, drag logic for children would go here */}
                          <span className="text-xs text-slate-500 w-full text-center mt-4">Empty Folder</span>
                      </div>
                  </div>
              )
          })}
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
          <div className="absolute z-[100] bg-slate-800 border border-slate-600 rounded shadow-2xl py-1 w-48 text-sm" style={{ top: contextMenu.y, left: contextMenu.x }}>
              {contextMenu.targetId ? (
                  (() => {
                    const targetItem = desktopItems.find(i => i.id === contextMenu.targetId);
                    const isSystemApp = SYSTEM_APPS.some(s => s.id === contextMenu.targetId);
                    const isUserApp = props.state.userApps.some(a => a.id === contextMenu.targetId);
                    const isUserFolder = targetItem?.type === 'folder' && !targetItem.id.startsWith('folder-');
                    const isSystemFolder = targetItem?.type === 'folder' && targetItem.id.startsWith('folder-');
                    return (
                      <>
                        <button onClick={() => toggleApp(targetItem?.appId || '')} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 text-white flex items-center gap-2">
                          <span>🔓</span> Открыть
                        </button>
                        {targetItem && (
                          <div className="px-3 py-1 text-slate-500 text-xs border-t border-slate-700 mt-1">
                            {targetItem.title} {isUserApp ? '(Мой)' : isSystemApp ? '(Система)' : ''}
                          </div>
                        )}
                        {/* Remove from desktop - for system apps (hides icon, app stays in Start Menu) */}
                        {isSystemApp && (
                          <button onClick={() => handleContextMenuAction('hide_icon')} className="w-full text-left px-3 py-1.5 hover:bg-orange-600 text-orange-300 flex items-center gap-2">
                            <span>👁️‍🗨️</span> Убрать с рабочего стола
                          </button>
                        )}
                        {/* Full delete for user apps and user folders */}
                        {(isUserApp || isUserFolder) && (
                          <button onClick={() => handleContextMenuAction('delete')} className="w-full text-left px-3 py-1.5 hover:bg-red-600 text-red-300 flex items-center gap-2">
                            <span>🗑️</span> Удалить
                          </button>
                        )}
                        {/* System folders can't be removed */}
                        {isSystemFolder && (
                          <div className="px-3 py-1 text-slate-500 text-xs italic">Системная папка</div>
                        )}
                      </>
                    );
                  })()
              ) : (
                  <>
                    <button onClick={() => handleContextMenuAction('new_folder')} className="w-full text-left px-3 py-1 hover:bg-slate-700 text-white">📁 New Folder</button>
                    <div className="border-t border-slate-700 my-1"></div>
                    <div className="px-3 py-1 text-xs text-slate-500">Sort by</div>
                    <button onClick={() => handleContextMenuAction('sort_by_name')} className="w-full text-left px-3 py-1 hover:bg-slate-700 text-white">🔤 By Name</button>
                    <button onClick={() => handleContextMenuAction('sort_by_type')} className="w-full text-left px-3 py-1 hover:bg-slate-700 text-white">📂 By Type</button>
                    <button onClick={() => handleContextMenuAction('auto_arrange')} className="w-full text-left px-3 py-1 hover:bg-slate-700 text-white">🧹 Auto Arrange</button>
                    <div className="border-t border-slate-700 my-1"></div>
                    <div className="px-3 py-1 text-xs text-slate-500">View</div>
                    <button onClick={() => handleContextMenuAction('size_medium')} className="w-full text-left px-3 py-1 hover:bg-slate-700 text-white">🔲 Medium Icons</button>
                    <button onClick={() => handleContextMenuAction('size_small')} className="w-full text-left px-3 py-1 hover:bg-slate-700 text-white">🔳 Small Icons</button>
                  </>
              )}
          </div>
      )}

        {/* WINDOW: IDE */}
        <div className={`absolute top-4 left-4 md:left-28 right-4 bottom-4 bg-[#0d1117] rounded-lg border border-slate-700 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${activeApp === 'ide' && !minimized.includes('ide') ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
            {/* Window Bar */}
            <div className="h-10 bg-slate-800 flex items-center px-4 justify-between select-none border-b border-black">
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-300 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span> DevStudio Pro
                    </span>
                    <div className="flex bg-slate-900 rounded p-1 gap-1">
                        <button onClick={() => setIdeMode('WORK')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${ideMode === 'WORK' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{t.editor}</button>
                        <button onClick={() => setIdeMode('BUILDER')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${ideMode === 'BUILDER' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{t.builder} 🛠️</button>
                        <button onClick={() => setIdeMode('HELP')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${ideMode === 'HELP' ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{t.manual} 📘</button>
                    </div>
                    
                    {/* LANGUAGE SELECTOR */}
                    {ideMode === 'WORK' && (
                        <select 
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value as ProgrammingLanguage)}
                            className="bg-slate-900 border border-slate-600 text-xs text-white rounded px-2 py-1 outline-none focus:border-blue-500"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                            <option value="rust">Rust</option>
                            <option value="go">Go</option>
                            <option value="sql">SQL</option>
                            <option value="lua">Lua</option>
                        </select>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setMinimized(p => [...p, 'ide'])} className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400"></button>
                    <button onClick={() => toggleApp('ide')} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400"></button>
                </div>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
                {ideMode === 'WORK' && (
                    <>
                        <div className="w-64 border-r border-slate-700 bg-[#0d1117] flex flex-col hidden md:flex">
                            <div className="p-2 border-b border-slate-800 flex gap-1">
                                <button onClick={() => setShowNewFileInp('file')} className="p-1 hover:bg-slate-700 rounded text-slate-400" title="New File">📄+</button>
                                <button onClick={() => setShowNewFileInp('folder')} className="p-1 hover:bg-slate-700 rounded text-slate-400" title="New Folder">📁+</button>
                            </div>
                            {/* Search in files */}
                            <div className="p-2 border-b border-slate-800">
                                <div className="relative">
                                    <input 
                                        value={ideSearchQuery}
                                        onChange={(e) => handleIdeSearch(e.target.value)}
                                        className="w-full bg-slate-800 text-white text-xs px-2 py-1.5 pl-7 rounded outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Search in files..."
                                    />
                                    <span className="absolute left-2 top-1.5 text-slate-500">🔍</span>
                                </div>
                                {ideSearchResults.length > 0 && (
                                    <div className="mt-2 max-h-32 overflow-y-auto">
                                        {ideSearchResults.map((r, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => { handleFileSelect(r.file); setIdeSearchQuery(''); setIdeSearchResults([]); }}
                                                className="w-full text-left px-2 py-1 hover:bg-slate-700 rounded text-[10px] flex justify-between items-center"
                                            >
                                                <span className="text-slate-300 truncate">{r.file.name}</span>
                                                <span className="text-yellow-400 font-mono">{r.matches}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {showNewFileInp && (
                                <form onSubmit={(e) => { e.preventDefault(); if(newFileName.trim()) { props.onCreateFile('root', newFileName, showNewFileInp); setShowNewFileInp(null); setNewFileName(''); } }} className="p-2 border-b border-slate-800">
                                    <input autoFocus className="w-full bg-slate-800 text-white text-xs px-2 py-1 rounded outline-none" placeholder={`New ${showNewFileInp}...`} value={newFileName} onChange={e => setNewFileName(e.target.value)} onBlur={() => setShowNewFileInp(null)} />
                                </form>
                            )}
                            <div className="flex-1 overflow-y-auto p-2">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-2">EXPLORER</div>
                                <FileTreeItem node={props.state.fileSystem} depth={0} onSelect={handleFileSelect} onToggle={() => {}} selectedId={activeFile?.id} />
                            </div>
                            {/* File Watcher Notifications */}
                            {fileWatcherNotifications.length > 0 && (
                              <div className="p-2 border-t border-slate-800 bg-[#161b22]/50">
                                <div className="text-[9px] text-slate-500 uppercase mb-1">Recent Changes</div>
                                {fileWatcherNotifications.map((n, i) => (
                                  <div key={i} className="flex items-center gap-1 text-[10px] py-0.5 animate-pulse">
                                    <span className={`w-1.5 h-1.5 rounded-full ${n.event === 'Created' ? 'bg-green-500' : n.event === 'Deleted' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                    <span className="text-slate-400 truncate">{n.path.split('/').pop()}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="p-2 border-t border-slate-800 bg-[#161b22]">
                                <div className="text-[10px] text-slate-400 mb-1 flex justify-between"><span>Storage</span><span>{props.storageStats.usedGB.toFixed(2)} GB</span></div>
                                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (props.storageStats.usedGB / props.storageStats.totalCapacity) * 100)}%` }}></div></div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col relative bg-[#0d1117]">
                            {activeFile ? (
                                <>
                                    <div className="h-8 bg-[#0d1117] flex border-b border-slate-700 overflow-x-auto"><div className="px-4 py-1 text-xs text-slate-300 bg-[#1e1e1e] border-r border-slate-700 border-t-2 border-t-blue-500 flex items-center gap-2"><span>{activeFile.name}</span><button onClick={() => setActiveFile(null)} className="hover:text-white">×</button></div></div>
                                    <div className="flex-1 relative pb-6">
                                        <CodeEditor 
                                            value={fileContent} 
                                            onChange={setFileContent} 
                                            language={selectedLanguage}
                                            onRun={() => props.onCode(selectedLanguage)}
                                            showLineNumbers={true}
                                        />
                                    </div>
                                </>
                            ) : (
                                <Monitor codeLines={props.writtenCode} onClick={() => props.onCode(selectedLanguage)} isCrunchMode={props.isCrunchMode} onConsoleSubmit={props.onConsoleSubmit} currentTaskHint={undefined} isWindowed={true} language={selectedLanguage} />
                            )}
                            <div className="h-32 border-t border-slate-700"><Terminal logs={props.logs} /></div>
                        </div>
                    </>
                )}
                {ideMode === 'BUILDER' && (
                    <div className="flex-1 bg-[#1e1e1e] flex flex-col">
                        <div className="p-2 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                            <div className="flex gap-2">
                                <input value={builderName} onChange={e => setBuilderName(e.target.value)} placeholder="App Name" className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white" />
                                <div className="flex items-center bg-slate-900 border border-slate-600 rounded px-2"><span className="text-slate-500 text-xs">ang://</span><input value={builderDomain} onChange={e => setBuilderDomain(e.target.value.replace(/[^a-z0-9-]/g, ''))} placeholder="domain" className="bg-transparent border-none outline-none text-xs text-green-400 w-24" /></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="bg-slate-900 rounded p-0.5 flex"><button onClick={() => setBuilderMode('CODE')} className={`px-2 py-1 rounded text-[10px] ${builderMode === 'CODE' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>CODE</button><button onClick={() => setBuilderMode('VISUAL')} className={`px-2 py-1 rounded text-[10px] ${builderMode === 'VISUAL' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>VISUAL</button></div>
                                <button onClick={handleInstallClick} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded text-xs font-bold">{t.install}</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            {builderMode === 'CODE' ? (
                                <CodeEditor 
                                    value={builderCode} 
                                    onChange={setBuilderCode} 
                                    language={selectedLanguage}
                                    showLineNumbers={true}
                                />
                            ) : (
                                <div className="relative h-full">
                                    <VisualEditor nodes={graphNodes} connections={graphConnections} onChange={(n, c) => { setGraphNodes(n); setGraphConnections(c); }} language={selectedLanguage} />
                                    <div className="absolute top-2 right-4 z-50">
                                        {savingStatus === 'saving' && <div className="px-2 py-1 bg-yellow-600 text-black text-xs rounded flex items-center gap-2"><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>Saving...</div>}
                                        {savingStatus === 'saved' && <div className="px-2 py-1 bg-green-600 text-white text-xs rounded">Saved</div>}
                                        {savingStatus === 'error' && <div className="px-2 py-1 bg-red-700 text-white text-xs rounded">Save failed</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {ideMode === 'HELP' && <IDEDocs language={props.state.language} />}
            </div>
        </div>

        {/* OTHER APPS */}
        {activeApp === 'browser' && !minimized.includes('browser') && (
            <Browser onClose={() => toggleApp('browser')} money={props.state.money} inventory={props.state.inventory} isShadowUnlocked={props.state.isShadowMarketUnlocked} onBuy={props.onBuy} onSell={props.onSell} shadowCredits={props.state.shadowCredits} globalHeat={props.state.globalHeat} onExchange={props.onExchange} userApps={props.state.userApps} gameState={props.state} onStartHack={props.onStartHack!} />
        )}
        {activeApp === 'messenger' && !minimized.includes('messenger') && (
            <Messenger onClose={() => toggleApp('messenger')} hasUnread={props.state.hasUnreadMessages} globalMessages={props.chatMessages} onSendGlobal={props.onChatSend} isShadowUnlocked={props.state.isShadowMarketUnlocked} username={props.state.username} emails={props.state.emails} />
        )}
        {activeApp === 'projects' && !minimized.includes('projects') && (
            <ProjectsApp state={props.state} onStartProject={props.onStartProject} onReleaseProject={props.onReleaseProject} onDeleteProject={props.onDeleteProject} onClose={() => toggleApp('projects')} />
        )}
        {activeApp === 'music' && !minimized.includes('music') && (
            <MusicPlayer onClose={() => toggleApp('music')} />
        )}
        {activeApp === 'skills' && !minimized.includes('skills') && (
            <SkillTreeApp state={props.state} onUnlock={props.onUnlockPerk} onClose={() => toggleApp('skills')} />
        )}
        {activeApp === 'leaderboard' && !minimized.includes('leaderboard') && (
            <LeaderboardApp state={props.state} onClose={() => toggleApp('leaderboard')} />
        )}
        {activeApp === 'storage' && !minimized.includes('storage') && (
            <InventoryApp state={props.state} onClose={() => toggleApp('storage')} />
        )}
        {activeApp === 'devfs' && !minimized.includes('devfs') && (
            <StorageApp 
                onClose={() => { 
                    toggleApp('devfs'); 
                    setStorageAppPath(undefined); // Reset path on close
                }} 
                onNotify={props.onNotify} 
                initialPath={storageAppPath}
            />
        )}
        {activeApp === 'bank' && !minimized.includes('bank') && (
            <BankApp state={props.state} onClose={() => toggleApp('bank')} onPayBill={props.onPayBill} onTakeLoan={props.onTakeLoan} onRepayLoan={props.onRepayLoan} />
        )}
        {activeApp === 'corporations' && !minimized.includes('corporations') && (
            <div className="absolute top-10 left-10 md:left-40 right-10 bottom-20 bg-gray-900 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-green-900">
                <div className="h-8 bg-black/80 border-b border-green-900/50 flex items-center justify-between px-3">
                    <span className="text-xs font-bold text-green-400">🏢 Корпорации CyberNation</span>
                    <div className="flex gap-2">
                        <button onClick={() => setMinimized(p => [...p, 'corporations'])} className="w-3 h-3 rounded-full bg-yellow-500"></button>
                        <button onClick={() => toggleApp('corporations')} className="w-3 h-3 rounded-full bg-red-500"></button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <CorporationsApp 
                        corporationReps={props.state.corporationReps}
                        membership={props.state.corpMembership}
                        activeQuests={props.state.activeCorpQuests}
                        completedQuestIds={props.state.completedCorpQuests}
                        money={props.state.money}
                        onJoinCorp={props.onJoinCorp}
                        onLeaveCorp={props.onLeaveCorp}
                        onStartQuest={props.onStartQuest}
                        onCollectReward={props.onCollectReward}
                        onPayDues={props.onPayDues}
                        onSelectCorporation={(corpId) => console.log('Selected corporation:', corpId)} 
                    />
                </div>
            </div>
        )}
        {activeApp === 'blueprints' && !minimized.includes('blueprints') && (
            <div className="absolute top-10 left-10 md:left-40 right-10 bottom-20 bg-gray-900 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-purple-900">
                <div className="h-8 bg-black/80 border-b border-purple-900/50 flex items-center justify-between px-3">
                    <span className="text-xs font-bold text-purple-400">📜 Чертежи</span>
                    <div className="flex gap-2">
                        <button onClick={() => setMinimized(p => [...p, 'blueprints'])} className="w-3 h-3 rounded-full bg-yellow-500"></button>
                        <button onClick={() => toggleApp('blueprints')} className="w-3 h-3 rounded-full bg-red-500"></button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <BlueprintsApp 
                        blueprints={props.state.blueprints || []}
                        money={props.state.money}
                        shadowCredits={props.state.shadowCredits}
                        playerLevel={props.state.level}
                        onAddBlueprint={props.onAddBlueprint}
                        onCraft={props.onCraftBlueprint}
                        onSell={props.onSellBlueprint}
                        onSpendMoney={props.onSpendMoney}
                        onSpendShadowCredits={props.onSpendShadowCredits}
                    />
                </div>
            </div>
        )}
        {activeApp === 'tutorial' && !minimized.includes('tutorial') && (
            <div className="absolute top-10 left-10 md:left-40 right-10 bottom-20 bg-gray-900 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-cyan-900">
                <div className="h-8 bg-black/80 border-b border-cyan-900/50 flex items-center justify-between px-3">
                    <span className="text-xs font-bold text-cyan-400">📖 Гайд DevOS</span>
                    <div className="flex gap-2">
                        <button onClick={() => setMinimized(p => [...p, 'tutorial'])} className="w-3 h-3 rounded-full bg-yellow-500"></button>
                        <button onClick={() => toggleApp('tutorial')} className="w-3 h-3 rounded-full bg-red-500"></button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <TutorialGuide language={props.state.language} />
                </div>
            </div>
        )}
        {/* LAYER 10-12: Social Hub - P2P Contracts & Guilds */}
        {activeApp === 'social' && !minimized.includes('social') && (
            <div className="absolute top-10 left-10 md:left-40 right-10 bottom-20 bg-gray-900 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-purple-900">
                <div className="h-8 bg-black/80 border-b border-purple-900/50 flex items-center justify-between px-3">
                    <span className="text-xs font-bold text-purple-400">🌐 Social Hub</span>
                    <div className="flex gap-2">
                        <button onClick={() => setMinimized(p => [...p, 'social'])} className="w-3 h-3 rounded-full bg-yellow-500"></button>
                        <button onClick={() => toggleApp('social')} className="w-3 h-3 rounded-full bg-red-500"></button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <SocialHub
                        onClose={() => toggleApp('social')}
                        playerId={props.state.username}
                        playerName={props.state.username}
                        playerLevel={props.state.level}
                        playerReputation={props.state.reputation || 0}
                        playerMoney={props.state.money}
                    />
                </div>
            </div>
        )}
        {/* LAYER 6: Labs Network - Independent Labs, Hacking, Prototypes */}
        {activeApp === 'labs' && !minimized.includes('labs') && (
            <div className="absolute top-10 left-10 md:left-40 right-10 bottom-20 bg-gray-900 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-cyan-900">
                <LabsApp
                    state={props.state}
                    onStartHack={(labId, questId) => {
                        // Trigger hacking minigame with lab context
                        if (props.onStartHack) props.onStartHack(labId, questId);
                    }}
                    onClose={() => toggleApp('labs')}
                />
            </div>
        )}
        {/* LAYER 13: Planet Sphere - CyberNation Visualization */}
        {activeApp === 'planet' && !minimized.includes('planet') && (
            <div className="absolute top-10 left-10 md:left-40 right-10 bottom-20 bg-gray-900 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-cyan-900">
                <PlanetApp
                    state={props.state}
                    onClose={() => toggleApp('planet')}
                />
            </div>
        )}
        {/* LAYER 16: Market App */}
        {activeApp === 'market' && !minimized.includes('market') && (
            <div className="absolute top-10 left-10 md:left-40 right-10 bottom-20 bg-gray-900 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-cyan-900">
                <div className="h-8 bg-gradient-to-r from-blue-900 to-blue-700 border-b border-blue-600 flex items-center justify-between px-3">
                    <span className="text-xs font-bold text-white">🛒 Легальный рынок</span>
                    <div className="flex gap-2">
                        <button onClick={() => setMinimized(p => [...p, 'market'])} className="w-3 h-3 rounded-full bg-yellow-500"></button>
                        <button onClick={() => toggleApp('market')} className="w-3 h-3 rounded-full bg-red-500"></button>
                    </div>
                </div>
                <MarketApp />
            </div>
        )}
        {activeApp === 'settings' && !minimized.includes('settings') && (
            <SettingsApp 
                onClose={() => toggleApp('settings')} 
                onLogout={props.onExit} 
                username={props.state.username} 
                currentLanguage={props.state.language} 
                onSetLanguage={props.onSetLanguage}
                state={props.state}
                onAddBlueprint={props.onAddBlueprint}
            />
        )}
        {props.state.userApps.map(app => activeApp === app.id && !minimized.includes(app.id) && (
            <div key={app.id} className="absolute top-10 left-10 md:left-40 right-10 bottom-20 bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-slate-300">
                <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center justify-between px-3">
                    <span className="text-xs font-bold text-slate-700">{app.name}</span>
                    <div className="flex gap-2"><button onClick={() => setMinimized(p => [...p, app.id])} className="w-3 h-3 rounded-full bg-yellow-500"></button><button onClick={() => toggleApp(app.id)} className="w-3 h-3 rounded-full bg-red-500"></button></div>
                </div>
                <div className="flex-1 relative"><UserAppRunner code={app.code} gameState={props.state} /></div>
            </div>
        ))}

      {/* Start Menu - rendered at root level, not inside taskbar */}
      {startMenuOpen && (
          <div 
              data-start-menu 
              className="fixed bottom-14 left-2 w-48 bg-slate-800 border border-slate-600 rounded shadow-2xl p-2 z-[10000]" 
              onClick={(e) => e.stopPropagation()}
          >
              <div className="px-2 py-1 text-xs font-bold text-slate-400 border-b border-slate-700 mb-1">SYSTEM</div>
              <div className="px-2 py-1 text-xs font-bold text-slate-400">APPS</div>
              <div 
                  onClick={() => { toggleApp('devfs'); setStartMenuOpen(false); }} 
                  className="w-full text-left px-2 py-2 hover:bg-slate-700 rounded text-sm text-white flex items-center gap-2 cursor-pointer"
              >
                  💾 DevFS
              </div>
              <div 
                  onClick={() => { toggleApp('social'); setStartMenuOpen(false); }} 
                  className="w-full text-left px-2 py-2 hover:bg-slate-700 rounded text-sm text-white flex items-center gap-2 cursor-pointer"
              >
                  👥 SocialHub
              </div>
              <div 
                  onClick={() => { toggleApp('corporations'); setStartMenuOpen(false); }} 
                  className="w-full text-left px-2 py-2 hover:bg-slate-700 rounded text-sm text-white flex items-center gap-2 cursor-pointer"
              >
                  🏢 Corporations
              </div>
              <div 
                  onClick={() => { toggleApp('labs'); setStartMenuOpen(false); }} 
                  className="w-full text-left px-2 py-2 hover:bg-slate-700 rounded text-sm text-white flex items-center gap-2 cursor-pointer"
              >
                  🔬 Labs Network
              </div>
              <div 
                  onClick={() => { toggleApp('planet'); setStartMenuOpen(false); }} 
                  className="w-full text-left px-2 py-2 hover:bg-slate-700 rounded text-sm text-white flex items-center gap-2 cursor-pointer"
              >
                  🌍 CyberNation Planet
              </div>
              <div className="h-px bg-slate-700 my-2"></div>
              <div 
                  onClick={() => { props.onExit(); setStartMenuOpen(false); }} 
                  className="w-full text-left px-2 py-2 hover:bg-slate-700 rounded text-sm text-white flex items-center gap-2 cursor-pointer"
              >
                  🏠 {t.start_menu_logout}
              </div>
              <div 
                  onClick={() => window.location.reload()} 
                  className="w-full text-left px-2 py-2 hover:bg-slate-700 rounded text-sm text-white flex items-center gap-2 cursor-pointer"
              >
                  🔄 {t.start_menu_reboot}
              </div>
          </div>
      )}
      
      {/* Taskbar */}
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-slate-900/90 backdrop-blur-md border-t border-white/10 flex items-center px-2 gap-2 shrink-0 z-[9999] overflow-x-auto hide-scrollbar pointer-events-auto">
          {/* Start Button */}
          <button
              id="start-menu-button"
              aria-label="start-menu"
              title="Start"
              type="button"
              onClick={(e) => { 
                  e.stopPropagation(); 
                  setStartMenuOpen(!startMenuOpen); 
              }}
              className="w-10 h-10 rounded hover:bg-white/10 flex items-center justify-center transition-colors mr-1 group pointer-events-auto cursor-pointer"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setStartMenuOpen(prev => !prev); } }}
          >
              <span className="text-2xl group-hover:scale-110 transition-transform">👾</span>
          </button>

          {/* Settings Icon Pinned Left */}
          <button onClick={() => toggleApp('settings')} className={`w-10 h-10 rounded flex items-center justify-center text-xl transition-all relative ${activeApp === 'settings' && !minimized.includes('settings') ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5'}`}>
              ⚙️
              {activeApp === 'settings' && !minimized.includes('settings') && <div className="absolute bottom-0 w-full h-0.5 bg-slate-400 rounded-t"></div>}
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-1"></div>

          {/* Running Apps */}
          {['ide', 'browser', 'messenger', 'bank', 'projects', 'devfs', 'music', 'skills', 'leaderboard', 'storage'].map(id => {
              const isOpen = activeApp === id || minimized.includes(id);
              if (!isOpen && id !== 'ide') return null; 
              let icon = '❓';
              if(id==='ide') icon='💻';
              if(id==='browser') icon='🌐';
              if(id==='messenger') icon='💬';
              if(id==='bank') icon='🏦';
              if(id==='projects') icon='🚀';
              if(id==='devfs') icon='💾';
              if(id==='music') icon='🎵';
              if(id==='skills') icon='🧠';
              if(id==='leaderboard') icon='🏆';
              if(id==='storage') icon='🗄️';

              return (
                  <button key={id} onClick={() => toggleApp(id)} className={`w-10 h-10 rounded flex items-center justify-center text-xl transition-all relative ${(activeApp === id && !minimized.includes(id)) ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5'}`}>
                      {icon}
                      {(activeApp === id && !minimized.includes(id)) && <div className="absolute bottom-0 w-full h-0.5 bg-blue-500 rounded-t"></div>}
                  </button>
              );
          })}
          {props.state.userApps.map(app => {
              const isActive = activeApp === app.id && !minimized.includes(app.id);
              return (activeApp === app.id || minimized.includes(app.id)) ? (
                  <button key={app.id} onClick={() => toggleApp(app.id)} className={`w-10 h-10 rounded flex items-center justify-center text-xl transition-all relative ${isActive ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5'}`}>
                      {app.icon}
                      {isActive && <div className="absolute bottom-0 w-full h-0.5 bg-green-500 rounded-t"></div>}
                  </button>
              ) : null;
          })}

          <div className="ml-auto px-4 flex flex-col items-end text-slate-300 leading-tight pointer-events-none select-none hidden md:flex">
              <span className="text-xs font-bold">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
              <span className="text-[10px] text-slate-500">{new Date().toLocaleDateString()}</span>
          </div>
      </div>
    </div>
  );
};
