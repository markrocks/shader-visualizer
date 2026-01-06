import { useState, useCallback } from 'react';
import { usePresetStore } from '../../stores/presetStore';
import { useVisualizationStore } from '../../stores/visualizationStore';
import type { Preset } from '../../types';

export function PresetManager() {
  const [newPresetName, setNewPresetName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const { params, setParams } = useVisualizationStore();
  const { presets, addPreset, updatePreset, deletePreset } = usePresetStore();

  const handleSavePreset = useCallback(() => {
    if (newPresetName.trim()) {
      addPreset(newPresetName.trim(), params);
      setNewPresetName('');
    }
  }, [newPresetName, params, addPreset]);

  const handleLoadPreset = useCallback((preset: Preset, e: React.MouseEvent) => {
    e.stopPropagation();
    setParams(preset.params);
  }, [setParams]);

  const handleStartEdit = useCallback((preset: Preset, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(preset.id);
    setEditName(preset.name);
  }, []);

  const handleSaveEdit = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editingId && editName.trim()) {
      updatePreset(editingId, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
    }
  }, [editingId, editName, updatePreset]);

  const handleCancelEdit = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
    setEditName('');
  }, []);

  const handleUpdatePresetParams = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updatePreset(id, { params });
  }, [params, updatePreset]);

  const handleDeletePreset = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePreset(id);
  }, [deletePreset]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') handleSavePreset();
  }, [handleSavePreset]);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') handleCancelEdit();
  }, [handleSaveEdit, handleCancelEdit]);

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
        Presets
      </h3>

      {/* Save New Preset */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newPresetName}
          onChange={(e) => setNewPresetName(e.target.value)}
          placeholder="Preset name..."
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]
            text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm
            focus:outline-none focus:border-[var(--accent-primary)] transition-all-smooth"
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={handleSavePreset}
          disabled={!newPresetName.trim()}
          className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium
            hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all-smooth"
        >
          Save
        </button>
      </div>

      {/* Preset List */}
      <div className="flex flex-col gap-2">
        {presets.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">
            No presets saved yet.
            <br />
            Configure a visualization and save it!
          </div>
        ) : (
          presets.map((preset) => (
            <div
              key={preset.id}
              className="group flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-tertiary)]
                border border-[var(--border-color)] hover:border-[var(--accent-primary)]
                transition-all-smooth"
            >
              {editingId === preset.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)]
                      text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={(e) => handleSaveEdit(e)}
                    className="px-2 py-1 rounded bg-[var(--accent-primary)] text-white text-xs"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCancelEdit(e)}
                    className="px-2 py-1 rounded bg-[var(--border-color)] text-[var(--text-secondary)] text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--text-primary)] text-sm truncate">
                      {preset.name}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {preset.params.effectType} • {preset.params.animationMode}
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => handleLoadPreset(preset, e)}
                      className="p-1.5 rounded hover:bg-[var(--accent-primary)] text-[var(--text-secondary)]
                        hover:text-white transition-all-smooth"
                      title="Load preset"
                    >
                      📥
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleUpdatePresetParams(preset.id, e)}
                      className="p-1.5 rounded hover:bg-[var(--accent-secondary)] text-[var(--text-secondary)]
                        hover:text-white transition-all-smooth"
                      title="Update with current settings"
                    >
                      🔄
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleStartEdit(preset, e)}
                      className="p-1.5 rounded hover:bg-[var(--border-color)] text-[var(--text-secondary)]
                        hover:text-white transition-all-smooth"
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeletePreset(preset.id, e)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-[var(--text-secondary)]
                        hover:text-red-400 transition-all-smooth"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
