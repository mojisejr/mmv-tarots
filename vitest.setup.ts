import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock CSS variables
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

// Mock Three.js
vi.mock('three', () => ({
  Scene: vi.fn(),
  PerspectiveCamera: vi.fn(),
  WebGLRenderer: vi.fn(() => ({
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    domElement: document.createElement('canvas'),
    render: vi.fn(),
    dispose: vi.fn(),
  })),
  IcosahedronGeometry: vi.fn(),
  MeshBasicMaterial: vi.fn(),
  Mesh: vi.fn(() => ({
    rotation: { x: 0, y: 0, z: 0 },
    scale: { set: vi.fn() },
  })),
  BufferGeometry: vi.fn(),
  BufferAttribute: vi.fn(),
  PointsMaterial: vi.fn(),
  Points: vi.fn(() => ({
    rotation: { x: 0, y: 0, z: 0 },
    position: { y: 0 },
  })),
}));

// Mock @react-three/fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: { children?: any; [key: string]: any }) => (
    React.createElement('div', {
      'data-testid': props['data-testid'] || 'canvas',
      ...props
    }, children)
  ),
  useFrame: vi.fn((callback) => {
    // Mock animation frame
    callback(Date.now() * 0.001);
  }),
  useThree: vi.fn(() => ({
    camera: {
      position: { x: 0, y: 0, z: 5 },
      aspect: 1,
      updateProjectionMatrix: vi.fn(),
      fov: 75,
      near: 0.1,
      far: 1000
    },
    gl: { setSize: vi.fn() },
    size: { width: 800, height: 600 },
  })),
}));

// Mock @react-three/drei
vi.mock('@react-three/drei', () => ({
  Icosahedron: ({ args, ...props }: any) =>
    React.createElement('mesh', {
      'data-icosahedron-args': JSON.stringify(args),
      ...props
    }),
  Points: ({ positions, ...props }: any) =>
    React.createElement('points', {
      'data-points-count': positions?.length / 3 || 0,
      ...props
    }),
  OrbitControls: () => null,
}));