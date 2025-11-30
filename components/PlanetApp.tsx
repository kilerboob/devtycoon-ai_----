/**
 * LAYER 13: PlanetApp Component
 * Визуализация планеты CyberNation
 * Зоны влияния корпораций, лаборатории, конфликты
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { planetService, PlanetZone, PlanetMarker, PlanetConflict } from '../services/planetService';
import { GameState, CorporationId } from '../types';

// Corporation colors for legend
const CORPORATION_COLORS: Record<CorporationId, string> = {
    titan: '#3B82F6',      // Blue
    novatek: '#10B981',    // Green
    cyberforge: '#8B5CF6', // Purple
    blacksun: '#EF4444',   // Red
    orbitron: '#F59E0B',   // Amber
    ang_vers: '#EC4899'    // Pink
};

interface PlanetAppProps {
    state: GameState;
    onClose: () => void;
    onSelectZone?: (zoneId: string) => void;
    onSelectMarker?: (markerId: string) => void;
}

type ViewMode = 'globe' | 'stats';

export const PlanetApp: React.FC<PlanetAppProps> = ({ state, onClose, onSelectZone, onSelectMarker }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('globe');
    const [selectedZone, setSelectedZone] = useState<PlanetZone | null>(null);
    const [selectedMarker, setSelectedMarker] = useState<PlanetMarker | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [showLabels, setShowLabels] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'labs' | 'hq' | 'conflicts'>('all');
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const globeCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [zones, setZones] = useState<PlanetZone[]>(planetService.getZones());
    const [markers, setMarkers] = useState<PlanetMarker[]>(planetService.getMarkers());
    const [conflicts, setConflicts] = useState<PlanetConflict[]>(planetService.getActiveConflicts());
    const [stats, setStats] = useState(planetService.getPlanetStats());

    // Subscribe to service updates
    useEffect(() => {
        const unsub = planetService.subscribe(() => {
            setZones(planetService.getZones());
            setMarkers(planetService.getMarkers());
            setConflicts(planetService.getActiveConflicts());
            setStats(planetService.getPlanetStats());
        });
        const interval = setInterval(() => planetService.advanceTime(), 1000);
        return () => { clearInterval(interval); unsub(); };
    }, []);

    // Filter markers based on filter type
    const filteredMarkers = useMemo(() => {
        if (filterType === 'all') return markers;
        if (filterType === 'labs') return markers.filter(m => m.type === 'lab');
        if (filterType === 'hq') return markers.filter(m => m.type === 'corporation_hq');
        if (filterType === 'conflicts') return markers.filter(m => m.type === 'conflict');
        return markers;
    }, [markers, filterType]);

    // 3D Globe rendering with Three.js
    useEffect(() => {
        if (viewMode !== 'globe') return;
        
        const canvas = globeCanvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Limit pixel ratio to reduce sub-pixel shimmer on high-DPI displays
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Improve visual stability and reduce shimmer
    // @ts-ignore
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping as any;
    renderer.toneMappingExposure = 1.4; // Brighter exposure for daytime visibility

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a1622);

        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 0, 6);

    // Lights: brighter ambient + strong directional "sun" for day/night cycle
    const ambient = new THREE.AmbientLight(0x607080, 0.8); // Brighter ambient for better visibility
    scene.add(ambient);
    
    // Sun light - will rotate around planet for day/night cycle
    const sunLight = new THREE.DirectionalLight(0xffffee, 2.5); // Bright warm sunlight
    sunLight.position.set(5, 2, 5);
    sunLight.castShadow = false;
    scene.add(sunLight);
    
    // Secondary fill light for softer shadows
    const fillLight = new THREE.DirectionalLight(0xaaccff, 0.6);
    fillLight.position.set(-3, 1, 2);
    scene.add(fillLight);
    
    // Subtle blue light on night side (moonlight/city glow effect)
    const nightLight = new THREE.DirectionalLight(0x4060ff, 0.25);
    nightLight.position.set(-5, -2, -5);
    scene.add(nightLight);
    
    // Track time for day/night cycle
    let sunAngle = 0;

    // Globe with optional Earth textures (place files in public/: earth_day.jpg, earth_night.jpg, earth_clouds.png)
    // Higher segment count for smoother surface and less aliasing
        const globeGeom = new THREE.SphereGeometry(2, 128, 128);
    
    // Create globe immediately with a basic material that shows well before textures load
    let globeMat: any = new THREE.MeshPhongMaterial({ 
        color: 0x5090b0, // Brighter base color
        shininess: 20, 
        specular: 0x556677,
        emissive: 0x152535, // Slight self-illumination
        emissiveIntensity: 0.2
    });
    let globe: any = new THREE.Mesh(globeGeom, globeMat);
    scene.add(globe);
    
    // Clouds layer - create immediately with procedural clouds
    const cloudsGeom = new THREE.SphereGeometry(2.04, 64, 64);
    const createProceduralClouds = () => {
        const w = 1024, h = 512;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'transparent';
        ctx.clearRect(0, 0, w, h);
        
        // Create cloud-like noise pattern
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            // More clouds near equator and middle latitudes
            const latFactor = Math.abs(y / h - 0.5) * 2;
            if (Math.random() > 0.3 + latFactor * 0.5) {
                const size = 2 + Math.random() * 8;
                const alpha = 0.1 + Math.random() * 0.3;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fill();
            }
        }
        
        // Add some larger cloud formations
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * w;
            const y = h * 0.2 + Math.random() * h * 0.6; // Concentrate in middle
            const size = 20 + Math.random() * 40;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.flipY = false;
        tex.premultiplyAlpha = false;
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        return tex;
    };
    
    const cloudsMat = new THREE.MeshPhongMaterial({ 
        map: createProceduralClouds(), 
        transparent: true, 
        opacity: 0.45, 
        depthWrite: false,
        side: THREE.FrontSide
    });
    let clouds: any = new THREE.Mesh(cloudsGeom, cloudsMat);
    scene.add(clouds);
    
        const textureLoader = new THREE.TextureLoader();
        const tryLoad = (url: string, onSuccess: (tex: any) => void, onFail: () => void) => {
            textureLoader.load(url, (tex: any) => {
                // Disable flipY and premultiplyAlpha to avoid WebGL 3D texture errors
                tex.flipY = false;
                tex.premultiplyAlpha = false;
                tex.colorSpace = THREE.SRGBColorSpace as any;
                tex.generateMipmaps = false;
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.wrapS = THREE.ClampToEdgeWrapping;
                tex.wrapT = THREE.ClampToEdgeWrapping;
                tex.anisotropy = 1; // Minimal to avoid issues
                onSuccess(tex);
            }, undefined, onFail);
        };

        const onTexSuccess = (tex: any) => {
            // Update existing globe's material with loaded texture
            if (globe && globe.material) {
                globe.material.map = tex;
                globe.material.needsUpdate = true;
            }
            console.info('Earth texture applied:', tex);
            // After base map, try apply specular (oceans gloss)
            tryLoad('/earth_spec.jpg', (spec: any) => {
                try { spec.colorSpace = THREE.SRGBColorSpace as any; } catch {}
                spec.generateMipmaps = false;
                spec.minFilter = THREE.LinearFilter;
                spec.magFilter = THREE.LinearFilter;
                spec.wrapS = THREE.ClampToEdgeWrapping;
                spec.wrapT = THREE.ClampToEdgeWrapping;
                spec.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
                if (globe?.material) {
                    globe.material.specularMap = spec;
                    globe.material.shininess = 24; // slightly higher shininess for oceans
                    globe.material.needsUpdate = true;
                    console.info('Earth specular map applied');
                }
            }, () => {});
            // Also apply optional night lights
            applyNight(globe);
        };
        const createProceduralEarthTextures = () => {
            // Generate simple day texture with oceans and continents
            const w = 1024, h = 512;
            const day = document.createElement('canvas'); day.width = w; day.height = h;
            const dctx = day.getContext('2d')!;
            // Ocean gradient
            const og = dctx.createLinearGradient(0, 0, 0, h);
            og.addColorStop(0, '#0a2a44'); og.addColorStop(1, '#0e3b59');
            dctx.fillStyle = og; dctx.fillRect(0, 0, w, h);
            // Stylized continents (polygons) in equirectangular space
            const poly = (pts: Array<[number, number]>, fill: string) => {
                dctx.beginPath();
                pts.forEach(([lon, lat], i) => {
                    const x = ((lon + 180) / 360) * w;
                    const y = ((90 - lat) / 180) * h;
                    if (i === 0) dctx.moveTo(x, y); else dctx.lineTo(x, y);
                });
                dctx.closePath();
                dctx.fillStyle = fill; dctx.fill();
                dctx.strokeStyle = '#0c3b50'; dctx.lineWidth = 1; dctx.stroke();
            };
            // Rough landmasses
            poly([[-160,40],[-150,55],[-120,50],[-120,35],[-140,30]], '#2d5a27'); // North America west
            poly([[-80,40],[-60,50],[-20,55],[10,50],[-10,40],[-40,35]], '#2d5a27'); // Europe
            poly([[40,40],[80,45],[120,50],[120,20],[80,20],[50,30]], '#2d5a27'); // Asia
            poly([[-70,-10],[-60,-20],[-50,-25],[-40,-20],[-50,-5]], '#2d5a27'); // Africa north-west
            poly([[-50,-5],[-40,-15],[-20,-25],[0,-30],[-10,-5]], '#2d5a27'); // Africa east
            poly([[-60,-40],[-50,-50],[-30,-55],[-20,-45],[-40,-35]], '#2d5a27'); // South America
            poly([[130,-20],[140,-30],[160,-35],[170,-25],[160,-15]], '#2d5a27'); // Australia
            // Subtle shore highlight
            dctx.globalCompositeOperation = 'overlay';
            dctx.fillStyle = 'rgba(255,255,255,0.04)';
            dctx.fillRect(0, 0, w, h);
            dctx.globalCompositeOperation = 'source-over';

            // Night lights (simple starfield over land)
            const night = document.createElement('canvas'); night.width = w; night.height = h;
            const nctx = night.getContext('2d')!;
            nctx.fillStyle = '#000'; nctx.fillRect(0, 0, w, h);
            nctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 4000; i++) {
                const x = Math.random() * w; const y = Math.random() * h;
                const bright = Math.random() < 0.7;
                nctx.fillStyle = bright ? 'rgba(255,220,160,0.8)' : 'rgba(180,160,255,0.6)';
                nctx.fillRect(x, y, 1, 1);
            }

            // Clouds noise
            const clouds = document.createElement('canvas'); clouds.width = w; clouds.height = h;
            const cctx = clouds.getContext('2d')!;
            const imgData = cctx.createImageData(w, h);
            for (let i = 0; i < imgData.data.length; i += 4) {
                const v = Math.random() * 255;
                imgData.data[i] = 255; // white
                imgData.data[i + 1] = 255;
                imgData.data[i + 2] = 255;
                imgData.data[i + 3] = v < 230 ? 0 : 60; // sparse alpha
            }
            cctx.putImageData(imgData, 0, 0);
            cctx.globalAlpha = 0.35; // overall transparency

            // Create textures with settings that avoid FLIP_Y/PREMULTIPLY_ALPHA errors
            const createSafeTexture = (canvas: HTMLCanvasElement) => {
                const tex = new THREE.CanvasTexture(canvas);
                tex.flipY = false; // Disable flipY to avoid WebGL errors
                tex.premultiplyAlpha = false; // Disable premultiply to avoid WebGL errors
                tex.generateMipmaps = false; // Disable mipmaps for canvas textures
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.wrapS = THREE.ClampToEdgeWrapping;
                tex.wrapT = THREE.ClampToEdgeWrapping;
                try { tex.colorSpace = THREE.SRGBColorSpace as any; } catch {}
                tex.needsUpdate = true;
                return tex;
            };

            return {
                day: createSafeTexture(day),
                night: createSafeTexture(night),
                clouds: createSafeTexture(clouds)
            };
        };

        const onTexFail = () => {
            // Procedural textures fallback - update existing globe's material
            const proc = createProceduralEarthTextures();
            if (globe && globe.material) {
                globe.material.map = proc.day;
                // @ts-ignore
                globe.material.emissive = new THREE.Color(0x111111);
                // @ts-ignore
                globe.material.emissiveMap = proc.night;
                // @ts-ignore
                globe.material.emissiveIntensity = 0.7;
                globe.material.needsUpdate = true;
            }
            // Clouds layer
            const cloudsGeom2 = new THREE.SphereGeometry(2.03, 64, 64);
            const cloudsMat = new THREE.MeshPhongMaterial({ map: proc.clouds, transparent: true, opacity: 0.35, depthWrite: false });
            clouds = new THREE.Mesh(cloudsGeom2, cloudsMat);
            scene.add(clouds);
            console.warn('Applied procedural Earth textures (no external files found).');
        };

        // Try multiple common paths for Vite setups (day map)
        tryLoad('/earth_day.jpg', onTexSuccess, () => {
            tryLoad('/earth.jpg', onTexSuccess, () => {
                tryLoad('/assets/earth.jpg', onTexSuccess, () => {
                    tryLoad('../assets/earth.jpg', onTexSuccess, onTexFail);
                });
            });
        });

        // Optional: Night lights (emissive)
        const applyNight = (mesh: any) => {
            tryLoad('/earth_night.jpg', (night: any) => {
            try { night.colorSpace = THREE.SRGBColorSpace as any; } catch {}
            night.flipY = false;
            night.premultiplyAlpha = false;
            night.generateMipmaps = false;
            night.minFilter = THREE.LinearFilter;
            night.magFilter = THREE.LinearFilter;
            if (mesh?.material) {
                mesh.material.emissive = new THREE.Color(0x222222);
                mesh.material.emissiveMap = night;
                mesh.material.emissiveIntensity = 0.8;
                mesh.material.needsUpdate = true;
                console.info('Earth night emissive applied');
            }
            }, () => {});
        };

        // Try to load real clouds texture, update existing clouds mesh
        // Cloud textures are grayscale where white = cloud, black = clear
        const applyCloudsTexture = (cloudsTex: any) => {
            try { cloudsTex.colorSpace = THREE.SRGBColorSpace as any; } catch {}
            cloudsTex.flipY = false;
            cloudsTex.premultiplyAlpha = false;
            cloudsTex.generateMipmaps = false;
            cloudsTex.minFilter = THREE.LinearFilter;
            cloudsTex.magFilter = THREE.LinearFilter;
            if (clouds && clouds.material) {
                // Use texture as both map and alpha (white = opaque cloud)
                clouds.material.map = cloudsTex;
                clouds.material.alphaMap = cloudsTex;
                clouds.material.transparent = true;
                clouds.material.opacity = 0.9;
                clouds.material.needsUpdate = true;
                console.info('Real clouds texture applied');
            }
        };
        
        tryLoad('/earth_clouds.jpg', applyCloudsTexture, () => {
            tryLoad('/earth_clouds.png', applyCloudsTexture, () => {
                console.info('Using procedural clouds');
            });
        });

        // Atmosphere subtle glow
        const atmGeom = new THREE.SphereGeometry(2.05, 64, 64);
        const atmMat = new THREE.MeshBasicMaterial({ color: 0x6fb1d6, transparent: true, opacity: 0.08 });
        const atmosphere = new THREE.Mesh(atmGeom, atmMat);
        scene.add(atmosphere);

        // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
    // Allow closer zoom so you can approach markers via scroll
    controls.minDistance = 2.5;
    controls.maxDistance = 10;

        // Convert marker lat/long-like 0-100 positions to globe coordinates
        // Convert marker position to sphere coordinates (slightly above surface for markers)
        const toSpherePos = (px: number, py: number, radiusOffset: number = 0.02) => {
            const lon = (px / 100) * 360 - 180; // -180..180
            const lat = 90 - (py / 100) * 180;  // 90..-90
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            const r = 2 + radiusOffset; // Globe radius is 2, add offset to be above surface
            return new THREE.Vector3(
                -r * Math.sin(phi) * Math.cos(theta),
                r * Math.cos(phi),
                r * Math.sin(phi) * Math.sin(theta)
            );
        };

        // Zone visualization group (rings around cities)
        const zoneGroup = new THREE.Group();
        if (globe) {
            globe.add(zoneGroup);
        } else {
            scene.add(zoneGroup);
        }

        // Create rainbow ring texture for beautiful zone visualization
        const createRainbowRingTexture = (statusColor: string, corpColor: string) => {
            const size = 128;
            const cnv = document.createElement('canvas');
            cnv.width = size; cnv.height = size;
            const ctx = cnv.getContext('2d')!;
            
            const cx = size / 2;
            const cy = size / 2;
            const outerR = size / 2 - 2;
            const innerR = size / 2 - 18;
            
            // Create rainbow/gradient ring
            for (let angle = 0; angle < 360; angle++) {
                const rad = (angle * Math.PI) / 180;
                const nextRad = ((angle + 2) * Math.PI) / 180;
                
                // Rainbow hue shift based on angle
                const hue = (angle + 180) % 360;
                
                ctx.beginPath();
                ctx.arc(cx, cy, outerR, rad, nextRad);
                ctx.arc(cx, cy, innerR, nextRad, rad, true);
                ctx.closePath();
                
                // Blend rainbow with status color
                ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.7)`;
                ctx.fill();
            }
            
            // Inner glow with status color
            const innerGlow = ctx.createRadialGradient(cx, cy, innerR - 5, cx, cy, innerR);
            innerGlow.addColorStop(0, 'transparent');
            innerGlow.addColorStop(1, statusColor + 'aa');
            ctx.beginPath();
            ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
            ctx.fillStyle = innerGlow;
            ctx.fill();
            
            // Outer glow with corp color
            const outerGlow = ctx.createRadialGradient(cx, cy, outerR, cx, cy, outerR + 8);
            outerGlow.addColorStop(0, corpColor + 'cc');
            outerGlow.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(cx, cy, outerR + 8, 0, Math.PI * 2);
            ctx.arc(cx, cy, outerR, 0, Math.PI * 2, true);
            ctx.fillStyle = outerGlow;
            ctx.fill();
            
            const tex = new THREE.CanvasTexture(cnv);
            tex.flipY = false;
            tex.premultiplyAlpha = false;
            tex.generateMipmaps = false;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            try { tex.colorSpace = THREE.SRGBColorSpace as any; } catch {}
            tex.needsUpdate = true;
            return tex;
        };

        // Create zone visualization (glowing rainbow rings on globe surface)
        zones.forEach(zone => {
            // Use larger radius offset for zones to be clearly above the surface
            const pos = toSpherePos(zone.position.x, zone.position.y, 0.08);
            
            // Zone status color (hex string)
            const statusColors: Record<string, string> = {
                'stable': '#22c55e',      // green
                'contested': '#eab308',   // yellow
                'under_attack': '#ef4444', // red
                'lockdown': '#6366f1'     // indigo
            };
            const statusColor = statusColors[zone.status] || '#22c55e';
            
            // Corporation color
            const corpColor = zone.corporationId ? 
                CORPORATION_COLORS[zone.corporationId] : 
                '#6b7280';
            
            // Ring size based on zone radius
            const ringSize = 0.15 + (zone.radius / 100) * 0.2;
            
            // Create sprite with rainbow ring texture
            const ringTex = createRainbowRingTexture(statusColor, corpColor);
            const spriteMat = new THREE.SpriteMaterial({
                map: ringTex,
                transparent: true,
                opacity: 0.85,
                depthTest: true,
                depthWrite: false
            });
            const ringSprite = new THREE.Sprite(spriteMat);
            ringSprite.position.copy(pos);
            ringSprite.scale.set(ringSize, ringSize, 1);
            
            // Store zone data for raycasting
            ringSprite.userData = { zone };
            zoneGroup.add(ringSprite);
            
            // Pulsing animation for contested/under_attack zones
            if (zone.status === 'contested' || zone.status === 'under_attack') {
                ringSprite.userData.pulse = true;
                ringSprite.userData.baseScale = ringSize;
            }
        });

        // Event/marker sprites
        const markerGroup = new THREE.Group();
        // Attach markers to globe so they rotate with the planet
        if (globe) {
            globe.add(markerGroup);
        } else {
            scene.add(markerGroup);
        }

        // Helper: create a texture from a small canvas with emoji/icon string
        const makeIconTexture = (icon: string, bgColor?: string) => {
            const size = 64;
            const cnv = document.createElement('canvas');
            cnv.width = size; cnv.height = size;
            const c = cnv.getContext('2d')!;
            c.clearRect(0, 0, size, size);
            
            // Draw circular background for visibility
            if (bgColor) {
                c.beginPath();
                c.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
                c.fillStyle = bgColor;
                c.fill();
                c.strokeStyle = 'rgba(255,255,255,0.8)';
                c.lineWidth = 2;
                c.stroke();
            }
            
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.font = '36px "Segoe UI Emoji", system-ui, sans-serif';
            c.fillStyle = '#ffffff';
            c.fillText(icon || '📍', size / 2, size / 2);
            const tex = new THREE.CanvasTexture(cnv);
            // Avoid FLIP_Y/PREMULTIPLY_ALPHA WebGL errors
            tex.flipY = false;
            tex.premultiplyAlpha = false;
            tex.generateMipmaps = false;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            try { tex.colorSpace = THREE.SRGBColorSpace as any; } catch {}
            tex.needsUpdate = true;
            return tex;
        };
        
        // Type-specific background colors for markers
        const markerBgColors: Record<string, string> = {
            'lab': 'rgba(6, 182, 212, 0.85)',        // cyan
            'corporation_hq': 'rgba(139, 92, 246, 0.85)', // purple
            'conflict': 'rgba(239, 68, 68, 0.85)',   // red
            'event': 'rgba(249, 115, 22, 0.85)',     // orange
            'player': 'rgba(34, 197, 94, 0.85)'      // green
        };
        
        filteredMarkers.forEach(m => {
            const pos = toSpherePos(m.position.x, m.position.y);
            const bgColor = markerBgColors[m.type] || 'rgba(100, 116, 139, 0.85)';
            const spriteMat = new THREE.SpriteMaterial({ 
                map: makeIconTexture(m.icon, bgColor),
                color: 0xffffff,
                sizeAttenuation: false,
                depthTest: false,
                transparent: true,
                opacity: 1.0
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.copy(pos);
            // Larger size for better visibility
            sprite.scale.set(0.06, 0.06, 0.06);
            // Attach metadata
            // @ts-ignore
            sprite.userData = { marker: m };
            markerGroup.add(sprite);
        });

        // Raycaster for clicks
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const onClick = (ev: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);
            raycaster.setFromCamera(mouse, camera);
            
            // First check markers (higher priority)
            const markerHits = raycaster.intersectObjects(markerGroup.children);
            if (markerHits.length > 0) {
                const obj: any = markerHits[0].object;
                const m = obj?.userData?.marker as PlanetMarker;
                if (m) {
                    setSelectedZone(null);
                    setSelectedMarker(m);
                    onSelectMarker?.(m.id);
                    return;
                }
            }
            
            // Then check zones
            const zoneHits = raycaster.intersectObjects(zoneGroup.children);
            if (zoneHits.length > 0) {
                const obj: any = zoneHits[0].object;
                const z = obj?.userData?.zone as PlanetZone;
                if (z) {
                    setSelectedMarker(null);
                    setSelectedZone(z);
                    onSelectZone?.(z.id);
                    return;
                }
            }
            
            // Click on empty space - deselect
            setSelectedZone(null);
            setSelectedMarker(null);
        };
        renderer.domElement.addEventListener('click', onClick);
        // Marker hover tooltip (DOM overlay)
        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.background = 'rgba(15,23,42,0.9)';
        tooltip.style.border = '1px solid #334155';
        tooltip.style.color = '#e5e7eb';
        tooltip.style.fontSize = '12px';
        tooltip.style.padding = '4px 6px';
        tooltip.style.borderRadius = '6px';
        tooltip.style.transform = 'translate(-50%, -120%)';
        tooltip.style.display = 'none';
        container.appendChild(tooltip);

        const formatTooltipHtml = (m: PlanetMarker) => {
            const zone = zones.find(z => z.id === m.zoneId);
            const corpName = zone?.corporationId ? planetService.getCorporationName(zone.corporationId) : 'Независимая зона';
            const corpColor = zone?.corporationId ? planetService.getCorporationColor(zone.corporationId) : '#6B7280';
            const isCapital = zone?.nameRu?.toLowerCase().includes('столица') || m.name.toLowerCase().includes('capital');
            const res = zone?.resources;
            const safe = (v?: number) => typeof v === 'number' ? v : 0;
            return `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <span style="font-size:16px;">${m.icon || '📍'}</span>
                    <span style="font-weight:600;color:#fff;">${m.name}</span>
                </div>
                <div style="font-size:12px;color:#cbd5e1;display:grid;gap:4px;">
                    <div style="display:flex;justify-content:space-between;">
                        <span>Тип:</span>
                        <span style="color:#fff">${m.type.toUpperCase()}</span>
                    </div>
                    ${zone ? `<div style="display:flex;justify-content:space-between;"><span>Город/Зона:</span><span style="color:#fff">${zone.nameRu}</span></div>` : ''}
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>Охрана:</span>
                        <span style="color:${corpColor}">${corpName}</span>
                    </div>
                    ${isCapital ? `<div style="display:flex;gap:6px;align-items:center;color:#fde68a">🏛️ Столица</div>` : ''}
                    ${res ? `
                        <div style="margin-top:4px;border-top:1px solid #334155;padding-top:4px;">Ресурсы</div>
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
                            <div style="text-align:center;color:#60a5fa;">💾<div style="color:#fff;font-size:11px;">${safe(res.data)}%</div></div>
                            <div style="text-align:center;color:#f59e0b;">⚡<div style="color:#fff;font-size:11px;">${safe(res.energy)}%</div></div>
                            <div style="text-align:center;color:#9ca3af;">🔧<div style="color:#fff;font-size:11px;">${safe(res.materials)}%</div></div>
                        </div>
                    ` : ''}
                </div>
            `;
        };

        // Format tooltip for zone
        const formatZoneTooltipHtml = (z: PlanetZone) => {
            const corpName = z.corporationId ? planetService.getCorporationName(z.corporationId) : 'Независимая';
            const corpColor = z.corporationId ? planetService.getCorporationColor(z.corporationId) : '#6B7280';
            const statusLabels: Record<string, string> = {
                'stable': '✅ Стабильно',
                'contested': '⚔️ Оспаривается',
                'under_attack': '🔥 Под атакой',
                'lockdown': '🔒 Блокировка'
            };
            const statusLabel = statusLabels[z.status] || z.status;
            const res = z.resources;
            const safe = (v?: number) => typeof v === 'number' ? v : 0;
            return `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <span style="font-size:16px;">🏙️</span>
                    <span style="font-weight:600;color:#fff;">${z.nameRu}</span>
                </div>
                <div style="font-size:12px;color:#cbd5e1;display:grid;gap:4px;">
                    <div style="display:flex;justify-content:space-between;">
                        <span>Статус:</span>
                        <span style="color:#fff">${statusLabel}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>Контроль:</span>
                        <span style="color:${corpColor}">${corpName}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span>Влияние:</span>
                        <span style="color:#fff">${z.influence}%</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span>Население:</span>
                        <span style="color:#fff">${z.population}M</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span>Тех. уровень:</span>
                        <span style="color:#fff">${'⭐'.repeat(z.techLevel)}</span>
                    </div>
                    <div style="margin-top:4px;border-top:1px solid #334155;padding-top:4px;">Ресурсы</div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
                        <div style="text-align:center;color:#60a5fa;">💾<div style="color:#fff;font-size:11px;">${safe(res.data)}%</div></div>
                        <div style="text-align:center;color:#f59e0b;">⚡<div style="color:#fff;font-size:11px;">${safe(res.energy)}%</div></div>
                        <div style="text-align:center;color:#9ca3af;">🔧<div style="color:#fff;font-size:11px;">${safe(res.materials)}%</div></div>
                    </div>
                </div>
                <div style="margin-top:6px;font-size:10px;color:#94a3b8;text-align:center;">
                    Нажмите для подробностей
                </div>
            `;
        };

        let hoveredZone: any = null;
        const onMouseMove = (ev: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);
            raycaster.setFromCamera(mouse, camera);
            
            // Check markers first
            const markerHits = raycaster.intersectObjects(markerGroup.children);
            if (markerHits.length > 0) {
                const obj: any = markerHits[0].object;
                const m = obj?.userData?.marker as PlanetMarker;
                if (m) {
                    tooltip.innerHTML = formatTooltipHtml(m);
                    tooltip.style.left = `${ev.clientX - rect.left}px`;
                    tooltip.style.top = `${ev.clientY - rect.top}px`;
                    tooltip.style.display = 'block';
                    renderer.domElement.style.cursor = 'pointer';
                    
                    // Reset zone hover
                    if (hoveredZone && (hoveredZone.material as any).emissive) {
                        (hoveredZone.material as any).emissive.setHex(0x000000);
                    }
                    hoveredZone = null;
                    return;
                }
            }
            
            // Check zones
            const zoneHits = raycaster.intersectObjects(zoneGroup.children);
            if (zoneHits.length > 0) {
                const obj: any = zoneHits[0].object;
                const z = obj?.userData?.zone as PlanetZone;
                if (z) {
                    tooltip.innerHTML = formatZoneTooltipHtml(z);
                    tooltip.style.left = `${ev.clientX - rect.left}px`;
                    tooltip.style.top = `${ev.clientY - rect.top}px`;
                    tooltip.style.display = 'block';
                    renderer.domElement.style.cursor = 'pointer';
                    
                    // Highlight zone on hover
                    if (hoveredZone !== obj) {
                        // Reset previous
                        if (hoveredZone && hoveredZone.material) {
                            (hoveredZone.material as any).opacity = hoveredZone.userData?.pulse ? 0.85 : 0.85;
                        }
                        hoveredZone = obj;
                        if (hoveredZone.material) {
                            (hoveredZone.material as any).opacity = 1.0;
                        }
                    }
                    return;
                }
            }
            
            // No hit
            tooltip.style.display = 'none';
            renderer.domElement.style.cursor = 'grab';
            if (hoveredZone && hoveredZone.material) {
                (hoveredZone.material as any).opacity = hoveredZone.userData?.pulse ? 0.4 : 0.4;
                hoveredZone = null;
            }
        };
        renderer.domElement.addEventListener('mousemove', onMouseMove);

        // Resize
        const onResize = () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener('resize', onResize);

        let animId: number;
        let pulseTime = 0;
        let animate = () => {
            animId = requestAnimationFrame(animate);
            pulseTime += 0.05;
            
            // Planet rotation
            if (globe) globe.rotation.y += 0.0004;
            
            // Clouds rotate slightly faster than planet (wind effect)
            if (clouds) clouds.rotation.y += 0.0006;
            
            // Day/night cycle: sun orbits around planet
            sunAngle += 0.002; // Speed of day/night cycle
            const sunRadius = 8;
            sunLight.position.x = Math.cos(sunAngle) * sunRadius;
            sunLight.position.z = Math.sin(sunAngle) * sunRadius;
            sunLight.position.y = 2;
            
            // Night light opposite to sun
            nightLight.position.x = -sunLight.position.x;
            nightLight.position.z = -sunLight.position.z;
            nightLight.position.y = -2;
            
            // Pulse animation for zones in conflict (opacity + scale)
            zoneGroup.children.forEach((child: any) => {
                if (child.userData?.pulse) {
                    const pulse = 0.6 + Math.sin(pulseTime * 2) * 0.3;
                    if (child.material) {
                        child.material.opacity = pulse;
                    }
                    // Scale pulsation for dramatic effect
                    const baseScale = child.userData.baseScale || 0.15;
                    const scalePulse = baseScale * (1 + Math.sin(pulseTime * 1.5) * 0.15);
                    child.scale.set(scalePulse, scalePulse, 1);
                }
            });
            
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
            renderer.domElement.removeEventListener('click', onClick);
            renderer.domElement.removeEventListener('mousemove', onMouseMove);
            if (tooltip && tooltip.parentElement) tooltip.parentElement.removeChild(tooltip);
            renderer.dispose();
        };
    }, [viewMode]); // Only re-run when viewMode changes, not on every marker update

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
                                setViewMode('globe');
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
                        onClick={() => setViewMode('globe')}
                        className={`px-3 py-1 text-sm rounded ${viewMode === 'globe' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        🌐 3D Глобус
                    </button>
                    <button
                        onClick={() => setViewMode('stats')}
                        className={`px-3 py-1 text-sm rounded ${viewMode === 'stats' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        📊 Статистика
                    </button>
                </div>

                <div className="flex-1" />

                {viewMode === 'globe' && (
                    <>
                        {/* Filters for 3D globe */}
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
                    </>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 relative overflow-hidden" ref={containerRef}>
                {viewMode === 'globe' && (
                    <>
                        <canvas
                            ref={globeCanvasRef}
                            className="w-full h-full cursor-pointer"
                        />
                        {/* 3D Globe Legend */}
                        <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 text-xs border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                            <div className="font-bold text-cyan-400 mb-2 flex items-center gap-2">
                                <span>🌍</span> Легенда
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                                    <span className="text-slate-300">Стабильная зона</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50" />
                                    <span className="text-slate-300">Оспаривается</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                                    <span className="text-slate-300">Под атакой</span>
                                </div>
                                <div className="border-t border-slate-700 my-1.5" />
                                <div className="flex items-center gap-2">
                                    <span>🔬</span>
                                    <span className="text-slate-300">Лаборатория</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>🏢</span>
                                    <span className="text-slate-300">Штаб-квартира</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>📡</span>
                                    <span className="text-slate-300">Датацентр</span>
                                </div>
                            </div>
                            {/* Corporation control summary */}
                            <div className="border-t border-slate-700 mt-2 pt-2">
                                <div className="text-slate-400 mb-1">Контроль зон:</div>
                                <div className="grid grid-cols-2 gap-1 text-[10px]">
                                    {Array.from(new Set(zones.map(z => z.corporationId).filter(Boolean))).map(corp => {
                                        const corpZones = zones.filter(z => z.corporationId === corp);
                                        const color = CORPORATION_COLORS[corp as CorporationId] || '#888';
                                        return (
                                            <div key={corp} className="flex items-center gap-1">
                                                <div 
                                                    className="w-2 h-2 rounded-sm" 
                                                    style={{ backgroundColor: color }}
                                                />
                                                <span className="text-slate-300 truncate" title={corp}>
                                                    {corp?.substring(0, 8)}: {corpZones.length}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {viewMode === 'stats' && renderStatsView()}

                {/* Details panels - show in globe mode */}
                {viewMode === 'globe' && selectedZone && renderZoneDetails()}
                {viewMode === 'globe' && selectedMarker && !selectedZone && renderMarkerDetails()}
            </div>
        </div>
    );
};

export default PlanetApp;
