import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { OrthographicCamera } from '@react-three/drei';
import type { VisualizationParams } from '../../types';
import { MetaballsEffect, ParticlesEffect, NoiseEffect, KaleidoscopeEffect, PlasmaEffect, VoronoiEffect, TunnelEffect, TruchetEffect } from './effects';

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
      case 'plasma':
        return <PlasmaEffect params={params} />;
      case 'voronoi':
        return <VoronoiEffect params={params} />;
      case 'tunnel':
        return <TunnelEffect params={params} />;
      case 'truchet':
        return <TruchetEffect params={params} />;
      default:
        return <MetaballsEffect params={params} />;
    }
  };

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 1]} />
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
    <div className={`w-full h-full ${className}`} style={{ background: '#000' }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene params={params} />
      </Canvas>
    </div>
  );
}
