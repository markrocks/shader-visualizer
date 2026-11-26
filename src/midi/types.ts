import type { VisualizationParams } from '../types';

/** What the controller sent: a knob/fader (CC) or a key/pad (note). */
export type MidiTriggerType = 'cc' | 'note';

export interface MidiTrigger {
  type: MidiTriggerType;
  /** MIDI channel, 1-16 */
  channel: number;
  /** CC number or note number, 0-127 */
  number: number;
}

/** Numeric params a knob can drive, plus the two colours (driven by hue). */
export type MappableParamKey = Extract<
  keyof VisualizationParams,
  | 'speed'
  | 'scale'
  | 'intensity'
  | 'waveFrequency'
  | 'evolutionRate'
  | 'audioSensitivity'
  | 'smoothing'
  | 'mirrorSegments'
  | 'blobCount'
  | 'particleCount'
  | 'noiseOctaves'
  | 'kaleidoscopeSegments'
  | 'plasmaComplexity'
  | 'voronoiCells'
  | 'voronoiEdgeWidth'
  | 'tunnelDepth'
  | 'tunnelRings'
  | 'truchetGridSize'
  | 'truchetLineWidth'
  | 'primaryColor'
  | 'secondaryColor'
>;

export type PerformActionId =
  | 'launchPreset'
  | 'nextPreset'
  | 'prevPreset'
  | 'nextEffect'
  | 'prevEffect'
  | 'tapTempo'
  | 'strobe'
  | 'blackout'
  | 'invert'
  | 'toggleMirror'
  | 'toggleAudioReactive';

export type MidiTarget =
  | { kind: 'param'; param: MappableParamKey }
  | { kind: 'action'; action: PerformActionId; arg?: number };

export interface MidiMapping {
  id: string;
  trigger: MidiTrigger;
  target: MidiTarget;
}

/** A decoded incoming message. */
export interface MidiEvent {
  type: 'cc' | 'noteOn' | 'noteOff';
  channel: number;
  number: number;
  value: number;
}
