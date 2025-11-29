/**
 * LAYER 13: PlanetApp Component
 * Визуализация планеты CyberNation
 * Зоны влияния корпораций, лаборатории, конфликты
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { planetService, PlanetZone, PlanetMarker, PlanetConflict } from '../services/planetService';
import { GameState, CorporationId } from '../types';

interface PlanetAppProps {
    state: GameState;
    onClose: () => void;
    onSelectZone?: (zoneId: string) => void;
    onSelectMarker?: (markerId: string) => void;
}

type ViewMode = 'globe' | 'map' | 'stats';

export const PlanetApp: React.FC<PlanetAppProps> = ({ state, onClose, onSelectZone, onSelectMarker }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('map');
    const [selectedZone, setSelectedZone] = useState<PlanetZone | null>(null);
    const [selectedMarker, setSelectedMarker] = useState<PlanetMarker | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [showLabels, setShowLabels] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'labs' | 'hq' | 'conflicts'>('all');
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const zones = planetService.getZones();
    const markers = planetService.getMarkers();
    const conflicts = planetService.getActiveConflicts();
    const stats = planetService.getPlanetStats();

    // Filter markers based on filter type
    const filteredMarkers = useMemo(() => {
        if (filterType === 'all') return markers;
        if (filterType === 'labs') return markers.filter(m => m.type === 'lab');
        if (filterType === 'hq') return markers.filter(m => m.type === 'corporation_hq');
        if (filterType === 'conflicts') return markers.filter(m => m.type === 'conflict');
        return markers;
    }, [markers, filterType]);

    // Draw canvas map
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || viewMode !== 'map') return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            ctx.beginPath();
            ctx.moveTo((i * width) / 10, 0);
            ctx.lineTo((i * width) / 10, height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, (i * height) / 10);
            ctx.lineTo(width, (i * height) / 10);
            ctx.stroke();
        }

        // Draw zones
        zones.forEach(zone => {
            const x = (zone.position.x / 100) * width * zoom + pan.x;
            const y = (zone.position.y / 100) * height * zoom + pan.y;
            const radius = (zone.radius / 100) * Math.min(width, height) * zoom;

            // Zone circle with gradient
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            const baseColor = zone.corporationId ? planetService.getCorporationColor(zone.corporationId) : '#4B5563';
            gradient.addColorStop(0, baseColor + '60');
            gradient.addColorStop(0.7, baseColor + '30');
            gradient.addColorStop(1, baseColor + '10');

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Zone border
            ctx.strokeStyle = baseColor;
            ctx.lineWidth = zone.status === 'contested' ? 3 : 2;
            if (zone.status === 'under_attack') {
                ctx.setLineDash([5, 5]);
            } else {
                ctx.setLineDash([]);
            }
            ctx.stroke();

            // Zone label
            if (showLabels) {
                ctx.fillStyle = '#fff';
                ctx.font = `${12 * zoom}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(zone.nameRu, x, y + radius + 15 * zoom);
            }
        });

        // Draw markers
        filteredMarkers.forEach(marker => {
            const x = (marker.position.x / 100) * width * zoom + pan.x;
            const y = (marker.position.y / 100) * height * zoom + pan.y;

            // Marker background
            ctx.beginPath();
            ctx.arc(x, y, 12 * zoom, 0, Math.PI * 2);
            ctx.fillStyle = marker.color + '80';
            ctx.fill();
            ctx.strokeStyle = marker.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Marker icon (as text for simplicity)
            ctx.fillStyle = '#fff';
            ctx.font = `${14 * zoom}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(marker.icon, x, y);

            // Conflict pulse animation
            if (marker.type === 'conflict') {
                ctx.beginPath();
                const pulse = (Date.now() % 1000) / 1000;
                ctx.arc(x, y, 12 * zoom + pulse * 10, 0, Math.PI * 2);
                ctx.strokeStyle = '#EF4444' + Math.floor((1 - pulse) * 255).toString(16).padStart(2, '0');
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // Draw player position
        const playerMarker = markers.find(m => m.type === 'player');
        if (playerMarker) {
            const x = (playerMarker.position.x / 100) * width * zoom + pan.x;
            const y = (playerMarker.position.y / 100) * height * zoom + pan.y;
            
            ctx.beginPath();
            ctx.arc(x, y, 8 * zoom, 0, Math.PI * 2);
            ctx.fillStyle = '#22C55E';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

    }, [viewMode, zones, filteredMarkers, zoom, pan, showLabels]);

    // Handle canvas click
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / canvas.width) * 100;
        const y = ((e.clientY - rect.top) / canvas.height) * 100;

        // Check if clicked on a marker
        for (const marker of filteredMarkers) {
            const dx = marker.position.x - x;
            const dy = marker.position.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < 5) {
                setSelectedMarker(marker);
                onSelectMarker?.(marker.id);
                return;
            }
        }

        // Check if clicked on a zone
        for (const zone of zones) {
            const dx = zone.position.x - x;
            const dy = zone.position.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < zone.radius) {
                setSelectedZone(zone);
                onSelectZone?.(zone.id);
                return;
            }
        }

        setSelectedZone(null);
        setSelectedMarker(null);
    };

    // Render zone details panel
    const renderZoneDetails = () => {
        if (!selectedZone) return null;

        return (
            <div className="absolute right-4 top-16 w-72 bg-slate-800/95 rounded-lg border border-slate-600 p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white text-lg">{selectedZone.nameRu}</h3>
                    <button onClick={() => setSelectedZone(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                {selectedZone.corporationId && (
                    <div className="flex items-center gap-2 mb-3">
                        <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: planetService.getCorporationColor(selectedZone.corporationId) }}
                        />
                        <span className="text-slate-300">{planetService.getCorporationName(selectedZone.corporationId)}</span>
                    </div>
                )}

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Статус:</span>
                        <span className={`font-medium ${
                            selectedZone.status === 'stable' ? 'text-green-400' :
                            selectedZone.status === 'contested' ? 'text-yellow-400' :
                            selectedZone.status === 'under_attack' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                            {selectedZone.status === 'stable' ? '🟢 Стабильно' :
                             selectedZone.status === 'contested' ? '🟡 Оспаривается' :
                             selectedZone.status === 'under_attack' ? '🔴 Под атакой' : '⚫ Локдаун'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Влияние:</span>
                        <span className="text-white">{selectedZone.influence}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Население:</span>
                        <span className="text-white">{selectedZone.population}M</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Tech Level:</span>
                        <span className="text-cyan-400">{'⭐'.repeat(selectedZone.techLevel)}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-700">
                        <div className="text-slate-400 mb-1">Ресурсы:</div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                                <div className="text-blue-400">💾</div>
                                <div className="text-xs text-white">{selectedZone.resources.data}%</div>
                            </div>
                            <div className="text-center">
                                <div className="text-yellow-400">⚡</div>
                                <div className="text-xs text-white">{selectedZone.resources.energy}%</div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-400">🔧</div>
                                <div className="text-xs text-white">{selectedZone.resources.materials}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render marker details panel
    const renderMarkerDetails = () => {
        if (!selectedMarker) return null;

        return (
            <div className="absolute right-4 top-16 w-64 bg-slate-800/95 rounded-lg border border-slate-600 p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{selectedMarker.icon}</span>
                        <h3 className="font-bold text-white">{selectedMarker.name}</h3>
                    </div>
                    <button onClick={() => setSelectedMarker(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Тип:</span>
                        <span className="text-white">
                            {selectedMarker.type === 'lab' ? '🔬 Лаборатория' :
                             selectedMarker.type === 'corporation_hq' ? '🏢 Штаб-квартира' :
                             selectedMarker.type === 'conflict' ? '⚔️ Конфликт' :
                             selectedMarker.type === 'player' ? '👤 Игрок' : '📍 Точка'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Зона:</span>
                        <span className="text-white">
                            {zones.find(z => z.id === selectedMarker.zoneId)?.nameRu || 'N/A'}
                        </span>
                    </div>
                </div>

                {selectedMarker.type === 'conflict' && selectedMarker.data && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                        <div className="text-red-400 font-medium mb-2">Активный конфликт</div>
                        <div className="bg-slate-900 rounded p-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span>Прогресс</span>
                                <span>{selectedMarker.data.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div 
                                    className="bg-red-500 h-2 rounded-full transition-all"
                                    style={{ width: `${selectedMarker.data.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render stats view
    const renderStatsView = () => (
        <div className="p-4 space-y-4 overflow-y-auto h-full">
            <h2 className="text-xl font-bold text-white mb-4">📊 Статистика планеты</h2>
            
            {/* Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-cyan-400">{stats.totalZones}</div>
                    <div className="text-xs text-slate-400">Всего зон</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{stats.controlledZones}</div>
                    <div className="text-xs text-slate-400">Под контролем</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{stats.contestedZones}</div>
                    <div className="text-xs text-slate-400">Оспариваются</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-400">{stats.activeConflicts}</div>
                    <div className="text-xs text-slate-400">Конфликтов</div>
                </div>
            </div>

            {/* Corporation Control */}
            <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="font-bold text-white mb-3">🏢 Контроль корпораций</h3>
                <div className="space-y-3">
                    {Object.entries(stats.corporationControl).map(([corpId, count]) => {
                        const color = planetService.getCorporationColor(corpId as CorporationId);
                        const name = planetService.getCorporationName(corpId as CorporationId);
                        const percentage = Math.round((count / stats.totalZones) * 100);
                        
                        return (
                            <div key={corpId} className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-white flex-1">{name}</span>
                                <span className="text-slate-400">{count} зон</span>
                                <div className="w-24 bg-slate-700 rounded-full h-2">
                                    <div 
                                        className="h-2 rounded-full transition-all"
                                        style={{ width: `${percentage}%`, backgroundColor: color }}
                                    />
                                </div>
                                <span className="text-xs text-slate-400 w-10">{percentage}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Active Conflicts */}
            <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="font-bold text-white mb-3">⚔️ Активные конфликты</h3>
                {conflicts.length === 0 ? (
                    <p className="text-slate-400 text-sm">Нет активных конфликтов</p>
                ) : (
                    <div className="space-y-2">
                        {conflicts.map(conflict => {
                            const zone = zones.find(z => z.id === conflict.zoneId);
                            return (
                                <div key={conflict.id} className="bg-slate-900 rounded p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-white font-medium">{zone?.nameRu}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            conflict.intensity === 'critical' ? 'bg-red-900 text-red-300' :
                                            conflict.intensity === 'high' ? 'bg-orange-900 text-orange-300' :
                                            conflict.intensity === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                                            'bg-gray-700 text-gray-300'
                                        }`}>
                                            {conflict.intensity.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                        <span style={{ color: planetService.getCorporationColor(conflict.attackerId) }}>
                                            {planetService.getCorporationName(conflict.attackerId)}
                                        </span>
                                        <span>⚔️</span>
                                        <span style={{ color: planetService.getCorporationColor(conflict.defenderId) }}>
                                            {planetService.getCorporationName(conflict.defenderId)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                        <div 
                                            className="bg-red-500 h-2 rounded-full"
                                            style={{ width: `${conflict.progress}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Zone List */}
            <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="font-bold text-white mb-3">🌍 Все зоны</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {zones.map(zone => (
                        <div 
                            key={zone.id} 
                            className="flex items-center justify-between p-2 bg-slate-900 rounded hover:bg-slate-700 cursor-pointer"
                            onClick={() => {
                                setSelectedZone(zone);
                                setViewMode('map');
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: zone.corporationId ? planetService.getCorporationColor(zone.corporationId) : '#6B7280' }}
                                />
                                <span className="text-white text-sm">{zone.nameRu}</span>
                            </div>
                            <span className={`text-xs ${
                                zone.status === 'stable' ? 'text-green-400' :
                                zone.status === 'contested' ? 'text-yellow-400' :
                                zone.status === 'under_attack' ? 'text-red-400' : 'text-gray-400'
                            }`}>
                                {zone.status === 'stable' ? '●' : zone.status === 'contested' ? '◐' : '○'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950">
            {/* Header */}
            <div className="h-10 bg-slate-800 flex items-center px-4 justify-between border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🌍</span>
                    <span className="font-bold text-white">CyberNation Planet</span>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 bg-slate-800/50 border-b border-slate-700">
                {/* View Mode */}
                <div className="flex gap-1">
                    <button
                        onClick={() => setViewMode('map')}
                        className={`px-3 py-1 text-sm rounded ${viewMode === 'map' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        🗺️ Карта
                    </button>
                    <button
                        onClick={() => setViewMode('stats')}
                        className={`px-3 py-1 text-sm rounded ${viewMode === 'stats' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        📊 Статистика
                    </button>
                </div>

                <div className="flex-1" />

                {viewMode === 'map' && (
                    <>
                        {/* Filters */}
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value as any)}
                            className="bg-slate-700 text-white text-xs rounded px-2 py-1 border border-slate-600"
                        >
                            <option value="all">Все маркеры</option>
                            <option value="labs">🔬 Лаборатории</option>
                            <option value="hq">🏢 Штаб-квартиры</option>
                            <option value="conflicts">⚔️ Конфликты</option>
                        </select>

                        {/* Labels toggle */}
                        <button
                            onClick={() => setShowLabels(!showLabels)}
                            className={`px-2 py-1 text-xs rounded ${showLabels ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                        >
                            🏷️
                        </button>

                        {/* Zoom controls */}
                        <div className="flex gap-1">
                            <button
                                onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
                                className="w-6 h-6 bg-slate-700 text-white rounded hover:bg-slate-600"
                            >
                                -
                            </button>
                            <span className="text-xs text-slate-400 w-10 text-center py-1">{Math.round(zoom * 100)}%</span>
                            <button
                                onClick={() => setZoom(z => Math.min(2, z + 0.2))}
                                className="w-6 h-6 bg-slate-700 text-white rounded hover:bg-slate-600"
                            >
                                +
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 relative overflow-hidden" ref={containerRef}>
                {viewMode === 'map' && (
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={500}
                        className="w-full h-full cursor-crosshair"
                        onClick={handleCanvasClick}
                    />
                )}

                {viewMode === 'stats' && renderStatsView()}

                {/* Details panels */}
                {viewMode === 'map' && selectedZone && renderZoneDetails()}
                {viewMode === 'map' && selectedMarker && !selectedZone && renderMarkerDetails()}

                {/* Legend */}
                {viewMode === 'map' && (
                    <div className="absolute bottom-4 left-4 bg-slate-800/90 rounded-lg p-3 text-xs">
                        <div className="font-bold text-white mb-2">Легенда</div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-slate-300">Стабильная зона</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <span className="text-slate-300">Оспаривается</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-slate-300">Под атакой</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>🔬</span>
                                <span className="text-slate-300">Лаборатория</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>🏢</span>
                                <span className="text-slate-300">Штаб-квартира</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlanetApp;
