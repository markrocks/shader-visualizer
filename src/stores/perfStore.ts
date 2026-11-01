import { create } from 'zustand';

// Rendering stats sampled by PerformanceProbe and shown by PerformanceOverlay
export interface PerfStats {
  fps: number;
  // Average and slowest frame time over the sample window, in milliseconds
  frameMs: number;
  worstMs: number;
  dpr: number;
  // Canvas size in device pixels
  width: number;
  height: number;
  // Internal resolution of the visible effect(s), as a fraction of the canvas
  renderScale: number;
  // Compiled shader programs currently held by the GPU
  programs: number;
  // Recent FPS samples, oldest first
  history: number[];
}

interface PerfState {
  stats: PerfStats | null;
  setStats: (stats: PerfStats) => void;
}

export const usePerfStore = create<PerfState>((set) => ({
  stats: null,
  setStats: (stats) => set({ stats }),
}));
