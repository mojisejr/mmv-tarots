import '@testing-library/jest-dom';
import { vi } from 'vitest';

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
  Canvas: ({ children }: { children: any }) => (
    '<div data-testid="canvas">{children}</div>'
  ),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    camera: { aspect: 1, updateProjectionMatrix: vi.fn() },
    gl: { setSize: vi.fn() },
    size: { width: 800, height: 600 },
  })),
}));