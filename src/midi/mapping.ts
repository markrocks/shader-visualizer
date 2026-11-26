/**
 * Pure MIDI helpers — no browser APIs, so they're unit-testable.
 */
import type { MidiEvent, MidiMapping, MidiTarget, MidiTrigger } from './types';
import { PARAM_META } from './paramMeta';
import { ACTION_LABELS } from './paramMeta';

/** Decode raw MIDI bytes. Returns null for messages we don't use (clock, sysex, …). */
export function parseMidiMessage(data: ArrayLike<number>): MidiEvent | null {
  if (!data || data.length < 3) return null;
  const status = data[0] & 0xf0;
  const channel = (data[0] & 0x0f) + 1;
  const number = data[1] & 0x7f;
  const value = data[2] & 0x7f;

  switch (status) {
    case 0xb0:
      return { type: 'cc', channel, number, value };
    case 0x90:
      // Note-on with velocity 0 is a note-off by convention
      return { type: value === 0 ? 'noteOff' : 'noteOn', channel, number, value };
    case 0x80:
      return { type: 'noteOff', channel, number, value };
    default:
      return null;
  }
}

export function eventToTrigger(event: MidiEvent): MidiTrigger {
  return {
    type: event.type === 'cc' ? 'cc' : 'note',
    channel: event.channel,
    number: event.number,
  };
}

export function sameTrigger(a: MidiTrigger, b: MidiTrigger): boolean {
  return a.type === b.type && a.channel === b.channel && a.number === b.number;
}

export function sameTarget(a: MidiTarget, b: MidiTarget): boolean {
  if (a.kind === 'param' && b.kind === 'param') return a.param === b.param;
  if (a.kind === 'action' && b.kind === 'action') {
    return a.action === b.action && (a.arg ?? null) === (b.arg ?? null);
  }
  return false;
}

/** Mapping triggers with channel 0 match any channel (used by the default pad layout). */
export function triggerMatches(mapped: MidiTrigger, incoming: MidiTrigger): boolean {
  return (
    mapped.type === incoming.type &&
    mapped.number === incoming.number &&
    (mapped.channel === 0 || mapped.channel === incoming.channel)
  );
}

export function findMappings(mappings: MidiMapping[], trigger: MidiTrigger): MidiMapping[] {
  return mappings.filter((m) => triggerMatches(m.trigger, trigger));
}

/**
 * Add a mapping from MIDI Learn. A control drives one thing, and each
 * target has one control, so both old bindings are replaced.
 */
export function upsertMapping(mappings: MidiMapping[], next: MidiMapping): MidiMapping[] {
  return [
    ...mappings.filter((m) => !triggerMatches(m.trigger, next.trigger) &&!sameTarget(m.target, next.target)),
    next,
  ];
}

/** Scale a 0-127 CC value into a param's range. */
export function ccToParamValue(param: keyof typeof PARAM_META, value: number): number {
  const meta = PARAM_META[param];
  const t = Math.min(Math.max(value / 127, 0), 1);
  const raw = meta.min + t * (meta.max - meta.min);
  return meta.integer ? Math.round(raw) : raw;
}

/** Button-style CC: pressed at 64 and above. */
export function isPressed(event: MidiEvent): boolean {
  if (event.type === 'noteOn') return true;
  if (event.type === 'noteOff') return false;
  return event.value >= 64;
}

export function describeTrigger(trigger: MidiTrigger): string {
  const ch = trigger.channel <= 1 ? '' : ` ch${trigger.channel}`;
  return trigger.type === 'cc' ? `CC ${trigger.number}${ch}` : `Note ${trigger.number}${ch}`;
}

export function describeTarget(target: MidiTarget): string {
  if (target.kind === 'param') return PARAM_META[target.param].label;
  const label = ACTION_LABELS[target.action];
  return target.arg !== undefined ? `${label} ${target.arg + 1}` : label;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function noteName(n: number): string {
  return `${NOTE_NAMES[n % 12]}${Math.floor(n / 12) - 1}`;
}

export function describeEvent(event: MidiEvent): string {
  const ch = `ch${event.channel}`;
  switch (event.type) {
    case 'cc':
      return `CC ${event.number} = ${event.value} (${ch})`;
    case 'noteOn':
      return `Note ${noteName(event.number)} (${event.number}) on, vel ${event.value} (${ch})`;
    case 'noteOff':
      return `Note ${noteName(event.number)} (${event.number}) off (${ch})`;
  }
}

// ---- Colour helpers for hue knobs ----

export function hexToHsl(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const int = m ? parseInt(m[1], 16) : 0;
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/** Set a colour's hue (degrees). Grey colours get a usable saturation so the knob does something. */
export function withHue(hex: string, hue: number): string {
  const [, s, l] = hexToHsl(hex);
  const sat = s < 0.15 ? 0.7 : s;
  const light = l < 0.08 || l > 0.92 ? 0.5 : l;
  return hslToHex(((hue % 360) + 360) % 360, sat, light);
}

/** Default pad layout for the common 16-pad range (notes 36-51, GM drum pads), any channel. */
export function defaultPadMappings(makeId: () => string): MidiMapping[] {
  const pads: MidiTarget[] = [
    ...Array.from({ length: 8 }, (_, i): MidiTarget => ({ kind: 'action', action: 'launchPreset', arg: i })),
    { kind: 'action', action: 'tapTempo' },
    { kind: 'action', action: 'strobe' },
    { kind: 'action', action: 'blackout' },
    { kind: 'action', action: 'invert' },
    { kind: 'action', action: 'prevEffect' },
    { kind: 'action', action: 'nextEffect' },
    { kind: 'action', action: 'toggleMirror' },
    { kind: 'action', action: 'toggleAudioReactive' },
  ];
  return pads.map((target, i) => ({
    id: makeId(),
    trigger: { type: 'note', channel: 0, number: 36 + i },
    target,
  }));
}

/** Average of recent tap intervals → BPM. Taps older than 2s reset the count. */
export function bpmFromTaps(taps: number[]): number | null {
  if (taps.length < 2) return null;
  const intervals: number[] = [];
  for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (avg <= 0) return null;
  return Math.round((60000 / avg) * 10) / 10;
}
