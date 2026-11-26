import type { MappableParamKey, PerformActionId } from './types';

export interface ParamMeta {
  label: string;
  min: number;
  max: number;
  /** Round to whole numbers (counts, segments, …). */
  integer?: boolean;
  /** Colour param: the knob sweeps the hue, keeping saturation/lightness. */
  hue?: boolean;
}

/**
 * Ranges match the sliders in ParameterPanel so a knob at 0/127 lands
 * exactly on the slider's ends.
 */
export const PARAM_META: Record<MappableParamKey, ParamMeta> = {
  speed: { label: 'Speed', min: 0, max: 2 },
  scale: { label: 'Scale', min: 0, max: 2 },
  intensity: { label: 'Intensity', min: 0, max: 1.5 },
  waveFrequency: { label: 'Wave Frequency', min: 0.1, max: 5 },
  evolutionRate: { label: 'Evolution Rate', min: 0.1, max: 2 },
  audioSensitivity: { label: 'Audio Reactivity', min: 0, max: 3 },
  smoothing: { label: 'Audio Smoothing', min: 0, max: 1 },
  mirrorSegments: { label: 'Mirror Segments', min: 2, max: 16, integer: true },
  blobCount: { label: 'Blob Count', min: 2, max: 10, integer: true },
  particleCount: { label: 'Particle Count', min: 100, max: 5000, integer: true },
  noiseOctaves: { label: 'Noise Octaves', min: 1, max: 8, integer: true },
  kaleidoscopeSegments: { label: 'Kaleidoscope Segments', min: 2, max: 16, integer: true },
  plasmaComplexity: { label: 'Plasma Complexity', min: 1, max: 8, integer: true },
  voronoiCells: { label: 'Voronoi Cells', min: 5, max: 50, integer: true },
  voronoiEdgeWidth: { label: 'Voronoi Edge Width', min: 0.001, max: 0.1 },
  tunnelDepth: { label: 'Tunnel Depth', min: 1, max: 30 },
  tunnelRings: { label: 'Tunnel Rings', min: 2, max: 20, integer: true },
  truchetGridSize: { label: 'Truchet Grid', min: 3, max: 20, integer: true },
  truchetLineWidth: { label: 'Truchet Line Width', min: 0.02, max: 0.2 },
  primaryColor: { label: 'Primary Hue', min: 0, max: 360, hue: true },
  secondaryColor: { label: 'Secondary Hue', min: 0, max: 360, hue: true },
};

export const ACTION_LABELS: Record<PerformActionId, string> = {
  launchPreset: 'Launch Preset',
  nextPreset: 'Next Preset',
  prevPreset: 'Prev Preset',
  nextEffect: 'Next Effect',
  prevEffect: 'Prev Effect',
  tapTempo: 'Tap Tempo',
  strobe: 'Strobe (hold)',
  blackout: 'Blackout (hold)',
  invert: 'Invert (hold)',
  toggleMirror: 'Mirror On/Off',
  toggleAudioReactive: 'Audio Reactive On/Off',
};

/** Actions that are on while held and off on release. */
export const MOMENTARY_ACTIONS: ReadonlySet<PerformActionId> = new Set(['strobe', 'blackout', 'invert']);
