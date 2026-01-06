import { useVisualizationStore } from '../../stores/visualizationStore';
import { VisualizationCanvas } from '../shared/VisualizationCanvas';

export function PreviewCanvas() {
  const params = useVisualizationStore((state) => state.params);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-[var(--border-color)]">
      <VisualizationCanvas params={params} />
      <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm
        text-xs text-white/70 font-medium pointer-events-none">
        Preview
      </div>
    </div>
  );
}
