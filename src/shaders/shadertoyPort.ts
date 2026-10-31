// Runs a Shadertoy-style mainImage() with the app's shared params.
// Each ported shader supplies its body (helpers + mainImage) unchanged where
// possible; texture channels are replaced inside the body itself.

export const portVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export function makePortedFragmentShader(body: string): string {
  return `
uniform float uTime;
uniform vec2 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uIntensity;
uniform float uEvolutionRate;
uniform float uAudioLevel;
uniform int uAnimationMode;
uniform int uMirrorQuadrants;
uniform int uMirrorSegments;

varying vec2 vUv;

// Shadertoy inputs
#define iResolution vec3(uResolution, 1.0)
float iTime = 0.0;
// Shadertoy reports (0,0) until the canvas is clicked; ports keep that look
const vec4 iMouse = vec4(0.0);
// Audio level for shaders that read a music texture (0 in time-based mode)
float iAudio = 0.0;

${body}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;

  // Apply mirror segments effect
  if (uMirrorQuadrants == 1) {
    float segmentAngle = 6.28318530718 / float(uMirrorSegments);
    float r = length(uv);
    float a = mod(atan(uv.y, uv.x), segmentAngle);
    if (mod(floor(atan(uv.y, uv.x) / segmentAngle), 2.0) == 1.0) {
      a = segmentAngle - a;
    }
    uv = vec2(cos(a), sin(a)) * r;
  }

  // Scale zooms around the center: higher shows more of the pattern
  uv *= uScale;

  // Default evolution rate (0.5) runs at the original shader's pace
  iTime = uTime * uSpeed * uEvolutionRate * 2.0;
  iAudio = uAnimationMode == 1 ? uAudioLevel : 0.0;

  vec4 fragOut = vec4(0.0);
  mainImage(fragOut, (uv * 0.5 + 0.5) * uResolution);

  // A single NaN/Inf or negative pixel gets smeared across the whole frame by
  // the Bloom pass, so drop non-finite values and clamp to a sane range
  vec3 col = fragOut.rgb;
  if (any(isnan(col)) || any(isinf(col))) col = vec3(0.0);
  col = clamp(col, 0.0, 16.0);

  // Default intensity (0.8) gives the original brightness
  gl_FragColor = vec4(col * uIntensity * 1.25 * (1.0 + iAudio * 0.5), 1.0);
}
`;
}
