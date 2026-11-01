import type { Sequence, SequenceSlotSettings } from '../types';
import type { TransitionChoice, TransitionEasing } from '../shaders/transitions';

export interface ResolvedSlotSettings {
  presetDuration: number;
  transitionType: TransitionChoice;
  transitionDuration: number;
  transitionEasing: TransitionEasing;
}

// The sequence-wide settings every preset uses unless it overrides them
export function sequenceDefaults(sequence: Sequence): ResolvedSlotSettings {
  return {
    presetDuration: sequence.presetDuration,
    transitionType: sequence.transitionType ?? 'crossfade',
    transitionDuration: sequence.transitionDuration,
    transitionEasing: sequence.transitionEasing ?? 'smooth',
  };
}

// Overrides for the preset at `index` (empty when it has none)
export function slotOverrides(sequence: Sequence, index: number): SequenceSlotSettings {
  return sequence.slotSettings?.[index] ?? {};
}

// Effective settings for the preset at `index`: its overrides on top of the
// sequence's settings
export function resolveSlot(sequence: Sequence, index: number): ResolvedSlotSettings {
  const overrides = slotOverrides(sequence, index);
  const defaults = sequenceDefaults(sequence);
  return {
    presetDuration: overrides.presetDuration ?? defaults.presetDuration,
    transitionType: overrides.transitionType ?? defaults.transitionType,
    transitionDuration: overrides.transitionDuration ?? defaults.transitionDuration,
    transitionEasing: overrides.transitionEasing ?? defaults.transitionEasing,
  };
}

export function hasOverrides(settings: SequenceSlotSettings): boolean {
  return Object.values(settings).some((v) => v !== undefined);
}

// slotSettings padded or trimmed to match presetIds, so index-based edits
// (add, remove, reorder) stay aligned. Older sequences have no slotSettings.
export function alignedSlots(sequence: Sequence): SequenceSlotSettings[] {
  return sequence.presetIds.map((_, i) => sequence.slotSettings?.[i] ?? {});
}
