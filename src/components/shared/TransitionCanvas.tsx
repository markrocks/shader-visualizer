import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { OrthographicCamera, useFBO } from '@react-three/drei';
import { BloomEffect } from 'postprocessing';
import * as THREE from 'three';
import type { VisualizationParams } from '../../types';
import { EffectLayer } from './EffectLayer';
import { RenderScaleContext, LayerVisibleContext } from './renderScaleContext';
import { AutoQuality, PerformanceProbe } from './CanvasPerformance';
import { PerformanceOverlay } from './PerformanceOverlay';
import { useSettingsStore } from '../../stores/settingsStore';
import { dprRange, renderScale, type QualityLevel } from '../../shaders/performance';
import { transitionVertexShader, transitionFragmentShader, transitionIndex, type TransitionId } from '../../shaders/transitions';

export interface TransitionState {
  // Which layer is outgoing; progress runs from it (0) to the other layer (1)
  from: 'A' | 'B';
  progress: number;
  transition: TransitionId;
}

interface TransitionCanvasProps {
  paramsA: VisualizationParams;
  // Second layer for sequence playback. Both layers stay mounted so neither
  // effect restarts, and the next preset can load (and compile) early.
  paramsB?: VisualizationParams;
  // Read every frame, so playback can animate without re-rendering React
  transitionRef?: RefObject<TransitionState>;
  className?: string;
}

const IDLE: TransitionState = { from: 'A', progress: 0, transition: 'crossfade' };

const fboSettings = { type: THREE.HalfFloatType, depthBuffer: false };

interface TransitionSceneProps extends Omit<TransitionCanvasProps, 'className'> {
  quality: QualityLevel;
  bloom: boolean;
}

function TransitionScene({ paramsA, paramsB, transitionRef, quality, bloom }: TransitionSceneProps) {
  const { gl, camera, size, viewport } = useThree();
  const sceneA = useMemo(() => new THREE.Scene(), []);
  const sceneB = useMemo(() => new THREE.Scene(), []);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const visibleScaleRef = useRef(1);
  const visibleA = useRef(true);
  const visibleB = useRef(false);

  // Created here (not via <Bloom>) so its intensity can follow transitions
  // each frame without re-rendering
  const bloomEffect = useMemo(
    () => new BloomEffect({ intensity: 0.4, luminanceThreshold: 0.6, luminanceSmoothing: 0.9, mipmapBlur: true }),
    []
  );
  // Mutated each frame through a ref, like the effects' material refs
  const bloomRef = useRef(bloomEffect);
  useEffect(() => () => bloomEffect.dispose(), [bloomEffect]);

  // Heavy effects render at a fraction of the canvas resolution and are
  // scaled up by the composite pass
  const scaleA = renderScale(paramsA.effectType, quality);
  const scaleB = paramsB ? renderScale(paramsB.effectType, quality) : 1;
  const pixels = (scale: number) => Math.max(1, Math.round(size.width * viewport.dpr * scale));
  const rows = (scale: number) => Math.max(1, Math.round(size.height * viewport.dpr * scale));
  const fboA = useFBO(pixels(scaleA), rows(scaleA), fboSettings);
  const fboB = useFBO(paramsB ? pixels(scaleB) : 1, paramsB ? rows(scaleB) : 1, fboSettings);

  // During sequences, compile a layer's shaders as soon as a preset loads into
  // it. The next preset loads right after a transition ends, so compiling
  // happens then instead of stalling the first frame of the next transition.
  // (Synchronous: compileAsync needs KHR_parallel_shader_compile and throws if
  // a material is disposed mid-compile.)
  const effectA = paramsA.effectType;
  const effectB = paramsB?.effectType;
  useEffect(() => {
    if (effectB) gl.compile(sceneA, camera);
  }, [gl, camera, sceneA, effectA, effectB]);
  useEffect(() => {
    if (effectB) gl.compile(sceneB, camera);
  }, [gl, camera, sceneB, effectB]);

  const uniforms = useMemo(
    () => ({
      tFrom: { value: null as THREE.Texture | null },
      tTo: { value: null as THREE.Texture | null },
      uProgress: { value: 0 },
      uType: { value: 0 },
      uAspect: { value: 1 },
      uEncodeSRGB: { value: 0 },
    }),
    []
  );

  // Runs after the effects' own frame updates (they subscribe first as
  // children), and before EffectComposer draws the composite with bloom
  useFrame(() => {
    const t = (paramsB && transitionRef?.current) || IDLE;
    const p = paramsB ? Math.min(Math.max(t.progress, 0), 1) : 0;
    const fromIsA = !paramsB || t.from === 'A';
    const [fromScene, toScene, fromFbo, toFbo] = fromIsA
      ? [sceneA, sceneB, fboA, fboB]
      : [sceneB, sceneA, fboB, fboA];

    // Only render the layers that are visible
    const previousTarget = gl.getRenderTarget();
    if (p < 1) {
      gl.setRenderTarget(fromFbo);
      gl.render(fromScene, camera);
    }
    if (p > 0) {
      gl.setRenderTarget(toFbo);
      gl.render(toScene, camera);
    }
    gl.setRenderTarget(previousTarget);

    if (materialRef.current) {
      const u = materialRef.current.uniforms;
      u.tFrom.value = fromFbo.texture;
      u.tTo.value = toFbo.texture;
      u.uProgress.value = p;
      u.uType.value = transitionIndex(t.transition);
      u.uAspect.value = size.width / Math.max(size.height, 1);
      // EffectComposer converts to sRGB for the screen; without it, do it here
      u.uEncodeSRGB.value = bloom ? 0 : 1;
    }

    const fromParams = fromIsA ? paramsA : paramsB!;
    const toParams = fromIsA ? (paramsB ?? paramsA) : paramsA;
    bloomRef.current.intensity = (fromParams.intensity * (1 - p) + toParams.intensity * p) * 0.5;
    visibleScaleRef.current = fromIsA ? scaleA : scaleB;
    visibleA.current = fromIsA ? p < 1 : p > 0;
    visibleB.current = !!paramsB && (fromIsA ? p > 0 : p < 1);
  });

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 1]} />
      {createPortal(
        <RenderScaleContext.Provider value={scaleA}>
          <LayerVisibleContext.Provider value={visibleA}>
            <EffectLayer params={paramsA} />
          </LayerVisibleContext.Provider>
        </RenderScaleContext.Provider>,
        sceneA
      )}
      {paramsB && createPortal(
        <RenderScaleContext.Provider value={scaleB}>
          <LayerVisibleContext.Provider value={visibleB}>
            <EffectLayer params={paramsB} />
          </LayerVisibleContext.Provider>
        </RenderScaleContext.Provider>,
        sceneB
      )}
      <mesh scale={[viewport.width, viewport.height, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={transitionVertexShader}
          fragmentShader={transitionFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      {bloom && (
        // No multisampling: every effect is a full-screen shader with no
        // geometry edges to smooth, so 8× MSAA (the default) was pure cost
        <EffectComposer multisampling={0}>
          <primitive object={bloomEffect} />
        </EffectComposer>
      )}
      <PerformanceProbe renderScaleRef={visibleScaleRef} />
    </>
  );
}

// Renders one effect, or two blended by a transition shader, on one canvas
export function TransitionCanvas({ className = '', ...props }: TransitionCanvasProps) {
  const quality = useSettingsStore((state) => state.quality);
  const bloom = useSettingsStore((state) => state.bloom);
  const range = dprRange(quality);
  const [autoDpr, setAutoDpr] = useState(range[1]);
  const dpr = quality === 'auto' ? Math.min(Math.max(autoDpr, range[0]), range[1]) : range[1];

  return (
    <div className={`relative w-full h-full ${className}`} style={{ background: '#000' }}>
      <Canvas
        // Anti-aliasing smooths geometry edges; these shaders have none
        gl={{ antialias: false, alpha: false }}
        dpr={dpr}
        style={{ width: '100%', height: '100%' }}
      >
        {quality === 'auto' && <AutoQuality range={range} onDpr={setAutoDpr} />}
        <TransitionScene {...props} quality={quality} bloom={bloom} />
      </Canvas>
      <PerformanceOverlay />
    </div>
  );
}
