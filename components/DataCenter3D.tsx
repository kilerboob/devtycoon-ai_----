import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface DataCenterProps {
  serverId: number;
  serverName: string;
  difficulty: string;
  securityLevel: number;
  currentHealth: number;
  maxHealth: number;
  raidActive: boolean;
  hackProgress: number;
}

export function DataCenter3D({
  serverId,
  serverName,
  difficulty,
  securityLevel,
  currentHealth,
  maxHealth,
  raidActive,
  hackProgress
}: DataCenterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const serverRacksRef = useRef<THREE.Group[]>([]);
  const statusLEDsRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 50, 100);

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 8, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 20, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1f3a,
      metalness: 0.3,
      roughness: 0.7
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Create server racks
    const racks: THREE.Group[] = [];
    const leds: THREE.Mesh[] = [];

    for (let i = 0; i < 3; i++) {
      const rack = createServerRack(i, difficulty, securityLevel, raidActive, hackProgress);
      rack.position.x = i * 8 - 8;
      scene.add(rack);
      racks.push(rack);

      // Add status LED to each rack
      const ledGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const ledMaterial = new THREE.MeshBasicMaterial({
        color: raidActive ? 0xff0000 : 0x00ff00,
        emissive: raidActive ? 0xff0000 : 0x00ff00,
        emissiveIntensity: 0.8
      });
      const led = new THREE.Mesh(ledGeometry, ledMaterial);
      led.position.set(i * 8 - 8, 4, 0);
      scene.add(led);
      leds.push(led);
    }

    serverRacksRef.current = racks;
    statusLEDsRef.current = leds;
    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Rotate racks
      racks.forEach((rack, i) => {
        rack.rotation.y += (i % 2 === 0 ? 0.005 : -0.005);
      });

      // Animate LEDs based on raid state
      leds.forEach((led, i) => {
        if (raidActive) {
          led.scale.x = 0.8 + Math.sin(Date.now() * 0.005 + i) * 0.2;
          led.scale.y = led.scale.x;
          led.scale.z = led.scale.x;
        } else {
          led.scale.set(1, 1, 1);
        }
      });

      // Render
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [difficulty, securityLevel, raidActive, hackProgress]);

  // Update LED color and hack progress visualization
  useEffect(() => {
    statusLEDsRef.current.forEach((led) => {
      if (raidActive) {
        const hue = hackProgress / 100;
        const color = new THREE.Color().setHSL(hue * 0.3, 1, 0.5); // Green→Red
        (led.material as THREE.MeshBasicMaterial).color.copy(color);
        (led.material as THREE.MeshBasicMaterial).emissive.copy(color);
      } else {
        (led.material as THREE.MeshBasicMaterial).color.setHex(0x00ff00);
        (led.material as THREE.MeshBasicMaterial).emissive.setHex(0x00ff00);
      }
    });
  }, [raidActive, hackProgress]);

  return (
    <div className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {/* Overlay stats */}
      <div className="absolute bottom-4 left-4 bg-slate-900/80 border border-cyan-500 rounded p-4 text-white text-sm">
        <div className="font-bold text-cyan-400 mb-2">{serverName}</div>
        <div>Security: <span className="text-yellow-400">{securityLevel}/5</span></div>
        <div>Health: <span className={currentHealth > maxHealth * 0.5 ? 'text-green-400' : 'text-red-400'}>{currentHealth}/{maxHealth}</span></div>
        {raidActive && <div className="mt-2 text-red-400 font-bold animate-pulse">🔴 RAID IN PROGRESS</div>}
      </div>
    </div>
  );
}

function createServerRack(
  index: number,
  difficulty: string,
  securityLevel: number,
  raidActive: boolean,
  hackProgress: number
): THREE.Group {
  const rack = new THREE.Group();

  const difficultyColor = {
    easy: 0x00ff00,
    normal: 0xffff00,
    hard: 0xff8800,
    legendary: 0xff0000
  }[difficulty] || 0x00ff00;

  // Rack frame
  const frameGeometry = new THREE.BoxGeometry(2, 6, 0.5);
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    metalness: 0.8,
    roughness: 0.2
  });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.castShadow = true;
  frame.receiveShadow = true;
  rack.add(frame);

  // Server units (8 slots)
  for (let i = 0; i < 8; i++) {
    const unitGeometry = new THREE.BoxGeometry(1.8, 0.6, 0.4);
    const unitMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f0f23,
      metalness: 0.6,
      roughness: 0.4
    });
    const unit = new THREE.Mesh(unitGeometry, unitMaterial);
    unit.position.y = 2.5 - i * 0.75;
    unit.castShadow = true;
    unit.receiveShadow = true;
    rack.add(unit);

    // LED indicators on each unit
    const ledCount = securityLevel;
    for (let j = 0; j < ledCount; j++) {
      const ledGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const ledMaterial = new THREE.MeshBasicMaterial({
        color: difficultyColor,
        emissive: difficultyColor,
        emissiveIntensity: raidActive ? 0.8 : 0.3
      });
      const led = new THREE.Mesh(ledGeometry, ledMaterial);
      led.position.set(-0.7 + j * 0.3, 2.5 - i * 0.75, 0.25);
      rack.add(led);
    }
  }

  // Data flow lines (animated cables)
  const lineGeometry = new THREE.BufferGeometry();
  const linePositions = new Float32Array([
    -1, 3, 0.2,
    -1, -3, 0.2,
    1, 3, 0.2,
    1, -3, 0.2
  ]);
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: raidActive ? 0xff0000 : 0x00ff00,
    linewidth: 2
  });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  rack.add(lines);

  return rack;
}
