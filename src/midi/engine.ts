/**
 * MIDI engine: owns the Web MIDI connection and routes every incoming
 * message to the monitor, MIDI Learn, or the mapped param/action.
 * It lives outside React so it keeps running regardless of which view
 * is on screen.
 */
import type { MidiEvent } from './types';
import { useMidiStore } from '../stores/midiStore';
import type { MidiDevice } from '../stores/midiStore';
import { useVisualizationStore } from '../stores/visualizationStore';
import { ccToParamValue, describeEvent, eventToTrigger, findMappings, isPressed, parseMidiMessage, withHue } from './mapping';
import { PARAM_META } from './paramMeta';
import { runAction } from './actions';
import { setSmoothedTarget } from './smoother';

let access: MIDIAccess | null = null;
let started = false;
let firedTimer: number | undefined;

export function isWebMidiSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';
}

function refreshDevices() {
  if (!access) return;
  const devices: MidiDevice[] = [];
  access.inputs.forEach((input) => {
    if (input.state === 'connected') {
      devices.push({ id: input.id, name: input.name ?? 'MIDI device', manufacturer: input.manufacturer ?? '' });
    }
    input.onmidimessage = (e) => {
      if (!e.data) return;
      handleRawMessage(e.data, input.id, input.name ?? 'MIDI device');
    };
  });
  useMidiStore.getState().setDevices(devices);
}

/** Ask the browser for MIDI access. Safe to call more than once. */
export async function startMidi(): Promise<void> {
  const store = useMidiStore.getState();
  if (started) return;
  if (!isWebMidiSupported()) {
    store.setStatus('unsupported');
    return;
  }
  started = true;
  store.setStatus('requesting');
  try {
    access = await navigator.requestMIDIAccess({ sysex: false });
    access.onstatechange = refreshDevices;
    refreshDevices();
    useMidiStore.getState().setStatus('ready');
  } catch (err) {
    console.warn('MIDI access denied:', err);
    started = false;
    useMidiStore.getState().setStatus('denied');
  }
}

export function handleRawMessage(data: ArrayLike<number>, inputId: string, deviceName: string) {
  const { selectedInputId } = useMidiStore.getState();
  if (selectedInputId !== 'all' && selectedInputId !== inputId) return;
  const event = parseMidiMessage(data);
  if (event) handleMidiEvent(event, deviceName);
}

export function handleMidiEvent(event: MidiEvent, deviceName = 'Virtual') {
  const midi = useMidiStore.getState();
  midi.pushMonitor(describeEvent(event), deviceName);

  const trigger = eventToTrigger(event);

  // MIDI Learn: the next knob (for params) or knob/pad (for actions) is bound.
  if (midi.learnMode && midi.learnTarget) {
    const target = midi.learnTarget;
    const accepts = target.kind === 'param' ? event.type === 'cc' : event.type !== 'noteOff';
    if (accepts) {
      midi.addLearnedMapping({ trigger, target });
      return;
    }
  }

  for (const mapping of findMappings(midi.mappings, trigger)) {
    const { target } = mapping;
    if (target.kind === 'param') {
      if (event.type !== 'cc') continue;
      const meta = PARAM_META[target.param];
      if (meta.hue) {
        const viz = useVisualizationStore.getState();
        const hex = viz.params[target.param] as string;
        viz.setParams({ [target.param]: withHue(hex, ccToParamValue(target.param, event.value)) });
      } else {
        setSmoothedTarget(target.param, ccToParamValue(target.param, event.value));
      }
    } else {
      runAction(target.action, target.arg, isPressed(event));
    }
    flashFired(mapping.id);
  }
}

function flashFired(id: string) {
  useMidiStore.getState().setLastFired(id);
  window.clearTimeout(firedTimer);
  firedTimer = window.setTimeout(() => useMidiStore.getState().setLastFired(null), 150);
}

// Console helper for trying things without hardware:
//   vjMidi.cc(21, 100)   vjMidi.noteOn(36)   vjMidi.noteOff(36)
declare global {
  interface Window {
    vjMidi?: {
      cc: (cc: number, value: number, channel?: number) => void;
      noteOn: (note: number, velocity?: number, channel?: number) => void;
      noteOff: (note: number, channel?: number) => void;
    };
  }
}

if (typeof window !== 'undefined') {
  window.vjMidi = {
    cc: (number, value, channel = 1) => handleMidiEvent({ type: 'cc', channel, number, value }),
    noteOn: (number, value = 100, channel = 1) => handleMidiEvent({ type: 'noteOn', channel, number, value }),
    noteOff: (number, channel = 1) => handleMidiEvent({ type: 'noteOff', channel, number, value: 0 }),
  };
}
