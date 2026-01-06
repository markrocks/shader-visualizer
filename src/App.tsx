import { useState, useCallback, useEffect } from 'react';
import { ParameterPanel, PresetManager, SequenceBuilder, PreviewCanvas } from './components/ConfigMode';
import { FullscreenPlayer } from './components/PlayMode';
import { SettingsModal } from './components/Settings';
import { useSettingsStore, loadDirectoryHandle } from './stores/settingsStore';
import { usePresetStore } from './stores/presetStore';
import { verifyPermission } from './utils/fileStorage';
import type { Sequence } from './types';

type Tab = 'params' | 'presets' | 'sequences';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('params');
  const [playingSequence, setPlayingSequence] = useState<Sequence | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { setDirectoryHandle, setIsSettingsOpen, storageFolderName } = useSettingsStore();
  const { loadFromFolder, isLoading } = usePresetStore();

  // Load directory handle from IndexedDB on mount
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        const handle = await loadDirectoryHandle();
        if (handle) {
          // Verify we still have permission
          const hasPermission = await verifyPermission(handle);
          if (hasPermission) {
            setDirectoryHandle(handle, handle.name);
            await loadFromFolder(handle);
          } else {
            // Permission denied, clear the stored handle
            console.log('Permission denied to previously selected folder');
          }
        }
      } catch (error) {
        console.error('Error initializing storage:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeStorage();
  }, [setDirectoryHandle, loadFromFolder]);

  const handlePlaySequence = useCallback((sequence: Sequence) => {
    setPlayingSequence(sequence);
  }, []);

  const handleExitPlayer = useCallback(() => {
    setPlayingSequence(null);
  }, []);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, [setIsSettingsOpen]);

  // If we're playing a sequence, show the fullscreen player
  if (playingSequence) {
    return <FullscreenPlayer sequence={playingSequence} onExit={handleExitPlayer} />;
  }

  return (
    <div className="w-full h-full flex bg-[var(--bg-primary)]">
      {/* Settings Modal */}
      <SettingsModal />

      {/* Left Panel - Controls */}
      <div className="w-80 h-full flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              <span className="text-[var(--accent-primary)]">◉</span> Shader Visualizer
            </h1>
            <button
              type="button"
              onClick={handleOpenSettings}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              title="Settings"
            >
              ⚙️
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-[var(--text-muted)]">
              Create • Configure • Play
            </p>
            {storageFolderName && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
                📁 {storageFolderName}
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => handleTabChange('params')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all-smooth ${
              activeTab === 'params'
                ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)] bg-[var(--bg-primary)]/50'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Controls
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('presets')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all-smooth ${
              activeTab === 'presets'
                ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)] bg-[var(--bg-primary)]/50'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Presets
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('sequences')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all-smooth ${
              activeTab === 'sequences'
                ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)] bg-[var(--bg-primary)]/50'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Sequences
          </button>
        </div>

        {/* Loading State */}
        {(!isInitialized || isLoading) && (
          <div className="p-4 flex items-center justify-center gap-2 text-[var(--text-muted)] text-sm">
            <span className="animate-spin">⏳</span>
            <span>Loading...</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'params' && <ParameterPanel />}
          {activeTab === 'presets' && <PresetManager />}
          {activeTab === 'sequences' && <SequenceBuilder onPlaySequence={handlePlaySequence} />}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)]">
          <div className="text-xs text-[var(--text-muted)] text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">ESC</kbd> to exit fullscreen
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 h-full p-4">
        <PreviewCanvas />
      </div>
    </div>
  );
}

export default App;
