import { useCallback, useEffect, useRef, useState } from 'react';
import { usePresetStore } from '../stores/presetStore';
import { DEFAULT_PARAMS } from '../types';
import type { VisualizationParams } from '../types';
import type { TransitionState } from '../components/shared/TransitionCanvas';
import { applyEasing, pickTransition } from '../shaders/transitions';
import { resolveSlot } from '../utils/sequenceSlots';

interface SequencePlaybackOptions {
  // Sequence to play; null stops playback
  sequenceId: string | null;
  paused?: boolean;
  // Called once a non-looping sequence finishes its last preset
  onEnd?: () => void;
  // Called whenever a new preset becomes the one on screen
  onPresetChange?: (params: VisualizationParams) => void;
}

// Plays a sequence on two layers for TransitionCanvas. Transition progress
// lives in a ref read every frame by the canvas, so React only re-renders
// when the preset changes, not on every animation frame.
export function useSequencePlayback({ sequenceId, paused = false, onEnd, onPresetChange }: SequencePlaybackOptions) {
  // Live sequence, so edits (durations, style, order, per-preset overrides)
  // apply during playback
  const sequence = usePresetStore((state) => state.sequences.find((s) => s.id === sequenceId) ?? null);
  const getPreset = usePresetStore((state) => state.getPreset);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [paramsA, setParamsA] = useState<VisualizationParams>(DEFAULT_PARAMS);
  const [paramsB, setParamsB] = useState<VisualizationParams>(DEFAULT_PARAMS);
  // Bumped to restart the timing loop without changing the index
  const [cycle, setCycle] = useState(0);

  const transitionRef = useRef<TransitionState>({ from: 'A', progress: 0, transition: 'crossfade' });
  const elapsedRef = useRef(0);
  const sequenceRef = useRef(sequence);
  const callbacksRef = useRef({ onEnd, onPresetChange });
  useEffect(() => {
    sequenceRef.current = sequence;
    callbacksRef.current = { onEnd, onPresetChange };
  });

  const presetParams = useCallback((index: number): VisualizationParams | null => {
    const seq = sequenceRef.current;
    if (!seq || seq.presetIds.length === 0) return null;
    const id = seq.presetIds[((index % seq.presetIds.length) + seq.presetIds.length) % seq.presetIds.length];
    return getPreset(id)?.params ?? null;
  }, [getPreset]);

  const setLayer = useCallback((layer: 'A' | 'B', params: VisualizationParams) => {
    if (layer === 'A') setParamsA(params);
    else setParamsB(params);
  }, []);

  // Show `index` on layer A and load the preset after it into hidden layer B
  const jumpTo = useCallback((index: number) => {
    const current = presetParams(index);
    if (!current) return;
    setParamsA(current);
    setParamsB(presetParams(index + 1) ?? current);
    transitionRef.current = { from: 'A', progress: 0, transition: transitionRef.current.transition };
    elapsedRef.current = 0;
    setCurrentIndex(index);
    setCycle((c) => c + 1);
    callbacksRef.current.onPresetChange?.(current);
  }, [presetParams]);

  // Start from the first preset whenever the sequence changes
  useEffect(() => {
    if (sequenceId) jumpTo(0);
  }, [sequenceId, jumpTo]);

  useEffect(() => {
    const seq = sequenceRef.current;
    if (!seq || seq.presetIds.length === 0 || paused) return;

    let frame = 0;
    let transitionStarted = false;
    const start = performance.now() - elapsedRef.current;

    const tick = (now: number) => {
      const s = sequenceRef.current;
      if (!s || s.presetIds.length === 0) return;
      // The current preset's settings decide how long it shows and how it
      // transitions to the next one
      const slot = resolveSlot(s, currentIndex);
      const holdMs = slot.presetDuration * 1000;
      const transitionMs = slot.transitionDuration * 1000;
      const elapsed = now - start;
      elapsedRef.current = elapsed;

      if (elapsed < holdMs) {
        frame = requestAnimationFrame(tick);
        return;
      }

      const nextIndex = (currentIndex + 1) % s.presetIds.length;
      if (nextIndex === 0 && !s.looping) {
        // Finished: stay on the last preset
        callbacksRef.current.onEnd?.();
        return;
      }

      const t = transitionRef.current;
      const incoming = t.from === 'A' ? 'B' : 'A';
      if (!transitionStarted) {
        transitionStarted = true;
        // Keep the style picked before a mid-transition pause
        if (t.progress === 0) t.transition = pickTransition(slot.transitionType);
        // Normally preloaded already; covers a sequence edited mid-playback
        const next = presetParams(nextIndex);
        const loaded = incoming === 'A' ? paramsA : paramsB;
        if (next && next !== loaded) setLayer(incoming, next);
      }

      const raw = transitionMs > 0 ? Math.min((elapsed - holdMs) / transitionMs, 1) : 1;
      t.progress = applyEasing(slot.transitionEasing, raw);

      if (raw < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }

      // Transition done: the incoming layer becomes current. Updating the ref
      // (not React state) makes the swap land on the same frame, so there's
      // no flash back to the old preset.
      transitionRef.current = { from: incoming, progress: 0, transition: t.transition };
      elapsedRef.current = 0;
      // Preload the following preset into the now-hidden layer so its shaders
      // compile during the hold, not when the next transition starts
      const after = presetParams(nextIndex + 1);
      if (after) setLayer(t.from, after);
      const shown = presetParams(nextIndex);
      if (shown) callbacksRef.current.onPresetChange?.(shown);
      setCurrentIndex(nextIndex);
      setCycle((c) => c + 1);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // paramsA/paramsB are only compared at transition start; re-running the
    // loop when they change would reset its timing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, cycle, paused, presetParams, setLayer]);

  return { paramsA, paramsB, transitionRef, currentIndex, sequence, jumpTo };
}
