'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { Icosahedron, Points, Effects } from '@react-three/drei';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three-stdlib';

// Extend Three.js with Post-processing effects
extend({ UnrealBloomPass });

const CONFIG = {
  colors: {
    primary: '#F27669',
    accent: '#FCBD74',
  },
  particles: {
    count: 2500,
    mobileCount: 1000,
    size: 0.15,
    radius: 12, // Very wide spread
  },
  bloom: {
    strength: 1.5,
    radius: 0.4,
    threshold: 0.1
  }
};

function CoreSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x += 0.001;
    }
  });

  return (
    <Icosahedron ref={meshRef} args={[1.2, 10]}>
      <meshBasicMaterial
        color={CONFIG.colors.primary}
        wireframe
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </Icosahedron>
  );
}

function ShellSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= 0.003;
    }
  });

  return (
    <Icosahedron ref={meshRef} args={[1.0, 4]}>
      <meshBasicMaterial
        color={CONFIG.colors.accent}
        transparent
        opacity={0.15}
        wireframe
      />
    </Icosahedron>
  );
}

function ParticleCloud({ performanceMode }: { performanceMode: boolean }) {
  const meshRef = useRef<THREE.Points>(null);
  
  const { positions, randoms } = useMemo(() => {
    const count = performanceMode ? CONFIG.particles.mobileCount : CONFIG.particles.count;
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count);

    for (let i = 0; i < count * 3; i += 3) {
      // Spherical distribution with large radius
      const r = CONFIG.particles.radius * (0.1 + Math.random() * 1.5);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i] = r * Math.sin(phi) * Math.cos(theta);
      pos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i + 2] = r * Math.cos(phi);

      rnd[i / 3] = Math.random();
    }
    return { positions: pos, randoms: rnd };
  }, [performanceMode]);

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(242, 118, 105, 0.8)');
    gradient.addColorStop(0.5, 'rgba(242, 118, 105, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }, []);

  const originalPositions = useMemo(() => positions.slice(), [positions]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    const geometry = meshRef.current.geometry;
    const posAttribute = geometry.attributes.position;
    
    for (let i = 0; i < (performanceMode ? CONFIG.particles.mobileCount : CONFIG.particles.count); i++) {
      const ix = i * 3;
      const ox = originalPositions[ix];
      const oy = originalPositions[ix + 1];
      const oz = originalPositions[ix + 2];

      const offset = randoms[i] * 10;
      const scale = 1 + Math.sin(time * 0.3 + offset) * 0.1;
      const drift = Math.sin(time * 0.1 + offset) * 0.5;

      posAttribute.setXYZ(i, ox * scale + drift, oy * scale + drift, oz * scale + drift);
    }
    posAttribute.needsUpdate = true;
    meshRef.current.rotation.y = time * 0.01;
  });

  if (!texture) return null;

  return (
    <Points ref={meshRef} positions={positions} stride={3} frustumCulled={false}>
      <pointsMaterial
        size={CONFIG.particles.size}
        map={texture}
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color={CONFIG.colors.primary}
        sizeAttenuation={true}
      />
    </Points>
  );
}

function Debris({ performanceMode }: { performanceMode: boolean }) {
  const meshRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const count = performanceMode ? 150 : 500;
    const pos = new Float32Array(count * 3);
    
    for (let i = 0; i < count * 3; i += 3) {
      const r = 15 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      pos[i] = r * Math.sin(phi) * Math.cos(theta);
      pos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [performanceMode]);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.rotation.y = -time * 0.005;
    }
  });

  return (
    <Points ref={meshRef} positions={positions} stride={3} frustumCulled={false}>
      <pointsMaterial
        size={0.1}
        color={CONFIG.colors.accent}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function PostProcessing({ performanceMode }: { performanceMode: boolean }) {
  const { size } = useThree();
  if (performanceMode) return null;

  return (
    <Effects disableGamma>
      {/* @ts-expect-error - UnrealBloomPass args type mismatch */}
      <unrealBloomPass
        args={[new THREE.Vector2(size.width, size.height), CONFIG.bloom.strength, CONFIG.bloom.radius, CONFIG.bloom.threshold]}
      />
    </Effects>
  );
}

export const MimiAvatar = ({ performanceMode = false }: { performanceMode?: boolean }) => {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        opacity: 0,
        animation: 'fade-in 2.5s ease-out forwards'
      }}
    >
      <Canvas
        gl={{
          alpha: true,
          antialias: !performanceMode,
          powerPreference: "high-performance",
        }}
        dpr={performanceMode ? 1 : [1, 2]}
        camera={{ position: [0, 0, 15], fov: 50, near: 0.1, far: 100 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 0, 0]} intensity={2} color={CONFIG.colors.primary} />
        
        <group position={[0, 2, 0]}> {/* Position orb in the upper half */}
          <CoreSphere />
          <ShellSphere />
        </group>
        
        <ParticleCloud performanceMode={performanceMode} />
        <Debris performanceMode={performanceMode} />
        <PostProcessing performanceMode={performanceMode} />
      </Canvas>
    </div>
  );
};
