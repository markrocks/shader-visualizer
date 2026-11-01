import type { VisualizationParams } from '../../types';
import { TransitionCanvas } from './TransitionCanvas';

interface VisualizationCanvasProps {
  params: VisualizationParams;
  className?: string;
}

// A single effect. Uses the same render path as sequence playback, without a
// second layer.
export function VisualizationCanvas({ params, className = '' }: VisualizationCanvasProps) {
  return <TransitionCanvas paramsA={params} className={className} />;
}
