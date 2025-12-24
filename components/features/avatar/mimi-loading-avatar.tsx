'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron } from '@react-three/drei';
import * as THREE from 'three';

// Core Mesh Component (for loading state)
function CoreMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.rotation.y += 0.03; // Faster rotation
      meshRef.current.rotation.x += 0.015; // Faster rotation
      const scale = 1 + Math.sin(time * 5) * 0.08; // Faster and bigger pulse
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

// Shell Mesh Component (for loading state)
function ShellMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= 0.02; // Faster rotation
      meshRef.current.rotation.z -= 0.01; // Added Z-axis rotation
    }
  });

  return (
    <Icosahedron ref={meshRef} args={[1.6, 1]}>
      <meshBasicMaterial
        color={0xFCBD74}
        wireframe
        transparent
        opacity={0.3} // Slightly more visible
      />
    </Icosahedron>
  );
}

// Main MimiLoadingAvatar Component
export const MimiLoadingAvatar = ({ performanceMode = false }: { performanceMode?: boolean }) => {
  return (
    <div className="w-full h-full animate-fade-in">
      <Canvas
        gl={{
          alpha: true,
          antialias: !performanceMode,
          premultipliedAlpha: false,
        }}
        dpr={performanceMode ? 1 : (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1)}
        camera={{ position: [0, 0, 4.5], fov: 75, near: 0.1, far: 1000 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={1} />
        <CoreMesh />
        {!performanceMode && <ShellMesh />}
      </Canvas>
    </div>
  );
};