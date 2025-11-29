import React from 'react';
import { GameState, ActiveProject, ProjectTemplate } from '../types';
import { PROJECT_TEMPLATES } from '../constants';
import { playSound } from '../utils/sound';

interface ProjectsAppProps {
    state: GameState;
    onStartProject: (template: ProjectTemplate) => void;
    onReleaseProject: () => void;
    onDeleteProject: (projectId: string) => void;
    onClose: () => void;
}

export const ProjectsApp: React.FC<ProjectsAppProps> = ({ state, onStartProject, onReleaseProject, onDeleteProject, onClose }) => {
    const active = state.activeProject;

    return (
        <div className="absolute top-10 left-10 right-10 bottom-10 bg-slate-900 rounded-lg shadow-2xl flex overflow-hidden border border-slate-700 animate-in fade-in zoom-in duration-300 font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-slate-800 border-r border-slate-700 p-4">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>🚀</span> Startups
                </h2>
                
                <div className="space-y-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ваши Проекты</div>
                    {state.releasedProjects.map((p, i) => (
                        <div key={i} className="bg-slate-700/50 p-2 rounded flex justify-between items-center text-sm group hover:bg-slate-700 transition-colors">
                            <span className="text-slate-200">{p.name}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-green-400">+${p.baseRevenue}/d</span>
                                <button 
                                    onClick={() => { 
                                        if (confirm(`Удалить проект "${p.name}"?`)) {
                                            onDeleteProject(p.id);
                                        }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all text-xs px-1"
                                    title="Удалить проект"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                    {state.releasedProjects.length === 0 && (
                        <div className="text-slate-500 text-sm italic">Пока нет выпущенных проектов.</div>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-700 mt-10">
                    <div className="text-xs text-slate-500">Total Passive Income:</div>
                    <div className="text-xl text-green-400 font-bold">
                        ${state.releasedProjects.reduce((acc, p) => acc + p.baseRevenue, 0)} / day
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-slate-900 p-8 overflow-y-auto relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>

                {active ? (
                    // ACTIVE PROJECT VIEW
                    <div className="max-w-2xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{active.name}</h1>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${active.stage === 'dev' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                                    {active.stage === 'dev' ? 'Development Phase' : 'Polishing Phase'}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-400">Lines of Code</div>
                                <div className="text-2xl font-mono text-blue-400">{Math.floor(active.progress)} / {active.linesNeeded}</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-6 bg-slate-800 rounded-full overflow-hidden mb-8 border border-slate-700 relative">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all duration-300" 
                                style={{ width: `${Math.min(100, (active.progress / active.linesNeeded) * 100)}%` }}
                            ></div>
                            {/* Stripe animation */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-800 p-4 rounded border border-slate-700">
                                <div className="text-slate-400 text-xs uppercase font-bold">Bugs Found</div>
                                <div className="text-2xl text-red-400">{active.bugs}</div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded border border-slate-700">
                                <div className="text-slate-400 text-xs uppercase font-bold">Potential Revenue</div>
                                <div className="text-2xl text-green-400">${active.baseRevenue}/day</div>
                            </div>
                        </div>

                        {active.progress >= active.linesNeeded && (
                            <div className="flex justify-center animate-bounce">
                                <button 
                                    onClick={() => { playSound('success'); onReleaseProject(); }}
                                    className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all transform hover:scale-105"
                                >
                                    RELEASE TO MARKET 🚀
                                </button>
                            </div>
                        )}
                         
                         {active.progress < active.linesNeeded && (
                             <div className="text-center text-slate-500 italic">
                                 Иди в IDE и пиши код, чтобы завершить проект!
                             </div>
                         )}
                    </div>
                ) : (
                    // PROJECT SELECTION
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Выберите новый проект</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {PROJECT_TEMPLATES.map(template => (
                                <div key={template.id} className="bg-slate-800 border border-slate-700 p-6 rounded hover:border-blue-500 transition-colors group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded bg-slate-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                            {template.type === 'web' && '🌐'}
                                            {template.type === 'mobile' && '📱'}
                                            {template.type === 'game' && '🎮'}
                                            {template.type === 'ai' && '🤖'}
                                        </div>
                                        <div className="text-xs font-bold bg-slate-900 px-2 py-1 rounded text-slate-400">
                                            DIFF: {template.difficulty}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">{template.name}</h3>
                                    <p className="text-sm text-slate-400 mb-4">{template.linesNeeded} строк кода • Доход: ${template.baseRevenue}/день</p>
                                    
                                    <button 
                                        onClick={() => { playSound('click'); onStartProject(template); }}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors"
                                    >
                                        Начать разработку
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}