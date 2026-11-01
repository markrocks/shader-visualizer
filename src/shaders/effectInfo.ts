import type { EffectType } from '../types';

// User-facing descriptions for the effect guide and the About card.
// Shader Effects control descriptions live with the controls in controls.ts.

export interface EffectInfo {
  summary: string;
  credit?: {
    author: string;
    license: string;
    // Only links that appear in the original source
    link?: { label: string; url: string };
  };
  // How the shared Colors / Wave Frequency / audio settings apply to this effect
  colors: string;
  waveFrequency: string;
  audio: string;
  // The effect's own section in Controls (not Shader Effects)
  effectControls?: { label: string; description: string }[];
}

const PORT_COLORS = 'Not used: this effect keeps its own palette. Any recolorable parts are in Shader Effects.';
const PORT_WAVE = 'Not used by this effect.';
const PORT_AUDIO = 'Brightens with the music.';

export const EFFECT_INFO: Record<EffectType, EffectInfo> = {
  metaballs: {
    summary: 'Glowing blobs drift on looping orbits and melt together where they meet, like a lava lamp.',
    colors: 'Blobs shift between Primary and Secondary; Background fills the space around them.',
    waveFrequency: 'Number of color bands that ripple through the blobs.',
    audio: 'Blobs swell and swing wider with the music.',
    effectControls: [{ label: 'Blob Count', description: 'Number of blobs (up to 10).' }],
  },
  particles: {
    summary: 'A swirling cloud of soft, glowing points that blend together where they overlap.',
    colors: 'Each particle shimmers between Primary and Secondary. Background is not used.',
    waveFrequency: 'Not used by this effect.',
    audio: 'Particles spread out, grow and bob in depth with the music.',
    effectControls: [{ label: 'Particle Count', description: 'Number of particles. More looks denser but costs performance.' }],
  },
  noise: {
    summary: 'Fractal noise fed back into itself (domain warping), giving flowing, marbled liquid patterns.',
    colors: 'Dark to bright areas run Background, then Primary, then Secondary.',
    waveFrequency: 'Density of the wave stripes blended over the noise.',
    audio: 'Stronger contrast and more visible wave stripes with the music.',
    effectControls: [{ label: 'Octaves', description: 'Layers of noise detail; more adds finer texture.' }],
  },
  kaleidoscope: {
    summary: 'A moving pattern of waves and rings mirrored into symmetric wedges, with a rainbow tint and a glowing center.',
    colors: 'Primary and Secondary are blended with a rainbow tint; Background shows at the edges.',
    waveFrequency: 'Scales the density of both the grid pattern and the rings.',
    audio: 'Spins faster and the center glows brighter with the music.',
    effectControls: [{ label: 'Segments', description: 'Number of mirrored wedges.' }],
  },
  plasma: {
    summary: 'Classic demoscene plasma: overlapping sine waves blended into smooth, shifting color fields.',
    colors: 'Color cycles between Primary and Secondary; Background tints the darkest valleys.',
    waveFrequency: 'Size of the waves; higher gives more, tighter ripples.',
    audio: 'Stronger contrast with the music.',
    effectControls: [{ label: 'Complexity', description: 'Extra overlapping wave layers; more gives busier patterns.' }],
  },
  voronoi: {
    summary: 'A cellular mosaic: the screen splits into cells around moving points, each shaded between your colors.',
    colors: 'Cells are tinted between Primary and Secondary and fade toward Background; borders use a darkened Background.',
    waveFrequency: 'How fast the cell points move.',
    audio: 'Points push outward, borders thicken and cells brighten with the music.',
    effectControls: [
      { label: 'Cell Count', description: 'Number of cells across the screen.' },
      { label: 'Edge Width', description: 'Thickness of the borders between cells.' },
    ],
  },
  tunnel: {
    summary: 'An endless tunnel of rings and spokes rushing toward you, with a bright light at the far end.',
    colors: 'Rings shift between Primary and Secondary; Background tints the outer edges.',
    waveFrequency: 'Density of the rings.',
    audio: 'The tunnel pulses in depth with the music.',
    effectControls: [
      { label: 'Depth', description: 'How stretched the tunnel looks; higher pulls the rings closer together.' },
      { label: 'Rings', description: 'How many rings repeat along the tunnel.' },
    ],
  },
  truchet: {
    summary: 'Randomly rotated tiles of quarter-circle arcs that join into one continuous maze, with small shapes in some tiles.',
    colors: 'Lines shift from Primary to Secondary across the grid, on a Background base.',
    waveFrequency: 'Speed of the background brightness pulse.',
    audio: 'Lines thicken and the grid drifts more with the music.',
    effectControls: [
      { label: 'Grid Size', description: 'Number of tiles across the screen.' },
      { label: 'Line Width', description: 'Thickness of the maze lines.' },
    ],
  },
  clouds: {
    summary: 'A flight down a winding tunnel of raymarched volumetric clouds that slowly change shape and color.',
    credit: {
      author: 'nimitz',
      license: 'CC BY-NC-SA 3.0',
      link: { label: 'Protean clouds on Shadertoy', url: 'https://www.shadertoy.com/view/3l23Rh' },
    },
    colors: 'Only used when the Theme Colors slider is above 0: it recolors the clouds from Background (dark) through Secondary to Primary (bright).',
    waveFrequency: 'How fast the clouds cycle between their two shapes and color moods.',
    audio: 'Clouds churn harder and brighten with the music.',
    effectControls: [
      { label: 'Density', description: 'How thick the clouds are.' },
      { label: 'Theme Colors', description: '0 keeps the original teal palette; 1 fully recolors with your colors.' },
      { label: 'Quality', description: 'Raymarch steps; lower is faster but shows less depth.' },
    ],
  },
  'universe-within': {
    summary: 'Layer after layer of a glowing network of nodes and lines zooms toward you, with points that sparkle and pulse.',
    credit: {
      author: 'Martijn Steinrucken (BigWings)',
      license: 'CC BY-NC-SA 3.0',
      link: { label: 'Tutorial on YouTube', url: 'https://youtu.be/3CycKKJiwis' },
    },
    colors: 'Not used: the network slowly cycles through its own colors.',
    waveFrequency: PORT_WAVE,
    audio: 'A glow rises from the bottom of the screen, and the image brightens with the music.',
  },
  'star-nest': {
    summary: 'A volumetric fractal starfield of stars and colored gas you drift through, built from one repeated formula.',
    credit: { author: 'Pablo Roman Andrioli (Kali)', license: 'MIT' },
    colors: PORT_COLORS,
    waveFrequency: PORT_WAVE,
    audio: PORT_AUDIO,
  },
  'voronoi-distances': {
    summary: 'Voronoi cells with exact distance-to-border shading: contour lines inside each cell, bright borders and center points.',
    credit: {
      author: 'Inigo Quilez',
      license: 'MIT',
      link: { label: 'Article: Voronoi edges', url: 'https://iquilezles.org/articles/voronoilines' },
    },
    colors: 'Not used: the border and point colors are in Shader Effects.',
    waveFrequency: PORT_WAVE,
    audio: PORT_AUDIO,
  },
  'warp-speed': {
    summary: 'Streaks of starlight as you fly through a fractal volume at warp speed.',
    credit: { author: 'David Hoskins', license: 'CC BY-NC-SA 3.0' },
    colors: PORT_COLORS,
    waveFrequency: PORT_WAVE,
    audio: PORT_AUDIO,
  },
  'drive-home': {
    summary: 'A rainy night drive: blurred bokeh headlights, tail lights and street lamps seen through raindrops on the windshield.',
    credit: {
      author: 'Martijn Steinrucken (BigWings)',
      license: 'CC BY-NC-SA 3.0',
      link: { label: 'Making-of tutorial on YouTube', url: 'https://www.youtube.com/watch?v=eKtsY7hYTPg' },
    },
    colors: 'Not used: the light and sky colors are in Shader Effects.',
    waveFrequency: PORT_WAVE,
    audio: PORT_AUDIO,
  },
  'main-sequence-star': {
    summary: 'A burning star with a flickering, flame-like corona and a churning surface.',
    credit: {
      author: 'Not stated in the source; believed to be flight404, based on work by trisomie21',
      license: 'Not stated (Shadertoy default: CC BY-NC-SA 3.0)',
    },
    colors: 'Not used: the star and glow colors are in Shader Effects.',
    waveFrequency: PORT_WAVE,
    audio: 'The star swells and its corona flares with the music.',
  },
  'water-caustics': {
    summary: 'Shimmering light patterns like sunlight on the bottom of a swimming pool. The pattern tiles seamlessly.',
    credit: {
      author: 'David Hoskins, from an effect by joltz0r',
      license: 'Not stated (Shadertoy default: CC BY-NC-SA 3.0)',
    },
    colors: 'Not used: the water tint is in Shader Effects.',
    waveFrequency: PORT_WAVE,
    audio: PORT_AUDIO,
  },
  'plasma-globe': {
    summary: 'A glass plasma ball with electric tendrils arcing from the core out to the glass.',
    credit: {
      author: 'nimitz',
      license: 'CC BY-NC-SA 3.0',
      link: { label: 'Plasma Globe on Shadertoy', url: 'https://www.shadertoy.com/view/XsjXRm' },
    },
    colors: 'Not used: the glass and background colors are in Shader Effects.',
    waveFrequency: PORT_WAVE,
    audio: PORT_AUDIO,
  },
  blue: {
    summary: 'A flight through an endless folded fractal of boxes, spheres and octahedra, drawn as glowing blue light.',
    credit: { author: 'Not stated in the source', license: 'Not stated (Shadertoy default: CC BY-NC-SA 3.0)' },
    colors: 'Not used: the glow color is in Shader Effects.',
    waveFrequency: PORT_WAVE,
    audio: PORT_AUDIO,
  },
  parametrics: {
    summary: 'Glowing mathematical curves such as spirographs, roses and Lissajous figures that morph over time.',
    credit: {
      author: 'nimitz',
      license: 'CC BY-NC-SA 3.0',
      link: { label: 'Parametrics on Shadertoy', url: 'https://www.shadertoy.com/view/XdSSRw' },
    },
    colors: 'Not used: pick a Color Scheme in Shader Effects.',
    waveFrequency: PORT_WAVE,
    audio: PORT_AUDIO,
  },
  'liquid-carbon': {
    summary: 'A glossy, refractive slab of liquid carbon twisting in an orange glow, with depth-of-field blur.',
    credit: {
      author: 'Jochen "Virgill" Feldkötter (Alcatraz / Rhodium 4k intro)',
      license: 'Not stated (Shadertoy default: CC BY-NC-SA 3.0)',
      link: { label: 'The 4k intro on pouet.net', url: 'http://www.pouet.net/prod.php?which=68239' },
    },
    colors: 'Not used: the glow color is in Shader Effects.',
    waveFrequency: PORT_WAVE,
    audio: PORT_AUDIO,
  },
};

// Descriptions for the shared controls, shown in their info tips
export const SHARED_CONTROL_INFO = {
  speed: 'How fast the whole animation runs.',
  scale: 'Zooms the pattern. Higher values pack in more of it at a smaller size.',
  intensity: 'Overall brightness and glow.',
  waveFrequency: 'Depends on the effect, often the density of waves, rings or color bands. The effect guide says what it does for each effect.',
  evolutionRate: 'How quickly shapes change over time, on top of Speed.',
  primaryColor: 'Main color for effects that follow your palette. The effect guide says whether the current effect uses it.',
  secondaryColor: 'Second color for effects that follow your palette.',
  backgroundColor: 'Background color for effects that follow your palette.',
  mirror: 'Folds the image into mirrored wedges around the center.',
  mirrorSegments: 'Number of mirrored wedges.',
  audioSensitivity: 'How strongly the effect reacts to the music.',
  smoothing: 'How much the audio response is smoothed; higher is calmer, lower is twitchier.',
};
