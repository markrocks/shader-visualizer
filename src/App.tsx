import { useState, useCallback } from 'react';
import { ParameterPanel, PresetManager, SequenceBuilder, PreviewCanvas } from './components/ConfigMode';
import { FullscreenPlayer } from './components/PlayMode';
import type { Sequence } from './types';

type Tab = 'params' | 'presets' | 'sequences';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('params');
  const [playingSequence, setPlayingSequence] = useState<Sequence | null>(null);

  const handlePlaySequence = useCallback((sequence: Sequence) => {
    setPlayingSequence(sequence);
  }, []);

  const handleExitPlayer = useCallback(() => {
    setPlayingSequence(null);
  }, []);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
  }, []);

  // If we're playing a sequence, show the fullscreen player
  if (playingSequence) {
    return <FullscreenPlayer sequence={playingSequence} onExit={handleExitPlayer} />;
  }

  return (
    <div className="w-full h-full flex bg-[var(--bg-primary)]">
      {/* Left Panel - Controls */}
      <div className="w-80 h-full flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)]">
          <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
            <span className="text-[var(--accent-primary)]">◉</span> Shader Visualizer
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Create • Configure • Play
          </p>
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
