'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, Points } from '@react-three/drei';
import * as THREE from 'three';

// Core Mesh Component
function CoreMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x += 0.002;
      const scale = 1 + Math.sin(time * 2) * 0.05;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <Icosahedron ref={meshRef} args={[1.2, 0]}>
      <meshBasicMaterial
        color={0xF27669}
        wireframe
        transparent
        opacity={0.9}
      />
    </Icosahedron>
  );
}

// Shell Mesh Component
function ShellMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= 0.003;
      meshRef.current.rotation.x -= 0.001;
    }
  });

  return (
    <Icosahedron ref={meshRef} args={[1.8, 1]}>
      <meshBasicMaterial
        color={0xFCBD74}
        wireframe
        transparent
        opacity={0.2}
      />
    </Icosahedron>
  );
}

// Particles Component
function ParticlesMesh() {
  const meshRef = useRef<THREE.Points>(null);

  // Generate particle positions
  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 8;
    positions[i + 1] = (Math.random() - 0.5) * 8;
    positions[i + 2] = (Math.random() - 0.5) * 8;
  }

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.rotation.y += 0.001;
      meshRef.current.position.y = Math.sin(time * 0.5) * 0.2;
    }
  });

  return (
    <Points ref={meshRef} positions={positions} stride={3} frustumCulled={false}>
      <pointsMaterial
        size={0.03}
        color={0xffffff}
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </Points>
  );
}

// Main MimiAvatar Component
export const MimiAvatar = () => {
  return (
    <div
      className="w-full h-full"
      style={{
        opacity: 0,
        animation: 'fade-in 1s ease-out 0.2s forwards'
      }}
      data-testid="mimi-avatar-wrapper"
    >
      <Canvas
        gl={{
          alpha: true,
          antialias: true,
          premultipliedAlpha: false,
        }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
        camera={{ position: [0, 0, 5], fov: 75, near: 0.1, far: 1000 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={1} />
        <CoreMesh />
        <ShellMesh />
        <ParticlesMesh />
      </Canvas>
    </div>
  );
};