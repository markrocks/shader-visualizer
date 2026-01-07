import { useState, useCallback } from 'react';
import { usePresetStore } from '../../stores/presetStore';
import type { Sequence } from '../../types';

interface SequenceBuilderProps {
  onPlaySequence: (sequence: Sequence) => void;
  onSelectSequence?: (sequence: Sequence | null) => void;
}

export function SequenceBuilder({ onPlaySequence, onSelectSequence }: SequenceBuilderProps) {
  const [newSequenceName, setNewSequenceName] = useState('');
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [draggedPresetIndex, setDraggedPresetIndex] = useState<number | null>(null);

  const {
    presets,
    sequences,
    addSequence,
    updateSequence,
    deleteSequence,
    addPresetToSequence,
    removePresetFromSequence,
    reorderSequencePresets,
    getPreset,
  } = usePresetStore();

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
    setSelectedSequenceId(id);
    const sequence = sequences.find((s) => s.id === id);
    if (sequence && onSelectSequence) {
      onSelectSequence(sequence);
    }
  }, [sequences, onSelectSequence]);

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
    }
  }, [selectedSequenceId, removePresetFromSequence]);

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
        Sequences
      </h3>

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
                  return (
                    <div
                      key={`${presetId}-${index}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 p-2 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)]
                        cursor-move hover:border-[var(--accent-primary)]/50 transition-all-smooth ${
                          draggedPresetIndex === index ? 'opacity-50' : ''
                        }`}
                    >
                      <span className="text-[var(--text-muted)] text-xs w-5">{index + 1}.</span>
                      <span className="flex-1 text-sm text-[var(--text-primary)] truncate">
                        {preset.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePresetFromSequence(index)}
                        className="p-1 rounded hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400"
                      >
                        ✕
                      </button>
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
