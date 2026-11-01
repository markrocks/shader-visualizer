import { usePerfStore } from '../../stores/perfStore';
import { useSettingsStore } from '../../stores/settingsStore';

function fpsColor(fps: number): string {
  if (fps >= 55) return 'text-green-400';
  if (fps >= 30) return 'text-yellow-400';
  return 'text-red-400';
}

// FPS graph: one bar per half-second sample, scaled to 60 FPS
function FpsGraph({ history }: { history: number[] }) {
  return (
    <div className="flex items-end gap-px h-6" aria-hidden="true">
      {history.map((fps, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-sm ${fps >= 55 ? 'bg-green-400/80' : fps >= 30 ? 'bg-yellow-400/80' : 'bg-red-400/80'}`}
          style={{ height: `${Math.max(8, Math.min(100, (fps / 60) * 100))}%` }}
        />
      ))}
    </div>
  );
}

// Live rendering stats in a corner of the canvas it's placed over
export function PerformanceOverlay({ className = 'top-3 right-3' }: { className?: string }) {
  const show = useSettingsStore((state) => state.showPerformance);
  const stats = usePerfStore((state) => state.stats);
  if (!show || !stats) return null;

  return (
    <div
      className={`absolute ${className} z-20 pointer-events-none select-none rounded-lg bg-black/65
        backdrop-blur-sm px-3 py-2 font-mono text-[11px] leading-tight text-white/75 flex flex-col gap-1`}
      role="status"
      aria-label={`${Math.round(stats.fps)} frames per second`}
    >
      <div className="flex items-baseline gap-2">
        <span className={`text-lg font-bold ${fpsColor(stats.fps)}`}>{Math.round(stats.fps)}</span>
        <span>FPS</span>
      </div>
      <FpsGraph history={stats.history} />
      <div>{stats.frameMs.toFixed(1)} ms avg · {stats.worstMs.toFixed(1)} ms worst</div>
      <div>
        {stats.width}×{stats.height} @ {stats.dpr.toFixed(2)}×
        {stats.renderScale < 1 && ` · effect ${Math.round(stats.renderScale * 100)}%`}
      </div>
      <div>{stats.programs} shader programs</div>
    </div>
  );
}
