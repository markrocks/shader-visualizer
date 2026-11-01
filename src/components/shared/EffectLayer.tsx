import type { VisualizationParams } from '../../types';
import { MetaballsEffect, ParticlesEffect, NoiseEffect, KaleidoscopeEffect, PlasmaEffect, VoronoiEffect, TunnelEffect, TruchetEffect, CloudsEffect, PortedShaderEffect, PortedMultipassEffect } from './effects';
import { PORTED_FRAGMENT_SHADERS, PORTED_MULTIPASS_SHADERS } from '../../shaders/ported';

// The effect for a set of params, without camera or post-processing
export function EffectLayer({ params }: { params: VisualizationParams }) {
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
      case 'clouds':
        return <CloudsEffect params={params} />;
      default: {
        const multipass = PORTED_MULTIPASS_SHADERS[params.effectType];
        if (multipass) {
          return (
            <PortedMultipassEffect
              key={params.effectType}
              params={params}
              effectType={params.effectType}
              bufferShader={multipass.buffer}
              imageShader={multipass.image}
            />
          );
        }
        const portedShader = PORTED_FRAGMENT_SHADERS[params.effectType];
        if (portedShader) {
          return <PortedShaderEffect key={params.effectType} params={params} effectType={params.effectType} fragmentShader={portedShader} />;
        }
        return <MetaballsEffect params={params} />;
      }
    }
  };

  return renderEffect();
}
