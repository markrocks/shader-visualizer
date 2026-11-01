import type { EffectType } from '../types';

// Rendering quality: how many pixels get shaded each frame.

export type QualityLevel = 'auto' | 'high' | 'balanced' | 'performance';

export const QUALITY_OPTIONS: { value: QualityLevel; label: string; description: string }[] = [
  { value: 'auto', label: 'Auto', description: 'Raises or lowers resolution to keep the frame rate smooth.' },
  { value: 'high', label: 'High', description: 'Full screen resolution (up to 2× on high-DPI displays) and full-size rendering for every effect.' },
  { value: 'balanced', label: 'Balanced', description: 'Standard resolution (1×); heavy effects render a little smaller and are scaled up.' },
  { value: 'performance', label: 'Performance', description: 'Lowest resolution for slower computers; heavy effects render smaller still.' },
];

// Highest pixel ratio the browser should use for this display, capped at 2
export function maxDevicePixelRatio(): number {
  return Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2);
}

// Pixel-ratio range for each quality level; Auto moves within its range
export function dprRange(quality: QualityLevel): [number, number] {
  const max = maxDevicePixelRatio();
  switch (quality) {
    case 'high':
      return [max, max];
    case 'balanced':
      return [Math.min(1, max), Math.min(1, max)];
    case 'performance':
      return [0.75, 0.75];
    case 'auto':
      return [0.75, max];
  }
}

// Raymarched effects whose cost per pixel is very high. Their soft, glowing
// look survives being rendered at a lower internal resolution and scaled up.
const HEAVY_EFFECT_SCALE: Partial<Record<EffectType, number>> = {
  clouds: 0.7,
  'star-nest': 0.75,
  'warp-speed': 0.7,
  'drive-home': 0.75,
  'plasma-globe': 0.75,
  blue: 0.75,
  'liquid-carbon': 0.65,
  'main-sequence-star': 0.85,
};

// Fraction of the canvas resolution an effect renders at before scaling up
export function renderScale(effect: EffectType, quality: QualityLevel): number {
  if (quality === 'high') return 1;
  const scale = HEAVY_EFFECT_SCALE[effect] ?? 1;
  return quality === 'performance' ? scale * 0.8 : scale;
}
