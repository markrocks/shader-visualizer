import type { EffectType } from '../types';
import { universeWithinFragmentShader } from './universeWithin';
import { starNestFragmentShader } from './starNest';
import { voronoiDistancesFragmentShader } from './voronoiDistances';
import { warpSpeedFragmentShader } from './warpSpeed';
import { driveHomeFragmentShader } from './driveHome';
import { mainSequenceStarFragmentShader } from './mainSequenceStar';
import { waterCausticsFragmentShader } from './waterCaustics';
import { plasmaGlobeFragmentShader } from './plasmaGlobe';
import { blueFragmentShader } from './blue';
import { parametricsFragmentShader } from './parametrics';

// Effects ported from Shadertoy that render through PortedShaderEffect
export const PORTED_FRAGMENT_SHADERS: Partial<Record<EffectType, string>> = {
  'universe-within': universeWithinFragmentShader,
  'star-nest': starNestFragmentShader,
  'voronoi-distances': voronoiDistancesFragmentShader,
  'warp-speed': warpSpeedFragmentShader,
  'drive-home': driveHomeFragmentShader,
  'main-sequence-star': mainSequenceStarFragmentShader,
  'water-caustics': waterCausticsFragmentShader,
  'plasma-globe': plasmaGlobeFragmentShader,
  'blue': blueFragmentShader,
  'parametrics': parametricsFragmentShader,
};
