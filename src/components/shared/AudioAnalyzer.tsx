import { useRef, useCallback } from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer';

export function AudioAnalyzer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isActive, startMicrophone, stopMicrophone, loadAudioFile, initialize } = useAudioAnalyzer();
  const { audioSource, audioElement } = useAudioStore();

  const handleMicrophoneClick = useCallback(async () => {
    if (isActive && audioSource === 'microphone') {
      stopMicrophone();
    } else {
      await initialize();
      await startMicrophone();
    }
  }, [isActive, audioSource, initialize, startMicrophone, stopMicrophone]);

  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        await initialize();
        await loadAudioFile(file);
      }
    },
    [initialize, loadAudioFile]
  );

  const handlePlayPause = useCallback(() => {
    if (audioElement) {
      if (audioElement.paused) {
        audioElement.play();
      } else {
        audioElement.pause();
      }
    }
  }, [audioElement]);

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
        Audio Source
      </label>
      
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleMicrophoneClick}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
            isActive && audioSource === 'microphone'
              ? 'bg-[var(--accent-primary)] text-white glow'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
          }`}
        >
          {isActive && audioSource === 'microphone' ? '🎤 Listening...' : '🎤 Microphone'}
        </button>

        <button
          type="button"
          onClick={handleFileButtonClick}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
            isActive && audioSource === 'file'
              ? 'bg-[var(--accent-primary)] text-white glow'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
          }`}
        >
          📁 Audio File
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {isActive && audioSource === 'file' && audioElement && (
        <button
          type="button"
          onClick={handlePlayPause}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] transition-all-smooth"
        >
          {audioElement.paused ? '▶️ Play' : '⏸️ Pause'}
        </button>
      )}
    </div>
  );
}
