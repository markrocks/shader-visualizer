import { useCallback, useState } from 'react';
import { useSettingsStore, saveDirectoryHandle, clearDirectoryHandle } from '../../stores/settingsStore';
import { usePresetStore } from '../../stores/presetStore';
import { requestDirectoryAccess, isFileSystemAccessSupported } from '../../utils/fileStorage';

export function SettingsModal() {
  const { 
    storageFolderName, 
    directoryHandle,
    isSettingsOpen, 
    setIsSettingsOpen,
    setDirectoryHandle,
    clearStorage 
  } = useSettingsStore();
  
  const { loadFromFolder, syncToFolder, presets, sequences } = usePresetStore();
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSelectFolder = useCallback(async () => {
    setIsSelecting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const handle = await requestDirectoryAccess();
      if (handle) {
        // Save handle to IndexedDB for persistence
        await saveDirectoryHandle(handle);
        setDirectoryHandle(handle, handle.name);
        
        // Load existing data from folder
        await loadFromFolder(handle);
        setSuccess(`Loaded data from "${handle.name}"`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSelecting(false);
    }
  }, [setDirectoryHandle, loadFromFolder]);

  const handleClearFolder = useCallback(async () => {
    setError(null);
    setSuccess(null);
    
    try {
      await clearDirectoryHandle();
      clearStorage();
      setSuccess('Storage folder cleared. Using local storage only.');
    } catch (err) {
      setError((err as Error).message);
    }
  }, [clearStorage]);

  const handleSyncNow = useCallback(async () => {
    setError(null);
    setSuccess(null);
    
    if (!directoryHandle) {
      setError('No folder selected');
      return;
    }
    
    try {
      await syncToFolder();
      setSuccess('Data synced to folder successfully!');
    } catch (err) {
      setError((err as Error).message);
    }
  }, [directoryHandle, syncToFolder]);

  const handleClose = useCallback(() => {
    setIsSettingsOpen(false);
    setError(null);
    setSuccess(null);
  }, [setIsSettingsOpen]);

  if (!isSettingsOpen) return null;

  const isSupported = isFileSystemAccessSupported();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            ⚙️ Settings
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Storage Folder Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Storage Folder
            </h3>
            
            {!isSupported ? (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-sm">
                ⚠️ File System Access is not supported in your browser. 
                Data will be stored in browser local storage only.
              </div>
            ) : (
              <>
                <p className="text-sm text-[var(--text-muted)]">
                  Select a folder to save your presets and sequences. 
                  They will be stored as JSON files that you can backup or share.
                </p>

                {/* Current Folder Display */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <span className="text-2xl">📁</span>
                  <div className="flex-1 min-w-0">
                    {storageFolderName ? (
                      <>
                        <div className="font-medium text-[var(--text-primary)] truncate">
                          {storageFolderName}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {presets.length} presets, {sequences.length} sequences
                        </div>
                      </>
                    ) : (
                      <div className="text-[var(--text-muted)]">
                        No folder selected
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectFolder}
                    disabled={isSelecting}
                    className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium
                      hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSelecting ? 'Selecting...' : storageFolderName ? 'Change Folder' : 'Select Folder'}
                  </button>
                  
                  {storageFolderName && (
                    <>
                      <button
                        type="button"
                        onClick={handleSyncNow}
                        className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-medium
                          hover:bg-[var(--border-color)] transition-all"
                        title="Sync data to folder"
                      >
                        🔄 Sync
                      </button>
                      <button
                        type="button"
                        onClick={handleClearFolder}
                        className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium
                          hover:bg-red-500/20 transition-all"
                        title="Clear folder selection"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Status Messages */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              ❌ {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
              ✅ {success}
            </div>
          )}

          {/* Info Section */}
          <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-sm text-[var(--text-muted)]">
            <p className="font-medium text-[var(--text-secondary)] mb-1">💡 How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Presets are saved to <code className="px-1 bg-[var(--bg-secondary)] rounded">presets.json</code></li>
              <li>Sequences are saved to <code className="px-1 bg-[var(--bg-secondary)] rounded">sequences.json</code></li>
              <li>Changes are automatically synced when you modify data</li>
              <li>Data is also backed up in browser storage</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={handleClose}
            className="w-full px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-medium
              hover:bg-[var(--border-color)] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
