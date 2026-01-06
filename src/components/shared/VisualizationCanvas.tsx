import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import type { VisualizationParams } from '../../types';
import { MetaballsEffect, ParticlesEffect, NoiseEffect, KaleidoscopeEffect } from './effects';

interface VisualizationCanvasProps {
  params: VisualizationParams;
  className?: string;
}

function Scene({ params }: { params: VisualizationParams }) {
  const renderEffect = () => {
    switch (params.effectType) {
      case 'metaballs':
        return <MetaballsEffect params={params} />;
      case 'particles':
        return <ParticlesEffect params={params} />;
      case 'noise':
        return <NoiseEffect params={params} />;
      case 'kaleidoscope':
        return <KaleidoscopeEffect params={params} />;
      default:
        return <MetaballsEffect params={params} />;
    }
  };

  return (
    <>
      {renderEffect()}
      <EffectComposer>
        <Bloom
          intensity={params.intensity * 0.5}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export function VisualizationCanvas({ params, className = '' }: VisualizationCanvasProps) {
  return (
    <div className={`w-full h-full ${className}`} style={{ background: params.backgroundColor }}>
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Scene params={params} />
      </Canvas>
    </div>
  );
}
