/**
 * Knob smoothing. MIDI CCs arrive in 1/127 steps and often in bursts, which
 * makes the visuals stutter. Instead of writing CC values straight into the
 * store, we set a target and ease toward it once per animation frame,
 * batching all changed params into a single store update.
 */
import type { VisualizationParams } from '../types';
import type { MappableParamKey } from './types';
import { PARAM_META } from './paramMeta';
import { useVisualizationStore } from '../stores/visualizationStore';

/**
 * Time constant of the easing. Time-based (not per-frame) so a knob feels
 * the same on a slow laptop as on a fast one: ~95% settled after 150ms.
 */
const TAU_MS = 50;

const targets = new Map<MappableParamKey, number>();
let frame: number | null = null;
let lastTime: number | null = null;

function tick(now: number) {
  frame = null;
  const dt = lastTime === null ? 16 : Math.min(now - lastTime, 250);
  lastTime = now;
  const ease = 1 - Math.exp(-dt / TAU_MS);
  const { params, setParams } = useVisualizationStore.getState();
  const update: Partial<VisualizationParams> = {};

  for (const [key, target] of targets) {
    const meta = PARAM_META[key];
    const current = params[key] as number | undefined;
    if (meta.integer || current === undefined) {
      (update as Record<string, number>)[key] = target;
      targets.delete(key);
      continue;
    }
    const diff = target - current;
    const epsilon = (meta.max - meta.min) * 0.001;
    if (Math.abs(diff) <= epsilon) {
      (update as Record<string, number>)[key] = target;
      targets.delete(key);
    } else {
      (update as Record<string, number>)[key] = current + diff * ease;
    }
  }

  if (Object.keys(update).length > 0) setParams(update);
  if (targets.size > 0) schedule();
  else lastTime = null;
}

function schedule() {
  if (frame === null) frame = requestAnimationFrame(tick);
}

export function setSmoothedTarget(key: MappableParamKey, value: number) {
  targets.set(key, value);
  schedule();
}

/** Drop pending targets, e.g. when a preset launch replaces all params. */
export function cancelSmoothing() {
  targets.clear();
  if (frame !== null) {
    cancelAnimationFrame(frame);
    frame = null;
  }
  lastTime = null;
}
