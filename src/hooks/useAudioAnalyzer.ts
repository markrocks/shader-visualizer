import { useAudioStore } from '../stores/audioStore';

// Audio source controls for the Audio panel. The per-frame analysis runs in
// useAudioAnalysisLoop, mounted once by App.
export function useAudioAnalyzer() {
  const {
    isActive,
    startMicrophone,
    stopMicrophone,
    loadAudioFile,
    initialize,
  } = useAudioStore();

  return {
    isActive,
    startMicrophone,
    stopMicrophone,
    loadAudioFile,
    initialize,
  };
}
