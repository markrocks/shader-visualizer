import type { EffectType } from '../types';
import type { PerformActionId } from './types';
import { useVisualizationStore } from '../stores/visualizationStore';
import { usePresetStore } from '../stores/presetStore';
import { usePerformStore } from '../stores/performStore';
import { cancelSmoothing } from './smoother';

export const EFFECT_ORDER: EffectType[] = [
  'metaballs',
  'particles',
  'noise',
  'kaleidoscope',
  'plasma',
  'voronoi',
  'tunnel',
  'truchet',
];

export function launchPreset(index: number): boolean {
  const presets = usePresetStore.getState().presets;
  const preset = presets[index];
  if (!preset) return false;
  const viz = useVisualizationStore.getState();
  cancelSmoothing();
  usePerformStore.getState().markLaunch(index, viz.params);
  viz.setParams({ ...preset.params });
  return true;
}

function stepPreset(dir: 1 | -1) {
  const count = usePresetStore.getState().presets.length;
  if (count === 0) return;
  const current = usePerformStore.getState().activePresetIndex;
  const next = current === null ? (dir === 1 ? 0 : count - 1) : (current + dir + count) % count;
  launchPreset(next);
}

function stepEffect(dir: 1 | -1) {
  const viz = useVisualizationStore.getState();
  const i = EFFECT_ORDER.indexOf(viz.params.effectType);
  const next = EFFECT_ORDER[(i + dir + EFFECT_ORDER.length) % EFFECT_ORDER.length];
  viz.setParams({ effectType: next });
}

/**
 * Run a performance action. `pressed` is false on pad release; only
 * momentary actions (strobe/blackout/invert) do anything on release.
 */
export function runAction(action: PerformActionId, arg: number | undefined, pressed: boolean) {
  const perform = usePerformStore.getState();
  const viz = useVisualizationStore.getState();

  switch (action) {
    case 'strobe':
    case 'blackout':
    case 'invert':
      perform.setMomentary(action, pressed);
      return;
  }

  if (!pressed) return;

  switch (action) {
    case 'launchPreset':
      if (arg !== undefined) launchPreset(arg);
      break;
    case 'nextPreset':
      stepPreset(1);
      break;
    case 'prevPreset':
      stepPreset(-1);
      break;
    case 'nextEffect':
      stepEffect(1);
      break;
    case 'prevEffect':
      stepEffect(-1);
      break;
    case 'tapTempo':
      perform.tap();
      break;
    case 'toggleMirror':
      viz.setParams({ mirrorQuadrants: !viz.params.mirrorQuadrants });
      break;
    case 'toggleAudioReactive':
      viz.setParams({
        animationMode: viz.params.animationMode === 'audio-reactive' ? 'time-based' : 'audio-reactive',
      });
      break;
  }
}
