/**
 * LAYER 13: Planet Service
 * Планета CyberNation - визуализация зон влияния корпораций,
 * расположения лабораторий, активных конфликтов
 */

import { CorporationId } from '../types';

// === TYPES ===

export interface PlanetZone {
    id: string;
    name: string;
    nameRu: string;
    corporationId?: CorporationId;
    influence: number; // 0-100 корпоративное влияние
    color: string;
    position: { x: number; y: number }; // Центр зоны (0-100%)
    radius: number; // Радиус зоны (0-100%)
    population: number; // Население в миллионах
    techLevel: number; // 1-5 технологический уровень
    resources: {
        data: number;
        energy: number;
        materials: number;
    };
    status: 'stable' | 'contested' | 'under_attack' | 'lockdown';
}

export interface PlanetMarker {
    id: string;
    type: 'lab' | 'corporation_hq' | 'conflict' | 'event' | 'player';
    name: string;
    position: { x: number; y: number };
    icon: string;
    color: string;
    zoneId: string;
    data?: any;
}

export interface PlanetConflict {
    id: string;
    zoneId: string;
    attackerId: CorporationId;
    defenderId: CorporationId;
    progress: number; // 0-100
    startTime: number;
    intensity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PlanetEvent {
    id: string;
    type: 'blackout' | 'data_storm' | 'market_crash' | 'tech_boom' | 'cyber_attack';
    zoneId: string;
    name: string;
    description: string;
    duration: number; // ms
    startTime: number;
    effects: {
        influence?: number;
        resources?: { data?: number; energy?: number; materials?: number };
    };
}

// === DATA ===

const CORPORATION_COLORS: Record<CorporationId, string> = {
    titan: '#3B82F6',      // Blue
    novatek: '#10B981',    // Green
    cyberforge: '#8B5CF6', // Purple
    blacksun: '#EF4444',   // Red
    orbitron: '#F59E0B',   // Amber
    ang_vers: '#EC4899'    // Pink (S-Tier)
};

const CORPORATION_NAMES: Record<CorporationId, string> = {
    titan: 'TITAN Corp',
    novatek: 'NovaTek',
    cyberforge: 'CyberForge',
    blacksun: 'Black Sun',
    orbitron: 'Orbitron',
    ang_vers: 'ANG Vers'
};

const INITIAL_ZONES: PlanetZone[] = [
    {
        id: 'neo_tokyo',
        name: 'Neo-Tokyo',
        nameRu: 'Нео-Токио',
        corporationId: 'titan',
        influence: 75,
        color: '#3B82F6',
        position: { x: 78, y: 35 },
        radius: 12,
        population: 45,
        techLevel: 5,
        resources: { data: 95, energy: 80, materials: 60 },
        status: 'stable'
    },
    {
        id: 'silicon_valley',
        name: 'Silicon Valley',
        nameRu: 'Силиконовая Долина',
        corporationId: 'novatek',
        influence: 85,
        color: '#10B981',
        position: { x: 15, y: 40 },
        radius: 10,
        population: 12,
        techLevel: 5,
        resources: { data: 100, energy: 70, materials: 40 },
        status: 'stable'
    },
    {
        id: 'berlin_nexus',
        name: 'Berlin Nexus',
        nameRu: 'Берлинский Нексус',
        corporationId: 'cyberforge',
        influence: 65,
        color: '#8B5CF6',
        position: { x: 48, y: 30 },
        radius: 9,
        population: 18,
        techLevel: 4,
        resources: { data: 75, energy: 85, materials: 70 },
        status: 'contested'
    },
    {
        id: 'singapore_hub',
        name: 'Singapore Hub',
        nameRu: 'Сингапурский Хаб',
        corporationId: 'orbitron',
        influence: 70,
        color: '#F59E0B',
        position: { x: 72, y: 55 },
        radius: 8,
        population: 8,
        techLevel: 5,
        resources: { data: 90, energy: 60, materials: 50 },
        status: 'stable'
    },
    {
        id: 'moscow_grid',
        name: 'Moscow Grid',
        nameRu: 'Московская Сеть',
        corporationId: 'blacksun',
        influence: 80,
        color: '#EF4444',
        position: { x: 55, y: 25 },
        radius: 11,
        population: 25,
        techLevel: 4,
        resources: { data: 70, energy: 95, materials: 85 },
        status: 'stable'
    },
    {
        id: 'shanghai_core',
        name: 'Shanghai Core',
        nameRu: 'Шанхайское Ядро',
        corporationId: 'ang_vers',
        influence: 90,
        color: '#EC4899',
        position: { x: 75, y: 42 },
        radius: 13,
        population: 55,
        techLevel: 5,
        resources: { data: 85, energy: 90, materials: 75 },
        status: 'stable'
    },
    {
        id: 'dubai_oasis',
        name: 'Dubai Oasis',
        nameRu: 'Дубайский Оазис',
        position: { x: 58, y: 48 },
        radius: 7,
        influence: 40,
        color: '#6B7280',
        population: 6,
        techLevel: 4,
        resources: { data: 50, energy: 100, materials: 30 },
        status: 'contested'
    },
    {
        id: 'sao_paulo_sprawl',
        name: 'São Paulo Sprawl',
        nameRu: 'Сан-Паулу Спроул',
        position: { x: 28, y: 65 },
        radius: 10,
        influence: 35,
        color: '#6B7280',
        population: 35,
        techLevel: 3,
        resources: { data: 45, energy: 55, materials: 80 },
        status: 'under_attack'
    },
    {
        id: 'lagos_network',
        name: 'Lagos Network',
        nameRu: 'Лагосская Сеть',
        position: { x: 45, y: 58 },
        radius: 8,
        influence: 25,
        color: '#6B7280',
        population: 28,
        techLevel: 3,
        resources: { data: 40, energy: 45, materials: 90 },
        status: 'stable'
    },
    {
        id: 'sydney_arc',
        name: 'Sydney Arc',
        nameRu: 'Сиднейская Дуга',
        position: { x: 85, y: 72 },
        radius: 7,
        influence: 55,
        color: '#6B7280',
        population: 9,
        techLevel: 4,
        resources: { data: 65, energy: 70, materials: 55 },
        status: 'stable'
    }
];

// === SERVICE ===

class PlanetService {
    private zones: PlanetZone[] = [];
    private markers: PlanetMarker[] = [];
    private conflicts: PlanetConflict[] = [];
    private events: PlanetEvent[] = [];

    constructor() {
        this.initializeZones();
        this.generateMarkers();
        this.generateConflicts();
    }

    private initializeZones(): void {
        this.zones = JSON.parse(JSON.stringify(INITIAL_ZONES));
    }

    private generateMarkers(): void {
        // Add corporation HQs
        this.zones.forEach(zone => {
            if (zone.corporationId) {
                this.markers.push({
                    id: `hq_${zone.corporationId}`,
                    type: 'corporation_hq',
                    name: `${CORPORATION_NAMES[zone.corporationId]} HQ`,
                    position: { ...zone.position },
                    icon: '🏢',
                    color: CORPORATION_COLORS[zone.corporationId],
                    zoneId: zone.id
                });
            }
        });

        // Add lab markers (from labService data conceptually)
        const labLocations = [
            { id: 'lab_1', name: 'Quantum Research Lab', zoneId: 'neo_tokyo', icon: '⚛️', offset: { x: -3, y: 2 } },
            { id: 'lab_2', name: 'AI Development Center', zoneId: 'silicon_valley', icon: '🤖', offset: { x: 2, y: -2 } },
            { id: 'lab_3', name: 'CyberSec Fortress', zoneId: 'berlin_nexus', icon: '🛡️', offset: { x: -2, y: 3 } },
            { id: 'lab_4', name: 'BioTech Facility', zoneId: 'singapore_hub', icon: '🧬', offset: { x: 1, y: -1 } },
            { id: 'lab_5', name: 'Manufacturing Plant', zoneId: 'moscow_grid', icon: '🏭', offset: { x: -1, y: 2 } },
            { id: 'lab_6', name: 'Neural Interface Lab', zoneId: 'shanghai_core', icon: '🧠', offset: { x: 3, y: 1 } },
            { id: 'lab_7', name: 'Data Mining Center', zoneId: 'dubai_oasis', icon: '💾', offset: { x: 0, y: 2 } },
            { id: 'lab_8', name: 'Energy Research', zoneId: 'sao_paulo_sprawl', icon: '⚡', offset: { x: 2, y: 0 } }
        ];

        labLocations.forEach(lab => {
            const zone = this.zones.find(z => z.id === lab.zoneId);
            if (zone) {
                this.markers.push({
                    id: lab.id,
                    type: 'lab',
                    name: lab.name,
                    position: {
                        x: zone.position.x + lab.offset.x,
                        y: zone.position.y + lab.offset.y
                    },
                    icon: lab.icon,
                    color: '#06B6D4',
                    zoneId: lab.zoneId
                });
            }
        });
    }

    private generateConflicts(): void {
        // Add some initial conflicts
        this.conflicts = [
            {
                id: 'conflict_1',
                zoneId: 'berlin_nexus',
                attackerId: 'titan',
                defenderId: 'cyberforge',
                progress: 35,
                startTime: Date.now() - 3600000,
                intensity: 'medium'
            },
            {
                id: 'conflict_2',
                zoneId: 'sao_paulo_sprawl',
                attackerId: 'blacksun',
                defenderId: 'novatek',
                progress: 60,
                startTime: Date.now() - 7200000,
                intensity: 'high'
            }
        ];

        // Add conflict markers
        this.conflicts.forEach(conflict => {
            const zone = this.zones.find(z => z.id === conflict.zoneId);
            if (zone) {
                this.markers.push({
                    id: `conflict_marker_${conflict.id}`,
                    type: 'conflict',
                    name: `${CORPORATION_NAMES[conflict.attackerId]} vs ${CORPORATION_NAMES[conflict.defenderId]}`,
                    position: { x: zone.position.x + 2, y: zone.position.y - 2 },
                    icon: '⚔️',
                    color: '#EF4444',
                    zoneId: zone.id,
                    data: conflict
                });
            }
        });
    }

    // === PUBLIC API ===

    getZones(): PlanetZone[] {
        return this.zones;
    }

    getZone(id: string): PlanetZone | undefined {
        return this.zones.find(z => z.id === id);
    }

    getMarkers(): PlanetMarker[] {
        return this.markers;
    }

    getMarkersByZone(zoneId: string): PlanetMarker[] {
        return this.markers.filter(m => m.zoneId === zoneId);
    }

    getMarkersByType(type: PlanetMarker['type']): PlanetMarker[] {
        return this.markers.filter(m => m.type === type);
    }

    getConflicts(): PlanetConflict[] {
        return this.conflicts;
    }

    getActiveConflicts(): PlanetConflict[] {
        return this.conflicts.filter(c => c.progress < 100);
    }

    getEvents(): PlanetEvent[] {
        return this.events;
    }

    getActiveEvents(): PlanetEvent[] {
        const now = Date.now();
        return this.events.filter(e => now < e.startTime + e.duration);
    }

    // Get zones by corporation
    getZonesByCorporation(corpId: CorporationId): PlanetZone[] {
        return this.zones.filter(z => z.corporationId === corpId);
    }

    // Get independent (neutral) zones
    getIndependentZones(): PlanetZone[] {
        return this.zones.filter(z => !z.corporationId);
    }

    // Get contested zones
    getContestedZones(): PlanetZone[] {
        return this.zones.filter(z => z.status === 'contested' || z.status === 'under_attack');
    }

    // Get total influence for a corporation
    getCorporationInfluence(corpId: CorporationId): number {
        const corpZones = this.getZonesByCorporation(corpId);
        if (corpZones.length === 0) return 0;
        return Math.round(corpZones.reduce((sum, z) => sum + z.influence, 0) / corpZones.length);
    }

    // Get planet statistics
    getPlanetStats(): {
        totalZones: number;
        controlledZones: number;
        contestedZones: number;
        activeConflicts: number;
        activeEvents: number;
        corporationControl: Record<CorporationId, number>;
    } {
        const corpControl: Partial<Record<CorporationId, number>> = {};
        this.zones.forEach(z => {
            if (z.corporationId) {
                corpControl[z.corporationId] = (corpControl[z.corporationId] || 0) + 1;
            }
        });

        return {
            totalZones: this.zones.length,
            controlledZones: this.zones.filter(z => z.corporationId).length,
            contestedZones: this.getContestedZones().length,
            activeConflicts: this.getActiveConflicts().length,
            activeEvents: this.getActiveEvents().length,
            corporationControl: corpControl as Record<CorporationId, number>
        };
    }

    // Update player marker position
    setPlayerPosition(x: number, y: number, username: string): void {
        const existingPlayer = this.markers.find(m => m.type === 'player');
        const nearestZone = this.findNearestZone(x, y);
        
        if (existingPlayer) {
            existingPlayer.position = { x, y };
            existingPlayer.name = username;
            existingPlayer.zoneId = nearestZone?.id || '';
        } else {
            this.markers.push({
                id: 'player_marker',
                type: 'player',
                name: username,
                position: { x, y },
                icon: '👤',
                color: '#22C55E',
                zoneId: nearestZone?.id || ''
            });
        }
    }

    // Find nearest zone to a point
    private findNearestZone(x: number, y: number): PlanetZone | undefined {
        let nearest: PlanetZone | undefined;
        let minDist = Infinity;

        this.zones.forEach(zone => {
            const dx = zone.position.x - x;
            const dy = zone.position.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = zone;
            }
        });

        return nearest;
    }

    // Simulate conflict progress
    simulateConflicts(): void {
        this.conflicts.forEach(conflict => {
            if (conflict.progress < 100) {
                const progressRate = conflict.intensity === 'critical' ? 5 :
                    conflict.intensity === 'high' ? 3 :
                    conflict.intensity === 'medium' ? 2 : 1;
                conflict.progress = Math.min(100, conflict.progress + progressRate);
            }
        });
    }

    // Get corporation color
    getCorporationColor(corpId: CorporationId): string {
        return CORPORATION_COLORS[corpId];
    }

    // Get corporation name
    getCorporationName(corpId: CorporationId): string {
        return CORPORATION_NAMES[corpId];
    }
}

// Singleton instance
export const planetService = new PlanetService();
export default planetService;
