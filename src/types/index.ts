export type EffectType = 'metaballs' | 'particles' | 'noise' | 'kaleidoscope';
export type AnimationMode = 'time-based' | 'audio-reactive';
export type FrequencyBand = 'bass' | 'mid' | 'treble' | 'full';
export type AudioSource = 'microphone' | 'file';
export type AppMode = 'config' | 'play';

export interface VisualizationParams {
  effectType: EffectType;
  animationMode: AnimationMode;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  speed: number;
  scale: number;
  intensity: number;
  // Time-based mode params
  waveFrequency: number;
  evolutionRate: number;
  // Audio reactive mode params
  audioSensitivity: number;
  frequencyBand: FrequencyBand;
  smoothing: number;
  // Effect-specific params
  blobCount?: number;
  particleCount?: number;
  noiseOctaves?: number;
  kaleidoscopeSegments?: number;
}

export interface Preset {
  id: string;
  name: string;
  params: VisualizationParams;
  createdAt: number;
}

export interface Sequence {
  id: string;
  name: string;
  presetIds: string[];
  transitionDuration: number;
  presetDuration: number;
  looping: boolean;
  audioSource?: AudioSource;
  audioFileId?: string;
}

export interface AudioData {
  bass: number;
  mid: number;
  treble: number;
  full: number;
  waveform: Float32Array;
  frequencies: Uint8Array;
}

export const DEFAULT_PARAMS: VisualizationParams = {
  effectType: 'metaballs',
  animationMode: 'time-based',
  primaryColor: '#8b5cf6',
  secondaryColor: '#6366f1',
  backgroundColor: '#0a0a0f',
  speed: 1.0,
  scale: 1.0,
  intensity: 0.8,
  waveFrequency: 1.0,
  evolutionRate: 0.5,
  audioSensitivity: 1.0,
  frequencyBand: 'full',
  smoothing: 0.8,
  blobCount: 5,
  particleCount: 1000,
  noiseOctaves: 4,
  kaleidoscopeSegments: 6,
};
