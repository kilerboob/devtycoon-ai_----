import React, { Suspense, useState, useEffect } from 'react';
import { Canvas, ThreeEvent, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, TransformControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { playSound } from '../utils/sound';
import FurnitureEditor3D from './FurnitureEditor3D.tsx';
import AdvancedFurnitureEditor from './AdvancedFurnitureEditor';

interface Room3DProps {
  currentRoomId?: number;
  onBack?: () => void;
  onEnterComputer?: () => void;
  onOpenPCInternals?: () => void;
  onSleep?: () => void;
  onOpenJournal?: () => void;
  money?: number;
  onSpendMoney?: (amount: number) => void;
}

// Theme color mappings for 3D materials
const THEME_COLORS: Record<string, { floor: string; walls: string; ceiling: string; ambient: string }> = {
  default: {
    floor: '#2d3748',
    walls: '#1a202c',
    ceiling: '#0f172a',
    ambient: '#4a5568'
  },
  cyberpunk: {
    floor: '#701a75',
    walls: '#4c1d95',
    ceiling: '#1e1b4b',
    ambient: '#a855f7'
  },
  minimal: {
    floor: '#cbd5e1',
    walls: '#e2e8f0',
    ceiling: '#f8fafc',
    ambient: '#64748b'
  },
  cozy: {
    floor: '#92400e',
    walls: '#b45309',
    ceiling: '#78350f',
    ambient: '#f59e0b'
  },
  industrial: {
    floor: '#52525b',
    walls: '#3f3f46',
    ceiling: '#18181b',
    ambient: '#71717a'
  }
};

// 3D Room Environment Component
function RoomEnvironment({ theme }: { theme: string }) {
  const colors = THEME_COLORS[theme] || THEME_COLORS.default;

  return (
    <group>
      {/* Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color={colors.floor} 
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      {/* Visual grid (snapping aid) */}
      <Grid
        position={[0, 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.3}
        sectionSize={2}
        sectionThickness={0.6}
        cellColor="#475569"
        sectionColor="#94a3b8"
        fadeDistance={20}
      />

      {/* Back Wall */}
      <mesh receiveShadow position={[0, 5, -10]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial 
          color={colors.walls} 
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Left Wall */}
      <mesh receiveShadow position={[-10, 5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial 
          color={colors.walls} 
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Right Wall */}
      <mesh receiveShadow position={[10, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial 
          color={colors.walls} 
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Front Wall (to keep camera inside the room) */}
      <mesh receiveShadow position={[0, 5, 10]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial 
          color={colors.walls} 
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ceiling */}
      <mesh receiveShadow rotation={[Math.PI / 2, 0, 0]} position={[0, 10, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color={colors.ceiling} 
          roughness={0.9}
        />
      </mesh>
    </group>
  );
}

// 3D Furniture Item Component
interface FurnitureItem3DProps {
  item: {
    id?: number;
    item_type: string;
    position: { x: number; y: number; z: number };
    rotation?: number;
    scale?: number;
  };
  isSelected: boolean;
  onClick: () => void;
}

const FurnitureItem3D = React.forwardRef<any, FurnitureItem3DProps>(function FurnitureItem3D({ item, isSelected, onClick }, ref) {
  // Support both coordinate schemas: 0..100 (legacy 2D) and 0..10 meters (advanced editor)
  const isMeters = (item.position.x <= 10 && item.position.y <= 10);
  const position: [number, number, number] = [
    isMeters ? (item.position.x - 10 / 2) : ((item.position.x - 50) / 10),
    item.position.z || 0.5,
    isMeters ? (item.position.y - 10 / 2) : ((item.position.y - 50) / 10)
  ];

  const scale = item.scale || 1;
  const rotation = item.rotation || 0;

  // Furniture type to 3D geometry mapping
  const renderFurniture = () => {
    switch (item.item_type) {
      case 'chair':
        return (
          <group>
            <mesh castShadow position={[0, 0.45, 0]}>
              <boxGeometry args={[0.5, 0.05, 0.5]} />
              <meshStandardMaterial color="#7c5a40" />
            </mesh>
            <mesh castShadow position={[0, 0.8, -0.2]}>
              <boxGeometry args={[0.5, 0.6, 0.05]} />
              <meshStandardMaterial color="#6b4e35" />
            </mesh>
            {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
              <mesh key={i} castShadow position={[x, 0.225, z]}>
                <cylinderGeometry args={[0.03, 0.03, 0.45]} />
                <meshStandardMaterial color="#4b3a2a" />
              </mesh>
            ))}
          </group>
        );

      case 'table':
        return (
          <group>
            <mesh castShadow position={[0, 0.75, 0]}>
              <boxGeometry args={[1.8, 0.06, 1.0]} />
              <meshStandardMaterial color="#8b7355" />
            </mesh>
            {[[-0.8, -0.45], [0.8, -0.45], [-0.8, 0.45], [0.8, 0.45]].map(([x, z], i) => (
              <mesh key={i} castShadow position={[x, 0.375, z]}>
                <cylinderGeometry args={[0.04, 0.04, 0.75]} />
                <meshStandardMaterial color="#5a4632" />
              </mesh>
            ))}
          </group>
        );

      case 'coffee_table':
        return (
          <group>
            <mesh castShadow position={[0, 0.35, 0]}>
              <boxGeometry args={[1.0, 0.05, 0.6]} />
              <meshStandardMaterial color="#8b6645" />
            </mesh>
            {[[-0.45, -0.25], [0.45, -0.25], [-0.45, 0.25], [0.45, 0.25]].map(([x, z], i) => (
              <mesh key={i} castShadow position={[x, 0.175, z]}>
                <cylinderGeometry args={[0.03, 0.03, 0.3]} />
                <meshStandardMaterial color="#4b3a2a" />
              </mesh>
            ))}
          </group>
        );

      case 'bed':
        return (
          <group>
            <mesh castShadow position={[0, 0.4, 0]}>
              <boxGeometry args={[2.2, 0.3, 1.4]} />
              <meshStandardMaterial color="#cbd5e1" />
            </mesh>
            <mesh castShadow position={[0, 0.55, -0.5]}>
              <boxGeometry args={[2.2, 0.2, 0.4]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh castShadow position={[-1.05, 0.75, 0]}>
              <boxGeometry args={[0.1, 0.8, 1.4]} />
              <meshStandardMaterial color="#7c5a40" />
            </mesh>
          </group>
        );

      case 'wardrobe':
        return (
          <group>
            <mesh castShadow position={[0, 1.2, 0]}>
              <boxGeometry args={[1.6, 2.4, 0.6]} />
              <meshStandardMaterial color="#6b7280" />
            </mesh>
            <mesh position={[0, 1.2, 0.31]}>
              <planeGeometry args={[1.5, 2.3]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
          </group>
        );

      case 'cabinet':
        return (
          <group>
            <mesh castShadow position={[0, 0.6, 0]}>
              <boxGeometry args={[1.2, 1.2, 0.5]} />
              <meshStandardMaterial color="#7c5a40" />
            </mesh>
          </group>
        );

      case 'speaker':
        return (
          <group>
            <mesh castShadow position={[0, 0.6, 0]}>
              <boxGeometry args={[0.4, 1.2, 0.4]} />
              <meshStandardMaterial color="#1f2937" />
            </mesh>
            <mesh position={[0, 0.9, 0.21]}>
              <circleGeometry args={[0.12, 24]} />
              <meshStandardMaterial color="#374151" />
            </mesh>
            <mesh position={[0, 0.5, 0.21]}>
              <circleGeometry args={[0.18, 24]} />
              <meshStandardMaterial color="#4b5563" />
            </mesh>
          </group>
        );

      case 'clock':
        return (
          <group>
            <mesh castShadow position={[0, 0.9, 0]}>
              <boxGeometry args={[0.6, 0.6, 0.03]} />
              <meshStandardMaterial color="#e5e7eb" />
            </mesh>
            <mesh position={[0, 0.9, 0.02]}>
              <planeGeometry args={[0.55, 0.55]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          </group>
        );

      case 'console':
        return (
          <group>
            <mesh castShadow position={[0, 0.1, 0]}>
              <boxGeometry args={[0.4, 0.1, 0.25]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
            <mesh position={[0.15, 0.15, 0.12]}>
              <sphereGeometry args={[0.02, 12, 12]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
            </mesh>
          </group>
        );
      case 'sofa':
        return (
          <group>
            {/* Sofa base */}
            <mesh castShadow position={[0, 0.3, 0]}>
              <boxGeometry args={[2, 0.6, 1]} />
              <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </mesh>
            {/* Backrest */}
            <mesh castShadow position={[0, 0.8, -0.4]}>
              <boxGeometry args={[2, 0.8, 0.2]} />
              <meshStandardMaterial color="#8b4513" roughness={0.8} />
            </mesh>
            {/* Armrests */}
            <mesh castShadow position={[-0.9, 0.5, 0]}>
              <boxGeometry args={[0.2, 0.6, 1]} />
              <meshStandardMaterial color="#654321" roughness={0.8} />
            </mesh>
            <mesh castShadow position={[0.9, 0.5, 0]}>
              <boxGeometry args={[0.2, 0.6, 1]} />
              <meshStandardMaterial color="#654321" roughness={0.8} />
            </mesh>
          </group>
        );

      case 'desk':
        return (
          <group>
            {/* Desktop */}
            <mesh castShadow position={[0, 0.75, 0]}>
              <boxGeometry args={[1.5, 0.05, 0.8]} />
              <meshStandardMaterial color="#8b7355" roughness={0.6} metalness={0.1} />
            </mesh>
            {/* Legs */}
            {[[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]].map(([x, z], i) => (
              <mesh key={i} castShadow position={[x, 0.375, z]}>
                <cylinderGeometry args={[0.03, 0.03, 0.75]} />
                <meshStandardMaterial color="#654321" />
              </mesh>
            ))}
          </group>
        );

      case 'plant':
        return (
          <group>
            {/* Pot */}
            <mesh castShadow position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.15, 0.12, 0.3, 16]} />
              <meshStandardMaterial color="#8b4513" roughness={0.9} />
            </mesh>
            {/* Plant */}
            <mesh castShadow position={[0, 0.45, 0]}>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial color="#228b22" roughness={0.7} />
            </mesh>
          </group>
        );

      case 'lamp':
        return (
          <group>
            {/* Base */}
            <mesh castShadow position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.1, 0.12, 0.1]} />
              <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Pole */}
            <mesh castShadow position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.9]} />
              <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Lampshade */}
            <mesh castShadow position={[0, 0.95, 0]}>
              <coneGeometry args={[0.2, 0.3, 16]} />
              <meshStandardMaterial color="#f4e4c1" emissive="#fff8dc" emissiveIntensity={0.3} />
            </mesh>
            {/* Light */}
            <pointLight position={[0, 0.8, 0]} intensity={0.5} distance={3} color="#fff8dc" />
          </group>
        );

      case 'shelf':
        return (
          <group>
            {[0, 0.4, 0.8].map((y, i) => (
              <mesh key={i} castShadow position={[0, y, 0]}>
                <boxGeometry args={[1, 0.05, 0.3]} />
                <meshStandardMaterial color="#8b7355" roughness={0.7} />
              </mesh>
            ))}
            {/* Side supports */}
            <mesh castShadow position={[-0.45, 0.4, 0]}>
              <boxGeometry args={[0.05, 0.8, 0.3]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
            <mesh castShadow position={[0.45, 0.4, 0]}>
              <boxGeometry args={[0.05, 0.8, 0.3]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
          </group>
        );

      case 'tv':
        return (
          <group>
            {/* Screen */}
            <mesh castShadow position={[0, 0.5, 0]}>
              <boxGeometry args={[1.6, 0.9, 0.05]} />
              <meshStandardMaterial color="#000" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Screen glow */}
            <mesh position={[0, 0.5, 0.03]}>
              <planeGeometry args={[1.5, 0.84]} />
              <meshStandardMaterial color="#1e3a8a" emissive="#3b82f6" emissiveIntensity={0.5} />
            </mesh>
            {/* Stand */}
            <mesh castShadow position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.1]} />
              <meshStandardMaterial color="#2c3e50" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        );

      case 'rug':
        return (
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <planeGeometry args={[2, 1.5]} />
            <meshStandardMaterial color="#8b0000" roughness={1} />
          </mesh>
        );

      case 'picture':
        return (
          <group>
            {/* Frame */}
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[0.8, 0.6, 0.03]} />
              <meshStandardMaterial color="#8b7355" roughness={0.7} />
            </mesh>
            {/* Image */}
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[0.7, 0.5]} />
              <meshStandardMaterial color="#4a5568" />
            </mesh>
          </group>
        );

      default:
        return (
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#888" />
          </mesh>
        );
    }
  };

  return (
    <group 
      ref={ref as any}
      position={position} 
      rotation={[0, rotation, 0]}
      scale={[scale, scale, scale]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {renderFurniture()}
      {isSelected && (
        <mesh position={[0, -0.05, 0]}>
          <ringGeometry args={[0.8, 1, 32]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
});

// PC Hardware 3D Models
type PCHardware3DProps = {
  onEnterComputer?: () => void;
  onOpenPCInternals?: () => void;
  onOpenJournal?: () => void;
  onSleep?: () => void;
};

function PCHardware3D({ onEnterComputer, onOpenPCInternals, onOpenJournal, onSleep }: PCHardware3DProps) {
  return (
    <group position={[0, 0, 6]}>
      {/* Desk for PC */}
      <mesh castShadow position={[0, 0.75, 0]}>
        <boxGeometry args={[3, 0.05, 1.5]} />
        <meshStandardMaterial color="#8b7355" roughness={0.6} />
      </mesh>
      
      {/* Desk legs */}
      {[[-1.4, -0.35], [1.4, -0.35], [-1.4, 0.65], [1.4, 0.65]].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.375, z]}>
          <cylinderGeometry args={[0.04, 0.04, 0.75]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      ))}

      {/* Monitor (click to enter computer) */}
      <mesh castShadow position={[0, 1.3, -0.3]}
        onClick={(e: any) => { e.stopPropagation(); onEnterComputer && onEnterComputer(); }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}>
        <boxGeometry args={[1.2, 0.7, 0.05]} />
        <meshStandardMaterial color="#000" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.3, -0.27]}>
        <planeGeometry args={[1.1, 0.62]} />
        <meshStandardMaterial color="#1e3a8a" emissive="#3b82f6" emissiveIntensity={0.3} />
      </mesh>
      {/* Monitor stand */}
      <mesh castShadow position={[0, 0.82, -0.3]}>
        <cylinderGeometry args={[0.05, 0.08, 0.15]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.7} />
      </mesh>

      {/* Keyboard */}
      <mesh castShadow position={[0, 0.79, 0.2]}>
        <boxGeometry args={[0.8, 0.02, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>

      {/* Mouse */}
      <mesh castShadow position={[0.6, 0.79, 0.2]}>
        <boxGeometry args={[0.1, 0.04, 0.15]} />
        <meshStandardMaterial color="#2c2c2c" roughness={0.4} />
      </mesh>

      {/* PC Case (click to open internals) */}
      <mesh castShadow position={[-1, 0.4, 0]}
        onClick={(e: any) => { e.stopPropagation(); onOpenPCInternals && onOpenPCInternals(); }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}>
        <boxGeometry args={[0.3, 0.7, 0.5]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* PC case front light */}
      <mesh position={[-0.85, 0.6, 0.26]}>
        <circleGeometry args={[0.02, 16]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1} />
      </mesh>
      <pointLight position={[-1, 0.4, 0]} intensity={0.3} distance={1} color="#00ff00" />
      {/* Journal (click to open journal) */}
      <mesh position={[1.2, 0.79, 0.25]}
        onClick={(e: any) => { e.stopPropagation(); onOpenJournal && onOpenJournal(); }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = 'auto')}>
        <boxGeometry args={[0.2, 0.02, 0.15]} />
        <meshStandardMaterial color="#d97706" roughness={0.6} />
      </mesh>

      {/* Sofa used as sleep area (click to sleep) */}
            <group position={[0, 0, -3]}
              onClick={(e: any) => { e.stopPropagation(); onSleep && onSleep(); }}
             onPointerOver={() => (document.body.style.cursor = 'pointer')}
             onPointerOut={() => (document.body.style.cursor = 'auto')}>
        <mesh castShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[2, 0.6, 0.9]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>
        <mesh castShadow position={[0, 0.8, -0.35]}>
          <boxGeometry args={[2, 0.6, 0.2]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
      </group>
    </group>
  );
}

// Keyboard camera controller with bounds (inside 20x10 room)
function KeyboardCameraControls() {
  const baseSpeed = 0.08;
  const bounds = { x: 9.2, z: 9.2, yMin: 1.5, yMax: 8.5 };
  const keys = React.useRef<Record<string, boolean>>({});
  const vel = React.useRef(new THREE.Vector3(0, 0, 0));
  const { camera } = useThree();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useFrame(() => {
    const fast = keys.current['shift'] ? 2.0 : 1.0;
    const slow = keys.current['control'] ? 0.4 : 1.0;
    const speed = baseSpeed * fast * slow;

    let ax = 0, ay = 0, az = 0;
    if (keys.current['arrowleft'] || keys.current['a']) ax -= speed;
    if (keys.current['arrowright'] || keys.current['d']) ax += speed;
    if (keys.current['arrowup'] || keys.current['w']) az -= speed;
    if (keys.current['arrowdown'] || keys.current['s']) az += speed;
    if (keys.current['q']) ay -= speed;
    if (keys.current['e']) ay += speed;

    // Smooth velocity with damping
    vel.current.x = THREE.MathUtils.lerp(vel.current.x, ax, 0.2);
    vel.current.y = THREE.MathUtils.lerp(vel.current.y, ay, 0.2);
    vel.current.z = THREE.MathUtils.lerp(vel.current.z, az, 0.2);

    const nx = camera.position.x + vel.current.x;
    const ny = camera.position.y + vel.current.y;
    const nz = camera.position.z + vel.current.z;

    camera.position.x = Math.min(bounds.x, Math.max(-bounds.x, nx));
    camera.position.z = Math.min(bounds.z, Math.max(-bounds.z, nz));
    camera.position.y = Math.min(bounds.yMax, Math.max(bounds.yMin, ny));
  });

  return null;
}

export default function Room3D({ currentRoomId = 1, onBack, onEnterComputer, onOpenPCInternals, onSleep, onOpenJournal, money, onSpendMoney }: Room3DProps) {
  const [roomTheme, setRoomTheme] = useState<string>('default');
  const [furnitureItems, setFurnitureItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [useAdvancedEditor, setUseAdvancedEditor] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [mode, setMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [snap, setSnap] = useState<boolean>(true);
  const [axisLock, setAxisLock] = useState<null | 'x' | 'z'>(null);
  const [dragging, setDragging] = useState<boolean>(false);
  const dragStartRef = React.useRef<{ offset: THREE.Vector3; plane: THREE.Plane } | null>(null);
  const raycasterRef = React.useRef(new THREE.Raycaster());
  const mouseRef = React.useRef(new THREE.Vector2());
  const [hasCollision, setHasCollision] = useState<boolean>(false);
  const furnitureRefs = React.useRef<Record<number, any>>({});

  // Load room data
  useEffect(() => {
    // Listen for 2D editor broadcasts to live-update items when 3D is open
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('room-items');
      bc.onmessage = (e: MessageEvent) => {
        const data = (e as any).data || {};
        if (data.roomId === currentRoomId && data.source !== '3d' && Array.isArray(data.items)) {
          setFurnitureItems(data.items);
        }
      };
    } catch {}
    const loadRoom = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/rooms/${currentRoomId}`);
        if (response.ok) {
          const room = await response.json();
          setRoomTheme(room.theme || 'default');
        } else {
          // Auto-create room if not exists
          const createResponse = await fetch('http://localhost:3000/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ownerId: 'player_1', name: 'My Room', theme: 'default' })
          });
          if (createResponse.ok) {
            setRoomTheme('default');
          }
        }
      } catch (error) {
        const savedTheme = localStorage.getItem('roomTheme');
        if (savedTheme) setRoomTheme(savedTheme);
      }
    };

    const loadFurniture = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/rooms/${currentRoomId}/items`);
        if (response.ok) {
          const items = await response.json();
          setFurnitureItems(items);
        }
      } catch (error) {
        console.error('Failed to load furniture:', error);
      }
    };

    loadRoom();
    loadFurniture();
    return () => { try { bc?.close(); } catch {} };
  }, [currentRoomId]);

  const handleChangeTheme = async (newTheme: string) => {
    setRoomTheme(newTheme);
    playSound('success');
    localStorage.setItem('roomTheme', newTheme);
    
    try {
      await fetch(`http://localhost:3000/api/rooms/${currentRoomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme })
      });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
    
    setThemeModalOpen(false);
  };

  // Hotkeys for TransformControls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w') setMode('translate');
      if (k === 'e') setMode('rotate');
      if (k === 'r') setMode('scale');
      if (k === 'shift') setSnap(true);
      if (k === 'x') setAxisLock('x');
      if (k === 'z') setAxisLock('z');
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'shift') setSnap(false);
      if (e.key.toLowerCase() === 'x' || e.key.toLowerCase() === 'z') setAxisLock(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onUp); };
  }, []);

  // Persist selected item from TransformControls
  const persistSelectedFromObject = async () => {
    if (!selectedItemId) return;
    const obj = furnitureRefs.current[selectedItemId];
    if (!obj) return;
    // Constraints by type
    const selected = furnitureItems.find(i => i.id === selectedItemId);
    if (selected) {
      if (selected.item_type === 'picture' || selected.item_type === 'clock') {
        // Stick to nearest wall, adjust rotation to face room
        const walls = [
          { axis: 'z' as const, value: -9.85, rotY: 0 },      // back wall z=-10
          { axis: 'z' as const, value: 9.85, rotY: Math.PI }, // front wall z=+10
          { axis: 'x' as const, value: -9.85, rotY: Math.PI / 2 }, // left wall x=-10
          { axis: 'x' as const, value: 9.85, rotY: -Math.PI / 2 }  // right wall x=+10
        ];
        const d = walls.map(w => ({ w, dist: w.axis === 'z' ? Math.abs(obj.position.z - w.value) : Math.abs(obj.position.x - w.value) }));
        d.sort((a, b) => a.dist - b.dist);
        const nearest = d[0].w;
        if (nearest.axis === 'z') obj.position.z = nearest.value;
        else obj.position.x = nearest.value;
        obj.position.y = THREE.MathUtils.clamp(obj.position.y, 1.0, 4.0);
        obj.rotation.y = nearest.rotY;
      }
      if (selected.item_type === 'rug') {
        obj.position.y = 0.01;
      }
    }

    const x2D = obj.position.x * 10 + 50;
    const y2D = obj.position.z * 10 + 50;
    const zH = obj.position.y;
    const rot = obj.rotation.y;
    const scl = obj.scale.x;

    const updated = furnitureItems.map((it) => it.id === selectedItemId ? {
      ...it,
      position: { x: x2D, y: y2D, z: zH },
      rotation: rot,
      scale: scl
    } : it);
    setFurnitureItems(updated);
    try {
      const item = updated.find(i => i.id === selectedItemId);
      if (item) {
        await fetch(`http://localhost:3000/api/rooms/${currentRoomId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        try {
          const bc = new BroadcastChannel('room-items');
          bc.postMessage({ roomId: currentRoomId, items: updated, source: '3d' });
          bc.close();
        } catch {}
      }
    } catch (err) {
      console.error('Failed to save transform:', err);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Canvas */}
      <Canvas shadows onPointerMissed={() => setSelectedItemId(null)}>
        <PerspectiveCamera makeDefault position={[0, 5, 8]} fov={60} />
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2.1}
        />
        <KeyboardCameraControls />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />
        <pointLight position={[0, 8, 0]} intensity={0.3} color={THEME_COLORS[roomTheme]?.ambient || '#4a5568'} />

        <Suspense fallback={null}>
          {/* Room Environment */}
          <RoomEnvironment theme={roomTheme} />
          
          {/* PC Hardware */}
          <PCHardware3D
            onEnterComputer={onEnterComputer}
            onOpenPCInternals={onOpenPCInternals}
            onOpenJournal={onOpenJournal}
            onSleep={onSleep}
          />
          
          {/* Furniture Items */}
          {furnitureItems.map((item) => (
            <FurnitureItem3D
              key={item.id}
              item={item}
              isSelected={selectedItemId === item.id}
              onClick={() => setSelectedItemId(item.id)}
              ref={(node: any) => { if (node && item.id) furnitureRefs.current[item.id] = node; }}
            />
          ))}

          {/* Gizmo for selected object */}
          {selectedItemId && furnitureRefs.current[selectedItemId] && (
            <group
              onPointerDown={(e: any) => {
                e.stopPropagation();
                setDragging(true);
                const obj = furnitureRefs.current[selectedItemId]!;
                const { camera, size } = (e as any).eventObject?.__r3f?.root?.getState?.() || {};
                if (!camera || !size) return;
                // Set mouse coords
                mouseRef.current.set((e.clientX / size.width) * 2 - 1, -(e.clientY / size.height) * 2 + 1);
                // Define ground plane (XZ at y=0 for floor items)
                const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                // Raycast
                raycasterRef.current.setFromCamera(mouseRef.current, camera);
                const hit = new THREE.Vector3();
                raycasterRef.current.ray.intersectPlane(plane, hit);
                const offset = new THREE.Vector3().subVectors(obj.position, hit);
                dragStartRef.current = { offset, plane };
              }}
              onPointerMove={(e: any) => {
                if (!dragging || !dragStartRef.current) return;
                e.stopPropagation();
                const obj = furnitureRefs.current[selectedItemId]!;
                const selected = furnitureItems.find(i => i.id === selectedItemId);
                const type = selected?.item_type;
                const isWallMounted = type === 'picture' || type === 'clock' || type === 'shelf' || type === 'tv';
                const { camera, size } = (e as any).eventObject?.__r3f?.root?.getState?.() || {};
                if (!camera || !size) return;
                mouseRef.current.set((e.clientX / size.width) * 2 - 1, -(e.clientY / size.height) * 2 + 1);
                raycasterRef.current.setFromCamera(mouseRef.current, camera);
                const hit = new THREE.Vector3();
                raycasterRef.current.ray.intersectPlane(dragStartRef.current.plane, hit);
                const target = new THREE.Vector3().addVectors(hit, dragStartRef.current.offset);
                // Apply axis lock and snapping
                if (!isWallMounted) {
                  obj.position.y = type === 'rug' ? 0.01 : 0.01;
                  obj.position.x = axisLock === 'z' ? obj.position.x : target.x;
                  obj.position.z = axisLock === 'x' ? obj.position.z : target.z;
                  if (snap) {
                    obj.position.x = Math.round(obj.position.x / 0.5) * 0.5;
                    obj.position.z = Math.round(obj.position.z / 0.5) * 0.5;
                  }
                  obj.position.x = THREE.MathUtils.clamp(obj.position.x, -9.5, 9.5);
                  obj.position.z = THREE.MathUtils.clamp(obj.position.z, -9.5, 9.5);
                } else {
                  // For wall-mounted, stick to nearest wall along x/z, allow y move with snap
                  obj.position.x = THREE.MathUtils.clamp(target.x, -9.85, 9.85);
                  obj.position.z = THREE.MathUtils.clamp(target.z, -9.85, 9.85);
                  obj.position.y = THREE.MathUtils.clamp(obj.position.y, 1.0, 4.0);
                  if (snap) obj.position.y = Math.round(obj.position.y / 0.5) * 0.5;
                }
                // Collision preview (simple AABB vs other items)
                const currentIdx = furnitureItems.findIndex(i => i.id === selectedItemId);
                if (currentIdx >= 0) {
                  const cur = furnitureItems[currentIdx];
                  const curPos = { x: obj.position.x * 10 + 50, y: obj.position.z * 10 + 50, z: obj.position.y };
                  const collides = furnitureItems.some(o => o.id !== cur.id && Math.abs(curPos.x - o.position.x) < 5 && Math.abs(curPos.y - o.position.y) < 5);
                  setHasCollision(collides);
                }
              }}
              onPointerUp={async (e: any) => {
                if (!dragging) return;
                setDragging(false);
                dragStartRef.current = null;
                await persistSelectedFromObject();
              }}
            />
          )}

          {/* Snap indicator (shows where snapping will land) */}
          {snap && selectedItemId && furnitureRefs.current[selectedItemId] && mode === 'translate' && (
            <mesh rotation={[-Math.PI / 2, 0, 0]}
                  position={[
                    Math.round((furnitureRefs.current[selectedItemId].position.x) / 0.5) * 0.5,
                    0.02,
                    Math.round((furnitureRefs.current[selectedItemId].position.z) / 0.5) * 0.5
                  ]}>
              <ringGeometry args={[0.3, 0.45, 32]} />
              <meshBasicMaterial color={hasCollision ? "#ef4444" : "#22c55e"} transparent opacity={0.55} side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* Shadows */}
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2} far={10} />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 space-y-2 z-10">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg shadow-lg transition-colors"
        >
          ← Back to 2D
        </button>
        {/* Gizmo toolbar */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-2 py-2 rounded-lg">
          <button
            onClick={() => setMode('translate')}
            className={`px-2 py-1 rounded ${mode === 'translate' ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            title="Move (W)"
          >W</button>
          <button
            onClick={() => setMode('rotate')}
            className={`px-2 py-1 rounded ${mode === 'rotate' ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            title="Rotate (E)"
          >E</button>
          <button
            onClick={() => setMode('scale')}
            className={`px-2 py-1 rounded ${mode === 'scale' ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            title="Scale (R)"
          >R</button>
          <button
            onClick={() => setSnap(s => !s)}
            className={`ml-2 px-3 py-1 rounded ${snap ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            title="Toggle Snap (Shift)"
          >Snap</button>
        </div>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => { setUseAdvancedEditor(false); setEditorOpen(true); }}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg transition-colors"
          >
            🛠 Simple Editor
          </button>
          <button
            onClick={() => { setUseAdvancedEditor(true); setEditorOpen(true); }}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg shadow-lg transition-colors"
          >
            ✨ Advanced Editor
          </button>
        </div>
        <button
          onClick={() => setThemeModalOpen(true)}
          className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transition-colors"
        >
          🎨 Change Theme
        </button>
      </div>

      {/* Theme Selection Modal */}
      {themeModalOpen && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-slate-800 p-6 rounded-xl shadow-2xl max-w-md">
            <h2 className="text-2xl font-bold mb-4">Select Room Theme</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(THEME_COLORS).map(([themeName, colors]) => (
                <button
                  key={themeName}
                  onClick={() => handleChangeTheme(themeName)}
                  className={`p-4 rounded-lg transition-all ${
                    roomTheme === themeName
                      ? 'ring-4 ring-green-500 scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: colors.walls }}
                >
                  <div className="text-sm font-medium capitalize">{themeName}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setThemeModalOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Furniture Editor Modal */}
      {editorOpen && (
        <div className="absolute inset-0 bg-black/70 z-20">
          {useAdvancedEditor ? (
            <AdvancedFurnitureEditor
              roomId={currentRoomId}
              money={money || 0}
              onSpendMoney={onSpendMoney}
              onItemsChanged={(newItems) => setFurnitureItems(newItems)}
              onClose={() => {
                setEditorOpen(false);
                // Reload furniture
                fetch(`http://localhost:3000/api/rooms/${currentRoomId}/items`)
                  .then(res => res.json())
                  .then(items => setFurnitureItems(items))
                  .catch(console.error);
              }}
            />
          ) : (
            <FurnitureEditor3D
              roomId={currentRoomId}
              money={money || 0}
              onSpendMoney={onSpendMoney}
              onItemsChanged={(newItems) => setFurnitureItems(newItems)}
              onClose={() => {
                setEditorOpen(false);
                // Reload furniture
                fetch(`http://localhost:3000/api/rooms/${currentRoomId}/items`)
                  .then(res => res.json())
                  .then(items => setFurnitureItems(items))
                  .catch(console.error);
              }}
            />
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-slate-800/90 p-4 rounded-lg shadow-lg text-sm z-10">
        <div className="font-bold mb-2">Controls:</div>
        <div>🖱 Left click + drag: Rotate</div>
        <div>🖱 Right click + drag: Pan</div>
        <div>🖱 Scroll: Zoom</div>
        <div>🖱 Click furniture: Select</div>
        <div className="mt-2 border-t border-slate-700 pt-2">
          <div>W/E/R: Move/Rotate/Scale</div>
          <div>Shift: Snap on</div>
          <div>Ctrl: Slow, Shift: Fast (camera)</div>
        </div>
      </div>
    </div>
  );
}
