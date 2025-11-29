
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GraphNode, GraphConnection, VisualNodeType, ProgrammingLanguage } from '../types';
import { compileToLanguage } from '../utils/visualCompiler';
import { projectGraphService, ProjectGraph, ProjectMeta } from '../services/projectGraphService';

interface VisualEditorProps {
    nodes: GraphNode[];
    connections: GraphConnection[];
    onChange: (nodes: GraphNode[], connections: GraphConnection[]) => void;
    language: ProgrammingLanguage;
    projectId?: string; // Optional: if provided, enables DevFS integration
    onProjectChange?: (project: ProjectGraph) => void;
}

const CATEGORIES = {
    Events: ['event_start'],
    UI_Builder: ['ui_button', 'ui_input', 'ui_text'],
    Logic: ['logic_if', 'logic_timer', 'logic_loop'],
    Variables: ['var_set', 'math_add', 'math_sub'],
    Action: ['action_alert', 'action_log', 'action_spawn', 'action_sound'],
    IO: ['io_print']
};

const NODE_DEFS: Record<VisualNodeType, { label: string, color: string, inputs: number, outputs: string[] }> = {
    event_start: { label: 'On Start', color: 'bg-green-600', inputs: 0, outputs: ['flow'] },
    event_click: { label: 'On Click', color: 'bg-green-600', inputs: 0, outputs: ['flow'] },
    
    // UI Builder
    ui_button: { label: 'UI Button', color: 'bg-pink-600', inputs: 1, outputs: ['click', 'flow'] },
    ui_input: { label: 'UI Input', color: 'bg-pink-700', inputs: 1, outputs: ['change', 'flow'] },
    ui_text: { label: 'UI Text', color: 'bg-slate-500', inputs: 1, outputs: ['flow'] },

    // Advanced Logic
    logic_if: { label: 'If Condition', color: 'bg-purple-600', inputs: 1, outputs: ['true', 'false'] },
    logic_timer: { label: 'Timer (Wait)', color: 'bg-orange-700', inputs: 1, outputs: ['flow'] },
    logic_loop: { label: 'For Loop', color: 'bg-purple-800', inputs: 1, outputs: ['loop', 'done'] },
    
    var_set: { label: 'Set Var', color: 'bg-yellow-600', inputs: 1, outputs: ['flow'] },
    math_add: { label: 'Add to Var', color: 'bg-orange-600', inputs: 1, outputs: ['flow'] },
    math_sub: { label: 'Sub from Var', color: 'bg-orange-600', inputs: 1, outputs: ['flow'] },
    
    action_alert: { label: 'Alert', color: 'bg-blue-600', inputs: 1, outputs: ['flow'] },
    action_log: { label: 'Log', color: 'bg-slate-600', inputs: 1, outputs: ['flow'] },
    action_spawn: { label: 'Spawn Obj', color: 'bg-teal-600', inputs: 1, outputs: ['flow'] },
    action_move: { label: 'Move Obj', color: 'bg-teal-600', inputs: 1, outputs: ['flow'] },
    action_sound: { label: 'Sound', color: 'bg-red-500', inputs: 1, outputs: ['flow'] },
    
    io_print: { label: 'Print Var', color: 'bg-cyan-600', inputs: 1, outputs: ['flow'] },
    var_get: { label: 'Get Var', color: 'bg-yellow-700', inputs: 0, outputs: ['flow'] },
    io_input: { label: 'Input', color: 'bg-cyan-700', inputs: 0, outputs: ['flow'] },
};

export const VisualEditor: React.FC<VisualEditorProps> = ({ nodes, connections, onChange, language, projectId, onProjectChange }) => {
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [connectingNode, setConnectingNode] = useState<{id: string, handle: string} | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [previewCode, setPreviewCode] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showVersions, setShowVersions] = useState(false);
    const [versions, setVersions] = useState<Array<{id: string, timestamp: number, content: string}>>([]);
    const [showProjectList, setShowProjectList] = useState(false);
    const [projects, setProjects] = useState<ProjectMeta[]>([]);
    const [currentProject, setCurrentProject] = useState<ProjectGraph | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const autosaveRef = useRef<number | null>(null);

    // Initialize project if projectId is provided
    useEffect(() => {
        if (projectId) {
            loadProject(projectId);
        }
        return () => {
            if (autosaveRef.current) {
                clearInterval(autosaveRef.current);
            }
        };
    }, [projectId]);

    // Autosave every 30 seconds
    useEffect(() => {
        if (currentProject && nodes.length > 0) {
            if (autosaveRef.current) {
                clearInterval(autosaveRef.current);
            }
            autosaveRef.current = window.setInterval(() => {
                handleSave();
            }, 30000);
        }
        return () => {
            if (autosaveRef.current) {
                clearInterval(autosaveRef.current);
            }
        };
    }, [currentProject, nodes, connections]);

    const loadProject = async (id: string) => {
        const project = await projectGraphService.loadProject(id);
        if (project) {
            setCurrentProject(project);
            onChange(project.nodes, project.connections);
            onProjectChange?.(project);
        }
    };

    const handleSave = useCallback(async () => {
        if (!currentProject) return;
        setIsSaving(true);
        try {
            const updatedProject: ProjectGraph = {
                ...currentProject,
                nodes,
                connections,
                updatedAt: Date.now(),
            };
            await projectGraphService.saveProject(updatedProject);
            
            // Also save generated code
            const code = compileToLanguage(nodes, connections, language);
            const ext = language === 'javascript' ? 'js' : language === 'python' ? 'py' : language;
            await projectGraphService.saveGeneratedCode(currentProject.id, `main.${ext}`, code);
            
            setCurrentProject(updatedProject);
            setLastSaved(new Date());
        } catch (e) {
            console.error('Failed to save project:', e);
        } finally {
            setIsSaving(false);
        }
    }, [currentProject, nodes, connections, language]);

    const loadVersions = async () => {
        if (!currentProject) return;
        const vers = await projectGraphService.getFileVersions(currentProject.id);
        setVersions(vers);
        setShowVersions(true);
    };

    const restoreVersion = async (versionId: string) => {
        if (!currentProject) return;
        await projectGraphService.restoreVersion(currentProject.id, 'graph.json', versionId);
        await loadProject(currentProject.id);
        setShowVersions(false);
    };

    const loadProjectList = async () => {
        const list = await projectGraphService.listProjects();
        setProjects(list);
        setShowProjectList(true);
    };

    const createNewProject = async () => {
        const name = prompt('Имя нового проекта:');
        if (!name) return;
        const project = await projectGraphService.createProject(name, language);
        setCurrentProject(project);
        onChange([], []);
        setShowProjectList(false);
    };

    // Update code preview
    useEffect(() => {
        const code = compileToLanguage(nodes, connections, language);
        setPreviewCode(code);
    }, [nodes, connections, language]);

    // --- NODE OPS ---
    const addNode = (type: VisualNodeType) => {
        const newNode: GraphNode = {
            id: `n_${Date.now()}`,
            type,
            x: 200 + Math.random() * 50,
            y: 200 + Math.random() * 50,
            data: { 
                label: NODE_DEFS[type].label, 
                value: '', 
                variableName: '', 
                operator: '==',
                elementID: `el_${Math.floor(Math.random()*1000)}` 
            }
        };
        onChange([...nodes, newNode], connections);
        setSelectedNodeId(newNode.id);
    };

    const updateNodeData = (id: string, data: Partial<GraphNode['data']>) => {
        onChange(nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n), connections);
    };

    const deleteNode = (id: string) => {
        onChange(
            nodes.filter(n => n.id !== id),
            connections.filter(c => c.fromNode !== id && c.toNode !== id)
        );
        setSelectedNodeId(null);
    };

    // --- MOUSE HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Stops drag from propagating to canvas pan (if implemented)
        setDraggingNode(id);
        setSelectedNodeId(id);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingNode) {
            const rect = editorRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = e.clientX - rect.left - 60; 
            const y = e.clientY - rect.top - 20;
            onChange(nodes.map(n => n.id === draggingNode ? { ...n, x, y } : n), connections);
        }
    };

    const handleMouseUp = () => setDraggingNode(null);

    // --- CONNECTION HANDLERS ---
    const handlePortClick = (e: React.MouseEvent, nodeId: string, isInput: boolean, handleName: string = 'flow') => {
        e.stopPropagation();
        if (!isInput) {
            setConnectingNode({ id: nodeId, handle: handleName });
        } else {
            if (connectingNode && connectingNode.id !== nodeId) {
                const newConn: GraphConnection = {
                    id: `c_${Date.now()}`,
                    fromNode: connectingNode.id,
                    toNode: nodeId,
                    sourceHandle: connectingNode.handle
                };
                onChange(nodes, [...connections, newConn]);
                setConnectingNode(null);
            }
        }
    };

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    return (
        <div className="flex w-full h-full bg-[#111]">
            {/* Project List Modal */}
            {showProjectList && (
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setShowProjectList(false)}>
                    <div className="bg-slate-800 rounded-lg p-4 w-96 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">📁 Проекты</h3>
                            <button onClick={() => setShowProjectList(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <button 
                            onClick={createNewProject}
                            className="w-full mb-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white text-sm font-bold"
                        >
                            + Новый проект
                        </button>
                        <div className="space-y-2">
                            {projects.map(p => (
                                <div 
                                    key={p.id}
                                    onClick={() => { loadProject(p.id); setShowProjectList(false); }}
                                    className="p-3 bg-slate-700 hover:bg-slate-600 rounded cursor-pointer"
                                >
                                    <div className="text-white font-medium">{p.name}</div>
                                    <div className="text-xs text-slate-400">
                                        {p.language.toUpperCase()} • {new Date(p.updatedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {projects.length === 0 && (
                                <div className="text-slate-500 text-center py-4">Нет проектов</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Version History Modal */}
            {showVersions && (
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setShowVersions(false)}>
                    <div className="bg-slate-800 rounded-lg p-4 w-96 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">🕐 История версий</h3>
                            <button onClick={() => setShowVersions(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="space-y-2">
                            {versions.map(v => (
                                <div 
                                    key={v.id}
                                    className="p-3 bg-slate-700 rounded flex justify-between items-center"
                                >
                                    <div className="text-sm text-white">
                                        {new Date(v.timestamp).toLocaleString()}
                                    </div>
                                    <button 
                                        onClick={() => restoreVersion(v.id)}
                                        className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white"
                                    >
                                        Восстановить
                                    </button>
                                </div>
                            ))}
                            {versions.length === 0 && (
                                <div className="text-slate-500 text-center py-4">Нет сохранённых версий</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* LEFT: Categories */}
            <div className="w-40 bg-slate-900 border-r border-slate-700 flex flex-col overflow-y-auto">
                {/* Project Controls */}
                <div className="p-2 border-b border-slate-700">
                    <button 
                        onClick={loadProjectList}
                        className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white mb-2"
                    >
                        📁 Проекты
                    </button>
                    {currentProject && (
                        <div className="space-y-1">
                            <div className="text-[10px] text-slate-400 truncate" title={currentProject.name}>
                                {currentProject.name}
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 rounded text-[10px] text-white"
                                >
                                    {isSaving ? '...' : '💾'}
                                </button>
                                <button 
                                    onClick={loadVersions}
                                    className="flex-1 py-1 bg-slate-600 hover:bg-slate-500 rounded text-[10px] text-white"
                                >
                                    🕐
                                </button>
                            </div>
                            {lastSaved && (
                                <div className="text-[8px] text-green-400">
                                    Сохранено: {lastSaved.toLocaleTimeString()}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="p-2 text-xs font-bold text-slate-500 uppercase">Library</div>
                {Object.entries(CATEGORIES).map(([cat, types]) => (
                    <div key={cat} className="mb-4 px-2">
                        <div className="text-[10px] text-slate-400 font-bold mb-1 uppercase">{cat.replace('_', ' ')}</div>
                        <div className="space-y-1">
                            {types.map(t => {
                                const def = NODE_DEFS[t as VisualNodeType];
                                return (
                                    <button
                                        key={t}
                                        onClick={() => addNode(t as VisualNodeType)}
                                        className={`w-full text-left px-2 py-1 rounded text-xs text-white border border-transparent hover:border-slate-500 ${def.color}`}
                                    >
                                        {def.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* MIDDLE: Canvas & Preview */}
            <div className="flex-1 flex flex-col relative">
                {/* Canvas */}
                <div 
                    ref={editorRef}
                    className="flex-1 relative overflow-hidden bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:20px_20px] cursor-crosshair"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onClick={() => setSelectedNodeId(null)} // Click on empty space clears selection
                >
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {connections.map(conn => {
                            const from = nodes.find(n => n.id === conn.fromNode);
                            const to = nodes.find(n => n.id === conn.toNode);
                            if (!from || !to) return null;
                            
                            const startY = from.y + 24; 
                            const endY = to.y + 10;
                            const startX = from.x + 120;
                            const endX = to.x;
                            
                            return (
                                <path 
                                    key={conn.id} 
                                    d={`M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`}
                                    stroke={conn.sourceHandle === 'false' ? '#ef4444' : conn.sourceHandle === 'click' ? '#d946ef' : '#22c55e'} 
                                    strokeWidth="3" 
                                    fill="none" 
                                />
                            );
                        })}
                        {connectingNode && <text x="10" y="20" fill="yellow" fontSize="12">Linking mode...</text>}
                    </svg>

                    {nodes.map(node => {
                        const def = NODE_DEFS[node.type];
                        const isSelected = selectedNodeId === node.id;
                        return (
                            <div
                                key={node.id}
                                className={`absolute w-32 rounded shadow-xl border-2 select-none z-10 flex flex-col transition-shadow cursor-pointer ${def.color} ${isSelected ? 'border-white ring-2 ring-white/50 z-20 scale-105' : 'border-slate-800'}`}
                                style={{ left: node.x, top: node.y }}
                                onMouseDown={(e) => handleMouseDown(e, node.id)}
                                onClick={(e) => e.stopPropagation()} // CRITICAL FIX: Stop click bubble to canvas
                            >
                                <div className="px-2 py-1 text-[10px] font-bold text-white bg-black/20 flex justify-between">
                                    <span>{def.label}</span>
                                    {node.type.startsWith('ui') && <span className="text-[8px] bg-white text-black px-1 rounded">UI</span>}
                                </div>
                                <div className="p-2 bg-slate-800/90 text-[10px] text-slate-300 min-h-[30px]">
                                    {node.data.elementID && <div className="text-[8px] opacity-50">ID: {node.data.elementID}</div>}
                                    {node.data.label && <div className="truncate font-bold">"{node.data.label}"</div>}
                                    {node.data.variableName && <div>Var: <span className="text-yellow-400">{node.data.variableName}</span></div>}
                                </div>
                                
                                {/* Inputs */}
                                {def.inputs > 0 && (
                                    <div 
                                        className="absolute left-[-6px] top-3 w-3 h-3 bg-yellow-400 rounded-full border border-black cursor-pointer hover:scale-125"
                                        onClick={(e) => handlePortClick(e, node.id, true)}
                                    />
                                )}

                                {/* Outputs */}
                                <div className="absolute right-[-6px] top-3 flex flex-col gap-2">
                                    {def.outputs.map((handle, i) => (
                                        <div 
                                            key={handle}
                                            className={`w-3 h-3 rounded-full border border-black cursor-pointer hover:scale-125 
                                                ${handle === 'false' ? 'bg-red-500' : 
                                                  handle === 'click' ? 'bg-pink-500' : 
                                                  handle === 'loop' ? 'bg-purple-400' :
                                                  'bg-green-500'}`}
                                            title={handle}
                                            onClick={(e) => handlePortClick(e, node.id, false, handle)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Live Code Preview Panel */}
                <div className="h-48 bg-[#0d1117] border-t border-slate-700 flex flex-col">
                    <div className="px-4 py-1 bg-slate-800 text-[10px] font-bold text-slate-400 flex justify-between">
                        <span>LIVE PREVIEW ({language.toUpperCase()})</span>
                        <span>LogicCircuit Compiler v3.0 (UI Edition)</span>
                    </div>
                    <pre className="flex-1 p-4 overflow-auto font-mono text-xs text-blue-300 selection:bg-blue-900">
                        {previewCode || '// Build your graph to see code...'}
                    </pre>
                </div>
            </div>

            {/* RIGHT: Properties Panel */}
            <div className="w-60 bg-slate-900 border-l border-slate-700 p-4 flex flex-col">
                <div className="text-xs font-bold text-slate-400 uppercase mb-4 border-b border-slate-700 pb-2">Properties</div>
                
                {selectedNode ? (
                    <div className="space-y-4 animate-in slide-in-from-right duration-200">
                         <div className="text-sm font-bold text-white mb-2">{NODE_DEFS[selectedNode.type].label}</div>
                         
                         {/* UI specific: Element ID */}
                         {selectedNode.type.startsWith('ui_') && (
                             <div>
                                 <label className="text-[10px] text-slate-500 block mb-1">Element ID (Unique)</label>
                                 <input 
                                    type="text" 
                                    value={selectedNode.data.elementID || ''}
                                    onChange={(e) => updateNodeData(selectedNode.id, { elementID: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-green-400 font-mono"
                                 />
                             </div>
                         )}

                         {/* Label / Value Text */}
                         {(selectedNode.type.includes('action') || selectedNode.type.startsWith('ui_') || selectedNode.type === 'logic_timer' || selectedNode.type === 'logic_loop' || selectedNode.type === 'var_set' || selectedNode.type === 'logic_if') && (
                             <div>
                                 <label className="text-[10px] text-slate-500 block mb-1">
                                     {selectedNode.type === 'logic_timer' ? 'Delay (ms)' : 
                                      selectedNode.type === 'logic_loop' ? 'Iterations' : 'Value / Label'}
                                 </label>
                                 <input 
                                    type="text" 
                                    value={selectedNode.data.value || selectedNode.data.label || ''}
                                    onChange={(e) => updateNodeData(selectedNode.id, { value: e.target.value, label: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                                 />
                             </div>
                         )}

                         {/* Variables */}
                         {(selectedNode.type.includes('var') || selectedNode.type.includes('math') || selectedNode.type === 'logic_if' || selectedNode.type === 'io_print' || selectedNode.type === 'ui_text' || selectedNode.type === 'ui_input') && (
                             <div>
                                 <label className="text-[10px] text-slate-500 block mb-1">Variable Name</label>
                                 <input 
                                    type="text" 
                                    value={selectedNode.data.variableName || ''}
                                    onChange={(e) => updateNodeData(selectedNode.id, { variableName: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-yellow-400 font-mono"
                                 />
                             </div>
                         )}

                         {/* Logic Operators */}
                         {selectedNode.type === 'logic_if' && (
                             <div>
                                 <label className="text-[10px] text-slate-500 block mb-1">Operator</label>
                                 <select 
                                    value={selectedNode.data.operator || '=='}
                                    onChange={(e) => updateNodeData(selectedNode.id, { operator: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                                 >
                                     <option value="==">Equals (==)</option>
                                     <option value="!=">Not Equals (!=)</option>
                                     <option value=">">Greater ({'>'})</option>
                                     <option value="<">Less ({'<'})</option>
                                 </select>
                             </div>
                         )}

                         {/* Color Picker */}
                         {(selectedNode.type === 'action_spawn' || selectedNode.type.startsWith('ui_button')) && (
                             <div>
                                 <label className="text-[10px] text-slate-500 block mb-1">Color</label>
                                 <input 
                                    type="color" 
                                    value={selectedNode.data.color || '#ff0000'}
                                    onChange={(e) => updateNodeData(selectedNode.id, { color: e.target.value })}
                                    className="w-full h-8 bg-slate-800 border border-slate-600 rounded cursor-pointer"
                                 />
                             </div>
                         )}

                         <button 
                            onClick={() => deleteNode(selectedNode.id)}
                            className="w-full mt-8 py-1 bg-red-900/50 hover:bg-red-600 border border-red-800 rounded text-xs text-red-200"
                         >
                             Delete Node
                         </button>
                    </div>
                ) : (
                    <div className="text-xs text-slate-500 italic text-center mt-10">Select a node to edit properties</div>
                )}
            </div>
        </div>
    );
};
