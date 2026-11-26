import { useEffect } from 'react';
import { runAction } from '../midi/actions';
import type { PerformActionId } from '../midi/types';

/** Keyboard fallback for the performance actions, so the app is playable without a controller. */
const KEYS: Record<string, { action: PerformActionId; arg?: number }> = {
  t: { action: 'tapTempo' },
  s: { action: 'strobe' },
  b: { action: 'blackout' },
  i: { action: 'invert' },
  m: { action: 'toggleMirror' },
  a: { action: 'toggleAudioReactive' },
  '[': { action: 'prevEffect' },
  ']': { action: 'nextEffect' },
  ',': { action: 'prevPreset' },
  '.': { action: 'nextPreset' },
  ...Object.fromEntries(
    Array.from({ length: 8 }, (_, i) => [String(i + 1), { action: 'launchPreset' as const, arg: i }])
  ),
};

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target as HTMLElement | null)?.isContentEditable === true
  );
}

export function useLiveKeys(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (pressed: boolean) => (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      const binding = KEYS[e.key.toLowerCase()];
      if (!binding) return;
      if (pressed && e.repeat) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      runAction(binding.action, binding.arg, pressed);
    };
    const down = onKey(true);
    const up = onKey(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [enabled]);
}
