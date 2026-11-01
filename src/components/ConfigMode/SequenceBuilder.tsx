import { useState, useCallback, useRef } from 'react';
import { usePresetStore } from '../../stores/presetStore';
import type { Sequence } from '../../types';
import { EASINGS, TRANSITIONS, type TransitionChoice, type TransitionEasing } from '../../shaders/transitions';
import { SequenceSlotEditor, SlotSummary } from './SequenceSlotEditor';
import { hasOverrides, slotOverrides } from '../../utils/sequenceSlots';
import { createSequenceBackup, downloadBackup, parseSequenceBackup, type RestoreSummary } from '../../utils/sequenceBackup';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function describeRestore(summary: RestoreSummary): string {
  if (!summary.sequencesAdded && !summary.sequencesCopied && !summary.presetsAdded) {
    return `Nothing new to restore: ${plural(summary.sequencesUnchanged, 'sequence')} already up to date.`;
  }
  const parts = [];
  if (summary.sequencesAdded) parts.push(`Restored ${plural(summary.sequencesAdded, 'sequence')}`);
  if (summary.sequencesCopied) parts.push(`${plural(summary.sequencesCopied, 'changed sequence')} added as a copy`);
  if (summary.sequencesUnchanged) parts.push(`${plural(summary.sequencesUnchanged, 'sequence')} already up to date`);
  if (summary.presetsAdded) parts.push(`${plural(summary.presetsAdded, 'preset')} added`);
  if (summary.missingPresets) parts.push(`${plural(summary.missingPresets, 'missing preset')} skipped`);
  const text = parts.join(', ');
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

interface SequenceBuilderProps {
  onPlaySequence: (sequence: Sequence) => void;
  onSelectSequence?: (sequence: Sequence | null) => void;
}

export function SequenceBuilder({ onPlaySequence, onSelectSequence }: SequenceBuilderProps) {
  const [newSequenceName, setNewSequenceName] = useState('');
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [draggedPresetIndex, setDraggedPresetIndex] = useState<number | null>(null);
  // Position in the selected sequence whose per-preset settings are open
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null);
  const [backupMessage, setBackupMessage] = useState<{ text: string; error: boolean } | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const {
    presets,
    sequences,
    addSequence,
    updateSequence,
    deleteSequence,
    addPresetToSequence,
    removePresetFromSequence,
    reorderSequencePresets,
    updateSequenceSlot,
    restoreSequenceBackup,
    getPreset,
  } = usePresetStore();

  const handleBackup = useCallback(() => {
    downloadBackup(createSequenceBackup(sequences, presets));
    setBackupMessage({ text: `Backed up ${plural(sequences.length, 'sequence')}.`, error: false });
  }, [sequences, presets]);

  const handleRestoreFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Clear so choosing the same file again still triggers a change
    e.target.value = '';
    if (!file) return;
    try {
      const backup = parseSequenceBackup(await file.text());
      const summary = await restoreSequenceBackup(backup);
      setBackupMessage({ text: describeRestore(summary), error: false });
    } catch (error) {
      setBackupMessage({ text: `Couldn't restore ${file.name}: ${(error as Error).message}`, error: true });
    }
  }, [restoreSequenceBackup]);

  const selectedSequence = selectedSequenceId
    ? sequences.find((s) => s.id === selectedSequenceId)
    : null;

  const handleCreateSequence = useCallback(async () => {
    if (newSequenceName.trim()) {
      const sequence = await addSequence(newSequenceName.trim());
      setSelectedSequenceId(sequence.id);
      setNewSequenceName('');
    }
  }, [newSequenceName, addSequence]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') handleCreateSequence();
  }, [handleCreateSequence]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedPresetIndex(index);
    setExpandedSlot(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedPresetIndex !== null && draggedPresetIndex !== index && selectedSequenceId) {
      reorderSequencePresets(selectedSequenceId, draggedPresetIndex, index);
      setDraggedPresetIndex(index);
    }
  }, [draggedPresetIndex, selectedSequenceId, reorderSequencePresets]);

  const handleDragEnd = useCallback(() => {
    setDraggedPresetIndex(null);
  }, []);

  const handleAddPresetToSequence = useCallback((presetId: string) => {
    if (selectedSequenceId) {
      addPresetToSequence(selectedSequenceId, presetId);
    }
  }, [selectedSequenceId, addPresetToSequence]);

  const handleSelectSequence = useCallback((id: string) => {
    if (id !== selectedSequenceId) setExpandedSlot(null);
    setSelectedSequenceId(id);
    const sequence = sequences.find((s) => s.id === id);
    if (sequence && onSelectSequence) {
      onSelectSequence(sequence);
    }
  }, [sequences, onSelectSequence, selectedSequenceId]);

  const handlePlaySequence = useCallback((sequence: Sequence, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sequence.presetIds.length > 0) {
      onPlaySequence(sequence);
    }
  }, [onPlaySequence]);

  const handleDeleteSequence = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSequence(id);
    if (selectedSequenceId === id) {
      setSelectedSequenceId(null);
    }
  }, [deleteSequence, selectedSequenceId]);

  const handleRemovePresetFromSequence = useCallback((index: number) => {
    if (selectedSequenceId) {
      removePresetFromSequence(selectedSequenceId, index);
      setExpandedSlot(null);
    }
  }, [selectedSequenceId, removePresetFromSequence]);

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Sequences
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleBackup}
            disabled={sequences.length === 0}
            title="Download every sequence, with its settings and presets, as a JSON file"
            className="px-2 py-1 rounded text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)]
              border border-[var(--border-color)] hover:border-[var(--accent-primary)]
              disabled:opacity-50 disabled:cursor-not-allowed transition-all-smooth"
          >
            ⬇️ Back up
          </button>
          <button
            type="button"
            onClick={() => restoreInputRef.current?.click()}
            title="Add the sequences from a backup file. Existing sequences are kept."
            className="px-2 py-1 rounded text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)]
              border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-all-smooth"
          >
            ⬆️ Restore
          </button>
          <input
            ref={restoreInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleRestoreFile}
            className="hidden"
            aria-label="Restore sequences from a backup file"
          />
        </div>
      </div>

      {backupMessage && (
        <div
          role="status"
          className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs border ${
            backupMessage.error
              ? 'bg-red-500/10 border-red-500/40 text-red-300'
              : 'bg-green-500/10 border-green-500/40 text-green-300'
          }`}
        >
          <span className="flex-1">{backupMessage.text}</span>
          <button type="button" onClick={() => setBackupMessage(null)} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Create New Sequence */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newSequenceName}
          onChange={(e) => setNewSequenceName(e.target.value)}
          placeholder="New sequence name..."
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]
            text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm
            focus:outline-none focus:border-[var(--accent-primary)] transition-all-smooth"
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={handleCreateSequence}
          disabled={!newSequenceName.trim()}
          className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium
            hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all-smooth"
        >
          Create
        </button>
      </div>

      {/* Sequence List */}
      <div className="flex flex-col gap-2">
        {sequences.length === 0 ? (
          <div className="text-center py-4 text-[var(--text-muted)] text-sm">
            No sequences created yet.
          </div>
        ) : (
          sequences.map((sequence) => (
            <div
              key={sequence.id}
              onClick={() => handleSelectSequence(sequence.id)}
              className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer
                border transition-all-smooth ${
                  selectedSequenceId === sequence.id
                    ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]'
                    : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50'
                }`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[var(--text-primary)] text-sm truncate">
                  {sequence.name}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {sequence.presetIds.length} preset{sequence.presetIds.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => handlePlaySequence(sequence, e)}
                  disabled={sequence.presetIds.length === 0}
                  className="p-1.5 rounded hover:bg-green-500/20 text-[var(--text-secondary)]
                    hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all-smooth"
                  title="Play sequence"
                >
                  ▶️
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteSequence(sequence.id, e)}
                  className="p-1.5 rounded hover:bg-red-500/20 text-[var(--text-secondary)]
                    hover:text-red-400 transition-all-smooth"
                  title="Delete sequence"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Sequence Editor */}
      {selectedSequence && (
        <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border-color)]">
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Editing: {selectedSequence.name}
          </h4>

          <p className="text-xs text-[var(--text-muted)]">
            These settings apply to every preset. Use ⚙️ on a preset below to give it its own timing or transition.
          </p>

          {/* Timing Settings */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-muted)]">Preset Duration (s)</label>
              <input
                type="number"
                value={selectedSequence.presetDuration}
                onChange={(e) =>
                  updateSequence(selectedSequence.id, {
                    presetDuration: parseFloat(e.target.value) || 10,
                  })
                }
                onKeyDown={(e) => e.stopPropagation()}
                min={1}
                max={300}
                className="px-2 py-1.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                  text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-muted)]">Transition (s)</label>
              <input
                type="number"
                value={selectedSequence.transitionDuration}
                onChange={(e) =>
                  updateSequence(selectedSequence.id, {
                    transitionDuration: parseFloat(e.target.value) || 2,
                  })
                }
                onKeyDown={(e) => e.stopPropagation()}
                min={0}
                max={10}
                step={0.5}
                className="px-2 py-1.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                  text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          {/* Transition Style */}
          <div className="flex flex-col gap-1">
            <label htmlFor="transition-style" className="text-xs text-[var(--text-muted)]">Transition Style</label>
            <select
              id="transition-style"
              value={selectedSequence.transitionType ?? 'crossfade'}
              onChange={(e) =>
                updateSequence(selectedSequence.id, { transitionType: e.target.value as TransitionChoice })
              }
              className="px-2 py-1.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
            >
              {TRANSITIONS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
              <option value="random">🎲 Random</option>
            </select>
            <p className="text-xs text-[var(--text-muted)]">
              {selectedSequence.transitionType === 'random'
                ? 'Picks a different transition style for each change.'
                : TRANSITIONS.find((t) => t.id === (selectedSequence.transitionType ?? 'crossfade'))?.description}
            </p>
          </div>

          {/* Transition Easing */}
          <div className="flex flex-col gap-1">
            <label htmlFor="transition-easing" className="text-xs text-[var(--text-muted)]">Transition Easing</label>
            <select
              id="transition-easing"
              value={selectedSequence.transitionEasing ?? 'smooth'}
              onChange={(e) =>
                updateSequence(selectedSequence.id, { transitionEasing: e.target.value as TransitionEasing })
              }
              className="px-2 py-1.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)]
                text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
            >
              {EASINGS.map((easing) => (
                <option key={easing.id} value={easing.id}>{easing.label}</option>
              ))}
            </select>
            <p className="text-xs text-[var(--text-muted)]">
              {EASINGS.find((e) => e.id === (selectedSequence.transitionEasing ?? 'smooth'))?.description}
            </p>
          </div>

          {/* Loop Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedSequence.looping}
              onChange={(e) =>
                updateSequence(selectedSequence.id, { looping: e.target.checked })
              }
              className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-tertiary)]
                checked:bg-[var(--accent-primary)] checked:border-[var(--accent-primary)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">Loop sequence</span>
          </label>

          {/* Sequence Presets */}
          <div className="flex flex-col gap-2">
            <div className="text-xs text-[var(--text-muted)] uppercase">Preset Order</div>
            {selectedSequence.presetIds.length === 0 ? (
              <div className="text-center py-3 text-[var(--text-muted)] text-xs border border-dashed border-[var(--border-color)] rounded-lg">
                Add presets from the list below
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {selectedSequence.presetIds.map((presetId, index) => {
                  const preset = getPreset(presetId);
                  if (!preset) return null;
                  const count = selectedSequence.presetIds.length;
                  const expanded = expandedSlot === index;
                  const overridden = hasOverrides(slotOverrides(selectedSequence, index));
                  const nextPreset = getPreset(selectedSequence.presetIds[(index + 1) % count]);
                  return (
                    <div key={`${presetId}-${index}`} className="flex flex-col gap-1">
                      <div
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-2 p-2 rounded bg-[var(--bg-secondary)] border
                          cursor-move hover:border-[var(--accent-primary)]/50 transition-all-smooth ${
                            expanded ? 'border-[var(--accent-primary)]' : 'border-[var(--border-color)]'
                          } ${draggedPresetIndex === index ? 'opacity-50' : ''}`}
                      >
                        <span className="text-[var(--text-muted)] text-xs w-5">{index + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[var(--text-primary)] truncate">{preset.name}</div>
                          <SlotSummary sequence={selectedSequence} index={index} />
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedSlot(expanded ? null : index)}
                          aria-expanded={expanded}
                          title="Timing and transition for this preset"
                          className={`relative p-1 rounded hover:bg-[var(--accent-primary)]/20 transition-all-smooth ${
                            expanded ? 'bg-[var(--accent-primary)]/20' : ''
                          }`}
                        >
                          ⚙️
                          {overridden && (
                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePresetFromSequence(index)}
                          className="p-1 rounded hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                      {expanded && (
                        <SequenceSlotEditor
                          sequence={selectedSequence}
                          index={index}
                          nextPresetName={nextPreset?.name ?? null}
                          onChange={(settings) => updateSequenceSlot(selectedSequence.id, index, settings)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Presets */}
          {presets.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-xs text-[var(--text-muted)] uppercase">Add Presets</div>
              <div className="flex flex-wrap gap-1">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleAddPresetToSequence(preset.id)}
                    className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs
                      hover:bg-[var(--accent-primary)] hover:text-white transition-all-smooth"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
