import { useState, useCallback, useEffect, useRef } from 'react';

interface SavePresetDialogProps {
  onSave: (name: string) => void;
  onClose: () => void;
}

export function SavePresetDialog({ onSave, onClose }: SavePresetDialogProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape even when focus has left the input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onSave(name.trim());
  }, [name, onSave]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-preset-title"
        onSubmit={handleSubmit}
        className="w-full max-w-sm mx-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 id="save-preset-title" className="text-lg font-bold text-[var(--text-primary)]">
            Save as Preset
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2">
          <label htmlFor="save-preset-name" className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Preset Name
          </label>
          <input
            id="save-preset-name"
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Preset name..."
            className="px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]
              text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm
              focus:outline-none focus:border-[var(--accent-primary)] transition-all-smooth"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-medium
              hover:bg-[var(--border-color)] transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium
              hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
