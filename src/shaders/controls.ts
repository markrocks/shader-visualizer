import type { EffectType, VisualizationParams } from '../types';

// Per-shader custom controls. Each control becomes a uniform named
// uCtl<Key> (float, or vec3 for colors). Defaults match the values the
// shaders had hard-coded, so untouched controls leave the effect unchanged.

interface ControlBase {
  key: string;
  label: string;
  // What the control changes in the image, shown in its info tip and the effect guide
  description: string;
}

export type ShaderControl = ControlBase & (
  // Whole number, shown as a stepper
  | { type: 'int'; default: number; min: number; max: number }
  // Open-ended decimal, shown as a number box
  | { type: 'float'; default: number; step: number; min?: number; max?: number }
  // Bounded decimal, shown as a slider
  | { type: 'range'; default: number; min: number; max: number; step?: number }
  // Hex color, passed to the shader as raw RGB (no color-space conversion)
  | { type: 'color'; default: string }
);

export const SHADER_CONTROLS: Record<EffectType, ShaderControl[]> = {
  metaballs: [
    { key: 'orbitRadius', label: 'Orbit Radius', type: 'range', default: 0.5, min: 0, max: 1.5, description: "How far the blobs swing out from the center as they orbit." },
    { key: 'noiseWander', label: 'Noise Wander', type: 'range', default: 0.5, min: 0, max: 1.5, description: "Random drift added to each blob's path; 0 gives clean, regular orbits." },
    { key: 'blobSize', label: 'Blob Size', type: 'range', default: 0.3, min: 0.05, max: 1, description: "Base size of each blob." },
    { key: 'blobPulse', label: 'Blob Pulse', type: 'range', default: 0.2, min: 0, max: 0.5, description: "How much each blob grows and shrinks over time." },
    { key: 'threshold', label: 'Merge Threshold', type: 'range', default: 1, min: 0.2, max: 3, description: "Where a blob's surface is drawn. Lower makes blobs fatter and merge sooner; higher makes them smaller and more separate." },
    { key: 'edgeSoftness', label: 'Edge Softness', type: 'range', default: 0.1, min: 0.01, max: 0.5, description: "Softness of the blob edges; low is crisp, high is blurry." },
    { key: 'glow', label: 'Glow', type: 'range', default: 0.1, min: 0, max: 0.5, description: "Halo of light around the blobs." },
    { key: 'vignette', label: 'Vignette', type: 'range', default: 0.5, min: 0, max: 1, description: "Darkening toward the corners." },
  ],
  particles: [
    { key: 'swirlSpeed', label: 'Swirl Speed', type: 'range', default: 0.5, min: -2, max: 2, description: "How fast the particles circle the center; negative reverses direction." },
    { key: 'wobble', label: 'Wobble', type: 'range', default: 0.2, min: 0, max: 1, description: "Random side-to-side jitter of each particle." },
    { key: 'depthWave', label: 'Depth Wave', type: 'range', default: 0.5, min: 0, max: 2, description: "How far particles bob toward and away from the camera." },
    { key: 'pointSize', label: 'Point Size', type: 'float', default: 300, step: 10, min: 10, description: "Base size of each particle on screen." },
    { key: 'softness', label: 'Edge Softness', type: 'range', default: 0.2, min: 0, max: 0.49, description: "Where particle edges start to fade; lower gives softer, fuzzier dots." },
    { key: 'glow', label: 'Glow', type: 'range', default: 0.3, min: 0, max: 1, description: "Extra brightness added to the center of each particle." },
  ],
  noise: [
    { key: 'warpStrength', label: 'Warp Strength', type: 'range', default: 4, min: 0, max: 8, description: "How strongly the noise bends itself; 0 gives plain clouds, high gives swirling marble." },
    { key: 'lacunarity', label: 'Lacunarity', type: 'range', default: 2, min: 1.5, max: 3, description: "Size step between noise layers; higher packs finer detail into each layer." },
    { key: 'gain', label: 'Octave Gain', type: 'range', default: 0.5, min: 0.3, max: 0.8, description: "How much each finer layer contributes; higher gives a rougher, grainier texture." },
    { key: 'waveMix', label: 'Wave Overlay', type: 'range', default: 0.2, min: 0, max: 1, description: "Strength of the wave stripes blended over the noise." },
    { key: 'glow', label: 'Glow', type: 'range', default: 0.3, min: 0, max: 1, description: "Extra glow on the brightest areas." },
  ],
  kaleidoscope: [
    { key: 'rotationSpeed', label: 'Rotation Speed', type: 'range', default: 0.2, min: -1, max: 1, description: "How fast the pattern turns; negative spins the other way." },
    { key: 'gridFrequency', label: 'Grid Frequency', type: 'range', default: 10, min: 1, max: 30, description: "Density of the checkered wave pattern." },
    { key: 'ringFrequency', label: 'Ring Frequency', type: 'range', default: 20, min: 1, max: 50, description: "Density of the concentric rings." },
    { key: 'hueSpeed', label: 'Hue Shift Speed', type: 'range', default: 0.1, min: 0, max: 0.5, description: "How fast the rainbow tint cycles through colors." },
    { key: 'colorBlend', label: 'Rainbow Blend', type: 'range', default: 0.5, min: 0, max: 1, description: "Mix between your colors (0) and the rainbow tint (1)." },
    { key: 'edgeFade', label: 'Edge Fade Radius', type: 'range', default: 1.5, min: 0.6, max: 3, description: "Radius where the pattern fades into the background." },
    { key: 'centerGlow', label: 'Center Glow Falloff', type: 'range', default: 3, min: 0.5, max: 10, description: "How tightly the bright center glow is focused; higher makes a smaller spot." },
  ],
  plasma: [
    { key: 'circleOrbit', label: 'Circle Wave Orbit', type: 'range', default: 0.5, min: 0, max: 2, description: "How far the center of the circular ripples wanders." },
    { key: 'layerSpread', label: 'Layer Spread', type: 'range', default: 0.5, min: 0, max: 2, description: "How far apart the extra wave layers drift." },
    { key: 'colorCycles', label: 'Color Cycles', type: 'range', default: 2, min: 0.5, max: 6, description: "How many times the colors repeat across the plasma." },
    { key: 'glow', label: 'Peak Glow', type: 'range', default: 0.5, min: 0, max: 2, description: "Extra glow on the brightest peaks." },
    { key: 'valleyTint', label: 'Valley Tint', type: 'range', default: 0.3, min: 0, max: 1, description: "How much the background color shows in the darkest areas." },
  ],
  voronoi: [
    { key: 'jitter', label: 'Point Jitter', type: 'range', default: 0.4, min: 0, max: 0.5, description: "How far each cell's center point moves; 0 freezes the cells." },
    { key: 'brightnessPulse', label: 'Brightness Pulse', type: 'range', default: 0.5, min: 0, max: 0.5, description: "How much cells pulse between bright and dim." },
    { key: 'edgeBrightness', label: 'Edge Brightness', type: 'range', default: 0.3, min: 0, max: 2, description: "Brightness of the borders between cells." },
    { key: 'cellGlow', label: 'Cell Glow', type: 'range', default: 0.3, min: 0, max: 1, description: "Glow at the center of each cell." },
  ],
  tunnel: [
    { key: 'angleSegments', label: 'Angle Segments', type: 'int', default: 8, min: 1, max: 32, description: "Number of spokes around the tunnel wall." },
    { key: 'spinSpeed', label: 'Spin Speed', type: 'range', default: 0.5, min: -3, max: 3, description: "How fast the spokes rotate; negative reverses." },
    { key: 'ringMix', label: 'Rings vs Segments', type: 'range', default: 0.7, min: 0, max: 1, description: "Balance between rings (1) and spokes (0)." },
    { key: 'warp', label: 'Warp', type: 'range', default: 0.1, min: 0, max: 0.5, description: "Wobbly distortion of the tunnel walls." },
    { key: 'centerGlow', label: 'Center Glow', type: 'range', default: 0.6, min: 0, max: 2, description: "Brightness of the light at the end of the tunnel." },
    { key: 'scanlines', label: 'Scanlines', type: 'range', default: 0.05, min: 0, max: 0.3, description: "Strength of the fine scanline stripes." },
    { key: 'scanlineDensity', label: 'Scanline Density', type: 'float', default: 30, step: 1, min: 0, description: "How closely spaced the scanlines are." },
    { key: 'vignette', label: 'Vignette', type: 'range', default: 0.3, min: 0, max: 1, description: "Darkening toward the edges." },
  ],
  truchet: [
    { key: 'arcRadius', label: 'Arc Radius', type: 'range', default: 0.5, min: 0.3, max: 0.7, description: "Radius of the arcs in each tile; 0.5 makes neighboring arcs join smoothly." },
    { key: 'drift', label: 'Drift', type: 'range', default: 0.5, min: 0, max: 2, description: "How far the whole grid slowly drifts around." },
    { key: 'linePulse', label: 'Line Pulse', type: 'range', default: 0.4, min: 0, max: 1, description: "How much the line thickness pulses over time." },
    { key: 'glowWidth', label: 'Glow Width', type: 'range', default: 3, min: 1, max: 6, description: "How far the glow spreads around each line." },
    { key: 'glowStrength', label: 'Glow Strength', type: 'range', default: 0.3, min: 0, max: 1, description: "Brightness of the glow around the lines." },
    { key: 'decorationSize', label: 'Decoration Size', type: 'range', default: 1, min: 0.2, max: 2, description: "Size of the small shapes in the middle of some tiles." },
    { key: 'backgroundPulse', label: 'Background Pulse', type: 'range', default: 0.05, min: 0, max: 0.3, description: "How much the whole image breathes brighter and darker." },
  ],
  clouds: [
    { key: 'octaves', label: 'Noise Octaves', type: 'int', default: 5, min: 1, max: 8, description: "Layers of detail in the cloud shapes; fewer is smoother and faster." },
    { key: 'turbulence', label: 'Turbulence', type: 'range', default: 0.1, min: 0, max: 0.5, description: "How much the clouds churn and distort." },
    { key: 'twist', label: 'Twist', type: 'range', default: 0.1, min: 0, max: 0.5, description: "How much the cloud tunnel twists around you." },
    { key: 'tunnelTightness', label: 'Tunnel Tightness', type: 'range', default: 0.2, min: 0, max: 1, description: "How narrow the clear path through the clouds is; 0 removes the tunnel." },
    { key: 'fog', label: 'Fog', type: 'range', default: 1, min: 0, max: 3, description: "Amount of distant haze." },
    { key: 'pathSway', label: 'Camera Sway', type: 'range', default: 0.85, min: 0, max: 2, description: "How much the camera swings side to side as it flies." },
  ],
  'universe-within': [
    { key: 'layers', label: 'Layers', type: 'int', default: 4, min: 1, max: 8, description: "Number of network layers stacked in depth." },
    { key: 'lineWidth', label: 'Line Width', type: 'range', default: 0.04, min: 0.015, max: 0.1, step: 0.001, description: "Thickness of the connecting lines." },
    { key: 'nodeMotion', label: 'Node Motion', type: 'range', default: 0.4, min: 0, max: 0.5, description: "How far each node wanders from its grid position." },
    { key: 'sparkle', label: 'Sparkle', type: 'range', default: 1, min: 0, max: 4, description: "Brightness of the twinkling points at the nodes." },
    { key: 'spin', label: 'Spin', type: 'range', default: 1, min: -3, max: 3, description: "How fast the network rotates; negative reverses." },
    { key: 'vignette', label: 'Vignette', type: 'range', default: 1, min: 0, max: 1.5, description: "Darkening toward the edges." },
  ],
  'star-nest': [
    { key: 'iterations', label: 'Iterations', type: 'int', default: 17, min: 1, max: 30, description: "Fractal detail per sample; more gives finer, sharper structures." },
    { key: 'formuparam', label: 'Formula Param', type: 'range', default: 0.53, min: 0.3, max: 0.8, step: 0.001, description: "The core fractal constant. Small changes reshape the whole nebula." },
    { key: 'volsteps', label: 'Volume Steps', type: 'int', default: 20, min: 1, max: 30, description: "Depth samples per pixel; more adds distant stars and gas but is slower." },
    { key: 'stepsize', label: 'Step Size', type: 'float', default: 0.1, step: 0.01, min: 0.01, description: "Distance between depth samples; larger reaches deeper into space." },
    { key: 'zoom', label: 'Zoom', type: 'float', default: 0.8, step: 0.05, description: "Field of view; higher zooms out." },
    { key: 'tile', label: 'Tile', type: 'float', default: 0.85, step: 0.01, min: 0.1, description: "Size of the repeating cell of space the fractal fills." },
    { key: 'speed', label: 'Drift Speed', type: 'float', default: 0.01, step: 0.001, description: "How fast you drift through space." },
    { key: 'brightness', label: 'Brightness', type: 'float', default: 0.0015, step: 0.0001, min: 0, description: "Brightness of the stars and gas." },
    { key: 'darkmatter', label: 'Dark Matter', type: 'range', default: 0.3, min: 0, max: 1, description: "Darkness of the dust clouds that block distant light." },
    { key: 'distfading', label: 'Distance Fading', type: 'range', default: 0.73, min: 0, max: 1, description: "How much distant layers fade; higher keeps more far-away detail." },
    { key: 'saturation', label: 'Saturation', type: 'range', default: 0.85, min: 0, max: 1, description: "Color intensity; 0 is grayscale." },
  ],
  'voronoi-distances': [
    { key: 'cellDensity', label: 'Cell Density', type: 'range', default: 8, min: 2, max: 30, description: "Number of cells across the screen." },
    { key: 'cellMotion', label: 'Cell Motion', type: 'range', default: 0.5, min: 0, max: 0.5, description: "How far the cell centers move; 0 freezes them." },
    { key: 'isolineFrequency', label: 'Isoline Frequency', type: 'float', default: 64, step: 1, min: 0, description: "Number of contour lines inside each cell." },
    { key: 'borderWidth', label: 'Border Width', type: 'range', default: 0.04, min: 0, max: 0.2, step: 0.005, description: "Thickness of the cell borders." },
    { key: 'pointSize', label: 'Point Size', type: 'range', default: 1, min: 0.05, max: 3, description: "Size of the dot at each cell's center." },
    { key: 'borderColor', label: 'Border Color', type: 'color', default: '#ff9900', description: "Color of the cell borders." },
    { key: 'pointColor', label: 'Point Color', type: 'color', default: '#ff991a', description: "Color of the center dots." },
  ],
  'warp-speed': [
    { key: 'steps', label: 'Ray Steps', type: 'int', default: 100, min: 10, max: 200, description: "Depth samples per pixel; more gives longer, smoother streaks but is slower." },
    { key: 'iterations', label: 'Fractal Iterations', type: 'int', default: 10, min: 1, max: 20, description: "Fractal detail; changes the texture of the star streaks." },
    { key: 'foldScale', label: 'Fold Scale', type: 'range', default: 2.04, min: 1.8, max: 2.3, step: 0.005, description: "Fractal fold scale; small changes reshape the streak patterns." },
    { key: 'foldOffset', label: 'Fold Offset', type: 'range', default: 0.9, min: 0.5, max: 1.3, description: "Fractal fold offset; shifts the structure and its density." },
    { key: 'stepLength', label: 'Step Length', type: 'float', default: 0.025, step: 0.001, min: 0.001, description: "Distance between depth samples; longer makes the streaks reach further." },
    { key: 'exposure', label: 'Exposure', type: 'range', default: 1, min: 0, max: 5, description: "Overall brightness of the streaks." },
  ],
  'drive-home': [
    { key: 'lightsPerSide', label: 'Lights Per Side', type: 'int', default: 8, min: 1, max: 24, description: "Number of street lamps and roadside lights." },
    { key: 'camShake', label: 'Camera Shake', type: 'range', default: 1, min: 0, max: 5, description: "How much the camera bumps along the road." },
    { key: 'laneBias', label: 'Lane Bias', type: 'range', default: 0.5, min: 0, max: 1, description: "How often the cars ahead change lanes." },
    { key: 'rain', label: 'Rain on Glass', type: 'range', default: 1, min: 0, max: 3, description: "Strength of the raindrop distortion on the windshield; 0 is dry glass." },
    { key: 'streetLightColor', label: 'Street Lights', type: 'color', default: '#ffb34d', description: "Color of the overhead street lamps." },
    { key: 'headLightColor', label: 'Headlights', type: 'color', default: '#ccccff', description: "Color of the oncoming headlights." },
    { key: 'tailLightColor', label: 'Tail Lights', type: 'color', default: '#ff1a1a', description: "Color of the tail lights ahead." },
    { key: 'skyColor', label: 'Sky Glow', type: 'color', default: '#9980e6', description: "Color of the glow in the sky." },
  ],
  'main-sequence-star': [
    { key: 'starRadius', label: 'Star Radius', type: 'range', default: 0.24, min: 0.05, max: 0.5, description: "Size of the star." },
    { key: 'corona', label: 'Corona Strength', type: 'range', default: 50, min: 0, max: 150, step: 1, description: "Brightness and reach of the flaming corona." },
    { key: 'coronaOctaves', label: 'Corona Detail', type: 'int', default: 7, min: 1, max: 7, description: "Layers of detail in the corona flames." },
    { key: 'starColor', label: 'Star Color', type: 'color', default: '#cca64d', description: "Main color of the star and its corona." },
    { key: 'glowColor', label: 'Glow Color', type: 'color', default: '#cc591a', description: "Color of the outer glow." },
  ],
  'water-caustics': [
    { key: 'iterations', label: 'Iterations', type: 'int', default: 5, min: 1, max: 10, description: "Layers of ripples; more gives busier light patterns." },
    { key: 'lineIntensity', label: 'Line Intensity', type: 'float', default: 0.005, step: 0.001, min: 0.001, description: "Thickness of the light lines; higher is broader, softer light." },
    { key: 'contrast', label: 'Contrast', type: 'range', default: 1.4, min: 0.5, max: 3, description: "Contrast between the light lines and the darker water." },
    { key: 'sharpness', label: 'Sharpness', type: 'range', default: 8, min: 1, max: 16, description: "How thin and crisp the brightest lines are." },
    { key: 'waterColor', label: 'Water Color', type: 'color', default: '#005980', description: "Base water tint under the light." },
  ],
  'plasma-globe': [
    { key: 'numRays', label: 'Rays', type: 'int', default: 13, min: 1, max: 30, description: "Number of electric tendrils." },
    { key: 'volumetricSteps', label: 'Ray Detail', type: 'int', default: 19, min: 1, max: 40, description: "Glow detail along each tendril; higher is slower." },
    { key: 'rayThickness', label: 'Ray Thickness', type: 'float', default: 0.011, step: 0.001, min: 0, description: "Thickness of the tendrils." },
    { key: 'rayBrightness', label: 'Ray Brightness', type: 'range', default: 5, min: 0, max: 15, description: "Brightness of the tendrils." },
    { key: 'spin', label: 'Spin', type: 'range', default: 1, min: -3, max: 3, description: "How fast the globe rotates; negative reverses." },
    { key: 'glassColor', label: 'Glass Color', type: 'color', default: '#1f1f80', description: "Tint of the glass on the near side." },
    { key: 'glassColor2', label: 'Glass Inner Color', type: 'color', default: '#8c338c', description: "Tint of the glass on the far side." },
    { key: 'backgroundColor', label: 'Background', type: 'color', default: '#030006', description: "Color behind the globe." },
  ],
  blue: [
    { key: 'steps', label: 'Ray Steps', type: 'int', default: 80, min: 10, max: 150, description: "Raymarch steps; more reveals deeper structure but is slower." },
    { key: 'flySpeed', label: 'Fly Speed', type: 'range', default: 4, min: 0, max: 12, description: "How fast the camera flies forward." },
    { key: 'foldOffset', label: 'Fold Offset', type: 'range', default: 4.5, min: 2, max: 8, description: "Fractal fold size; reshapes the whole structure." },
    { key: 'foldAngle', label: 'Fold Angle', type: 'range', default: 1, min: 0, max: 3.14, description: "Rotation between folds; reshapes the structure." },
    { key: 'repeatSpan', label: 'Repeat Span', type: 'range', default: 4, min: 2, max: 8, description: "Spacing of the repeating pattern." },
    { key: 'boxSize', label: 'Box Size', type: 'range', default: 0.8, min: 0.2, max: 1.5, description: "Size of the boxes carved into the structure." },
    { key: 'glowSharpness', label: 'Glow Sharpness', type: 'range', default: 1, min: 0.2, max: 3, description: "How tightly the glow hugs surfaces; higher is crisper." },
    { key: 'color', label: 'Color', type: 'color', default: '#004db3', description: "Color of the glow." },
  ],
  'liquid-carbon': [
    { key: 'refraction', label: 'Refraction', type: 'range', default: 0.9, min: 0.5, max: 1, description: "How strongly light bends through the slab; lower bends more." },
    { key: 'slabThickness', label: 'Slab Thickness', type: 'range', default: 0.05, min: 0.01, max: 0.5, description: "Thickness of the carbon slab." },
    { key: 'twist', label: 'Twist', type: 'range', default: 0.4, min: 0, max: 1.5, description: "How much the slab twists along its length." },
    { key: 'noiseAmount', label: 'Surface Noise', type: 'range', default: 0.4, min: 0, max: 1, description: "How lumpy and molten the surface is." },
    { key: 'noiseDetail', label: 'Noise Detail', type: 'range', default: 8, min: 1, max: 20, description: "Size of the surface lumps; higher gives finer detail." },
    { key: 'glowIntensity', label: 'Glow Intensity', type: 'range', default: 1, min: 0, max: 3, description: "Strength of the glowing haze around the slab." },
    { key: 'glowColor', label: 'Glow Color', type: 'color', default: '#ff4010', description: "Color of the glowing haze." },
    { key: 'cameraBounce', label: 'Camera Bounce', type: 'range', default: 1, min: 0, max: 3, description: "Strength of the camera jolt that happens every 10 seconds." },
    { key: 'focusBlur', label: 'Depth of Field', type: 'range', default: 1, min: 0, max: 3, description: "Strength of the depth-of-field blur on out-of-focus areas." },
    { key: 'blurSamples', label: 'Blur Samples', type: 'int', default: 80, min: 8, max: 128, description: "Quality of the blur; fewer samples are faster but grainier." },
  ],
  parametrics: [
    // 1 Hypotrochoid, 2 Epitrochoid, 3 Rose, 4 Lissajous, 5 Hypocycloid, 6 Triangle waves
    { key: 'curveType', label: 'Curve Type (1-6)', type: 'int', default: 2, min: 1, max: 6, description: "1 Hypotrochoid, 2 Epitrochoid, 3 Rose, 4 Lissajous, 5 Hypocycloid, 6 Triangle waves." },
    // 1 Default, 2 Vintage, 3 Argon
    { key: 'colorScheme', label: 'Color Scheme (1-3)', type: 'int', default: 1, min: 1, max: 3, description: "1 Default (warm glow), 2 Vintage, 3 Argon (purple neon)." },
    { key: 'zoom', label: 'Zoom', type: 'range', default: 19, min: 5, max: 40, description: "Zoom level; higher shows the curve smaller." },
    { key: 'grain', label: 'Film Grain', type: 'range', default: 1, min: 0, max: 3, description: "Amount of film grain." },
    { key: 'vignette', label: 'Vignette', type: 'range', default: 0.45, min: 0, max: 1.5, description: "Darkening toward the edges." },
  ],
};

export function controlUniformName(key: string): string {
  return `uCtl${key[0].toUpperCase()}${key.slice(1)}`;
}

export function getControlValue(params: VisualizationParams, effect: EffectType, control: ShaderControl): number | string {
  const value = params.shaderControls?.[effect]?.[control.key];
  if (control.type === 'color') return typeof value === 'string' ? value : control.default;
  return typeof value === 'number' && Number.isFinite(value) ? value : control.default;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// Prepends the uniform declarations for an effect's controls to its shader source
export function withControlUniforms(effect: EffectType, shader: string): string {
  const declarations = SHADER_CONTROLS[effect]
    .map((c) => `uniform ${c.type === 'color' ? 'vec3' : 'float'} ${controlUniformName(c.key)};`)
    .join('\n');
  return `${declarations}\n${shader}`;
}

export function createControlUniforms(effect: EffectType, params: VisualizationParams): Record<string, { value: number | number[] }> {
  const uniforms: Record<string, { value: number | number[] }> = {};
  for (const control of SHADER_CONTROLS[effect]) {
    const value = getControlValue(params, effect, control);
    uniforms[controlUniformName(control.key)] = {
      value: typeof value === 'string' ? hexToRgb(value) : value,
    };
  }
  return uniforms;
}

export function updateControlUniforms(
  uniforms: Record<string, { value: unknown }>,
  effect: EffectType,
  params: VisualizationParams
): void {
  for (const control of SHADER_CONTROLS[effect]) {
    const uniform = uniforms[controlUniformName(control.key)];
    if (!uniform) continue;
    const value = getControlValue(params, effect, control);
    if (typeof value === 'string') {
      // Colors: write into the existing array instead of allocating each frame
      const rgb = hexToRgb(value);
      const target = uniform.value as number[];
      target[0] = rgb[0];
      target[1] = rgb[1];
      target[2] = rgb[2];
    } else {
      uniform.value = value;
    }
  }
}
