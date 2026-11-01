import { v4 as uuidv4 } from 'uuid';
import type { Preset, Sequence, SequenceSlotSettings } from '../types';
import { alignedSlots } from './sequenceSlots';

// A sequence backup is one JSON file holding every sequence plus the presets
// they play, so it restores completely on any browser or machine.
export const BACKUP_FORMAT = 'shader-visualizer-sequences';
export const BACKUP_VERSION = 1;

export interface SequenceBackup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  description: string;
  sequences: Sequence[];
  presets: Preset[];
}

export interface RestoreSummary {
  sequencesAdded: number;
  sequencesUnchanged: number;
  // Same id as an existing sequence but different contents; kept as a copy
  sequencesCopied: number;
  presetsAdded: number;
  presetsReused: number;
  // Preset references in the file with no matching preset; dropped
  missingPresets: number;
}

// Every field written explicitly, in a fixed order, so backups of the same
// sequence are identical and older sequences gain their default values
function normalizeSequence(sequence: Sequence): Sequence {
  return {
    id: sequence.id,
    name: sequence.name,
    presetIds: [...sequence.presetIds],
    presetDuration: sequence.presetDuration,
    transitionDuration: sequence.transitionDuration,
    transitionType: sequence.transitionType ?? 'crossfade',
    transitionEasing: sequence.transitionEasing ?? 'smooth',
    looping: sequence.looping,
    slotSettings: alignedSlots(sequence),
    ...(sequence.audioSource !== undefined && { audioSource: sequence.audioSource }),
    ...(sequence.audioFileId !== undefined && { audioFileId: sequence.audioFileId }),
  };
}

export function createSequenceBackup(sequences: Sequence[], presets: Preset[]): SequenceBackup {
  const used = new Set(sequences.flatMap((s) => s.presetIds));
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    description: 'Shader Visualizer sequence backup. Restore it from Sequences → Restore.',
    sequences: sequences.map(normalizeSequence),
    presets: presets.filter((p) => used.has(p.id)),
  };
}

export function backupFileName(date = new Date()): string {
  // Local date, so a backup made in the evening isn't labelled tomorrow
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `visualizer-sequences-${day}.json`;
}

export function downloadBackup(backup: SequenceBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = backupFileName();
  link.click();
  URL.revokeObjectURL(url);
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function parseSlot(value: unknown): SequenceSlotSettings {
  if (!isObject(value)) return {};
  const slot: SequenceSlotSettings = {};
  if (isNumber(value.presetDuration)) slot.presetDuration = value.presetDuration;
  if (isNumber(value.transitionDuration)) slot.transitionDuration = value.transitionDuration;
  if (typeof value.transitionType === 'string') slot.transitionType = value.transitionType as SequenceSlotSettings['transitionType'];
  if (typeof value.transitionEasing === 'string') slot.transitionEasing = value.transitionEasing as SequenceSlotSettings['transitionEasing'];
  return slot;
}

function parseSequence(value: unknown, index: number): Sequence {
  const where = `Sequence ${index + 1}`;
  if (!isObject(value)) throw new Error(`${where} is not an object.`);
  if (typeof value.id !== 'string' || typeof value.name !== 'string') throw new Error(`${where} is missing its id or name.`);
  if (!Array.isArray(value.presetIds) || !value.presetIds.every((id) => typeof id === 'string')) {
    throw new Error(`${where} (${value.name}) has an invalid preset list.`);
  }
  if (!isNumber(value.presetDuration) || !isNumber(value.transitionDuration)) {
    throw new Error(`${where} (${value.name}) is missing its durations.`);
  }
  const slots = Array.isArray(value.slotSettings) ? value.slotSettings : [];
  return normalizeSequence({
    id: value.id,
    name: value.name,
    presetIds: value.presetIds as string[],
    presetDuration: value.presetDuration,
    transitionDuration: value.transitionDuration,
    transitionType: typeof value.transitionType === 'string' ? (value.transitionType as Sequence['transitionType']) : undefined,
    transitionEasing: typeof value.transitionEasing === 'string' ? (value.transitionEasing as Sequence['transitionEasing']) : undefined,
    looping: value.looping !== false,
    slotSettings: (value.presetIds as string[]).map((_, i) => parseSlot(slots[i])),
    audioSource: value.audioSource as Sequence['audioSource'],
    audioFileId: typeof value.audioFileId === 'string' ? value.audioFileId : undefined,
  });
}

function parsePreset(value: unknown, index: number): Preset {
  const where = `Preset ${index + 1}`;
  if (!isObject(value)) throw new Error(`${where} is not an object.`);
  if (typeof value.id !== 'string' || typeof value.name !== 'string') throw new Error(`${where} is missing its id or name.`);
  if (!isObject(value.params) || typeof value.params.effectType !== 'string') {
    throw new Error(`${where} (${value.name}) has no effect settings.`);
  }
  return {
    id: value.id,
    name: value.name,
    params: value.params as unknown as Preset['params'],
    createdAt: isNumber(value.createdAt) ? value.createdAt : Date.now(),
  };
}

// Reads and checks a backup file's text; throws with a readable message
export function parseSequenceBackup(text: string): SequenceBackup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  if (!isObject(data) || data.format !== BACKUP_FORMAT) {
    throw new Error('This file is not a Shader Visualizer sequence backup.');
  }
  if (!isNumber(data.version) || data.version > BACKUP_VERSION) {
    throw new Error('This backup was made by a newer version of the app.');
  }
  if (!Array.isArray(data.sequences) || !Array.isArray(data.presets)) {
    throw new Error('This backup is missing its sequences or presets.');
  }
  return {
    format: BACKUP_FORMAT,
    version: data.version,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
    description: typeof data.description === 'string' ? data.description : '',
    sequences: data.sequences.map(parseSequence),
    presets: data.presets.map(parsePreset),
  };
}

// JSON with sorted keys, so equal data compares equal regardless of key order
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isObject(value)) {
    return `{${Object.keys(value)
      .filter((k) => value[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

const samePreset = (a: Preset, b: Preset) => a.name === b.name && stableStringify(a.params) === stableStringify(b.params);

const sameSequence = (a: Sequence, b: Sequence) =>
  stableStringify(normalizeSequence(a)) === stableStringify(normalizeSequence(b));

// Adds a backup to the current data without overwriting anything. Matching
// items are reused; an item whose id is taken by something different is
// added as a copy with a new id.
export function mergeSequenceBackup(
  current: { presets: Preset[]; sequences: Sequence[] },
  backup: SequenceBackup
): { presets: Preset[]; sequences: Sequence[]; summary: RestoreSummary } {
  const summary: RestoreSummary = {
    sequencesAdded: 0,
    sequencesUnchanged: 0,
    sequencesCopied: 0,
    presetsAdded: 0,
    presetsReused: 0,
    missingPresets: 0,
  };
  const presets = [...current.presets];
  const sequences = [...current.sequences];
  // Backup preset id → id it has after restoring
  const presetIdMap = new Map<string, string>();

  for (const preset of backup.presets) {
    const existing = presets.find((p) => p.id === preset.id);
    if (existing && samePreset(existing, preset)) {
      presetIdMap.set(preset.id, existing.id);
      summary.presetsReused++;
      continue;
    }
    const restored = existing ? { ...preset, id: uuidv4() } : preset;
    presets.push(restored);
    presetIdMap.set(preset.id, restored.id);
    summary.presetsAdded++;
  }

  for (const sequence of backup.sequences) {
    // Point slots at restored presets; drop slots whose preset is missing
    // from both the backup and this browser
    const presetIds: string[] = [];
    const slotSettings: SequenceSlotSettings[] = [];
    sequence.presetIds.forEach((id, i) => {
      const mapped = presetIdMap.get(id) ?? (presets.some((p) => p.id === id) ? id : null);
      if (!mapped) {
        summary.missingPresets++;
        return;
      }
      presetIds.push(mapped);
      slotSettings.push(sequence.slotSettings?.[i] ?? {});
    });
    const restored: Sequence = { ...sequence, presetIds, slotSettings };

    const existing = sequences.find((s) => s.id === restored.id);
    if (existing && sameSequence(existing, restored)) {
      summary.sequencesUnchanged++;
    } else if (existing) {
      sequences.push({ ...restored, id: uuidv4(), name: `${restored.name} (restored)` });
      summary.sequencesCopied++;
    } else {
      sequences.push(restored);
      summary.sequencesAdded++;
    }
  }

  return { presets, sequences, summary };
}
