import { describe, expect, it } from 'vitest';
import {
  bpmFromTaps,
  ccToParamValue,
  defaultPadMappings,
  findMappings,
  hexToHsl,
  isPressed,
  parseMidiMessage,
  upsertMapping,
  withHue,
} from '../mapping';
import type { MidiMapping } from '../types';

let n = 0;
const id = () => `m${++n}`;

describe('parseMidiMessage', () => {
  it('decodes CC with 1-based channel', () => {
    expect(parseMidiMessage([0xb0, 21, 64])).toEqual({ type: 'cc', channel: 1, number: 21, value: 64 });
    expect(parseMidiMessage([0xb9, 7, 127])).toMatchObject({ channel: 10 });
  });
  it('treats note-on velocity 0 as note-off', () => {
    expect(parseMidiMessage([0x90, 36, 0])?.type).toBe('noteOff');
    expect(parseMidiMessage([0x90, 36, 90])?.type).toBe('noteOn');
    expect(parseMidiMessage([0x80, 36, 0])?.type).toBe('noteOff');
  });
  it('ignores clock and short messages', () => {
    expect(parseMidiMessage([0xf8])).toBeNull();
    expect(parseMidiMessage([0xe0, 0, 64])).toBeNull();
  });
});

describe('ccToParamValue', () => {
  it('maps 0..127 onto the slider range', () => {
    expect(ccToParamValue('intensity', 0)).toBe(0);
    expect(ccToParamValue('intensity', 127)).toBeCloseTo(1.5);
    expect(ccToParamValue('waveFrequency', 0)).toBeCloseTo(0.1);
  });
  it('rounds integer params', () => {
    expect(ccToParamValue('kaleidoscopeSegments', 64)).toBe(9);
    expect(Number.isInteger(ccToParamValue('voronoiCells', 33))).toBe(true);
  });
});

describe('mappings', () => {
  const pads = defaultPadMappings(id);
  it('default pads match any channel', () => {
    expect(findMappings(pads, { type: 'note', channel: 10, number: 36 })).toHaveLength(1);
    expect(findMappings(pads, { type: 'note', channel: 1, number: 36 })).toHaveLength(1);
    expect(findMappings(pads, { type: 'cc', channel: 1, number: 36 })).toHaveLength(0);
  });
  it('learning replaces old bindings for both the control and the target', () => {
    let maps: MidiMapping[] = [{ id: id(), trigger: { type: 'cc', channel: 1, number: 21 }, target: { kind: 'param', param: 'speed' } }];
    // Same knob → new target
    maps = upsertMapping(maps, { id: id(), trigger: { type: 'cc', channel: 1, number: 21 }, target: { kind: 'param', param: 'scale' } });
    expect(maps).toHaveLength(1);
    expect(maps[0].target).toEqual({ kind: 'param', param: 'scale' });
    // Same target → new knob
    maps = upsertMapping(maps, { id: id(), trigger: { type: 'cc', channel: 1, number: 22 }, target: { kind: 'param', param: 'scale' } });
    expect(maps).toHaveLength(1);
    expect(maps[0].trigger.number).toBe(22);
  });
  it('learning a pad overrides the any-channel default on that note', () => {
    const maps = upsertMapping(pads, {
      id: id(),
      trigger: { type: 'note', channel: 1, number: 36 },
      target: { kind: 'action', action: 'blackout' },
    });
    const hits = findMappings(maps, { type: 'note', channel: 1, number: 36 });
    expect(hits).toHaveLength(1);
    expect(hits[0].target).toEqual({ kind: 'action', action: 'blackout' });
  });
});

describe('isPressed', () => {
  it('handles notes and button CCs', () => {
    expect(isPressed({ type: 'noteOn', channel: 1, number: 1, value: 1 })).toBe(true);
    expect(isPressed({ type: 'noteOff', channel: 1, number: 1, value: 0 })).toBe(false);
    expect(isPressed({ type: 'cc', channel: 1, number: 1, value: 127 })).toBe(true);
    expect(isPressed({ type: 'cc', channel: 1, number: 1, value: 0 })).toBe(false);
  });
});

describe('hue', () => {
  it('rotates hue and keeps lightness', () => {
    const out = withHue('#8b5cf6', 120);
    const [h, , l] = hexToHsl(out);
    expect(Math.round(h)).toBe(120);
    expect(l).toBeCloseTo(hexToHsl('#8b5cf6')[2], 1);
  });
  it('gives grey colours some saturation', () => {
    expect(hexToHsl(withHue('#808080', 0))[1]).toBeGreaterThan(0.5);
  });
});

describe('bpmFromTaps', () => {
  it('averages intervals', () => {
    expect(bpmFromTaps([0, 500, 1000, 1500])).toBe(120);
    expect(bpmFromTaps([0])).toBeNull();
  });
});
