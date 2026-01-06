export const noiseVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const noiseFragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;
uniform vec3 uBackgroundColor;
uniform float uSpeed;
uniform float uScale;
uniform float uIntensity;
uniform float uWaveFrequency;
uniform float uEvolutionRate;
uniform float uAudioLevel;
uniform int uNoiseOctaves;
uniform int uAnimationMode;
uniform int uMirrorQuadrants;
uniform int uMirrorSegments;

varying vec2 vUv;

#define PI 3.14159265359
#define TAU 6.28318530718

// Improved noise functions
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    value += amplitude * cnoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  
  // Apply mirror segments effect
  if (uMirrorQuadrants == 1) {
    float segments = float(uMirrorSegments);
    float r = length(uv);
    float a = atan(uv.y, uv.x);
    float segmentAngle = TAU / segments;
    a = mod(a, segmentAngle);
    if (mod(floor(atan(uv.y, uv.x) / segmentAngle), 2.0) == 1.0) {
      a = segmentAngle - a;
    }
    uv = vec2(cos(a), sin(a)) * r;
  }
  
  uv.x *= uResolution.x / uResolution.y;
  
  float time = uTime * uSpeed * uEvolutionRate;
  float modulator = uAnimationMode == 1 ? uAudioLevel : 1.0;
  
  // Create flowing noise
  vec2 q = vec2(
    fbm(uv * uScale + time * 0.1, uNoiseOctaves),
    fbm(uv * uScale + vec2(5.2, 1.3) + time * 0.1, uNoiseOctaves)
  );
  
  vec2 r = vec2(
    fbm(uv * uScale + 4.0 * q + vec2(1.7, 9.2) + time * 0.15, uNoiseOctaves),
    fbm(uv * uScale + 4.0 * q + vec2(8.3, 2.8) + time * 0.15, uNoiseOctaves)
  );
  
  float f = fbm(uv * uScale + 4.0 * r + time * 0.2, uNoiseOctaves);
  
  // Audio modulation
  f = f * (1.0 + modulator * 0.5);
  
  // Create color gradient based on noise
  float colorValue = (f + 1.0) * 0.5;
  colorValue = pow(colorValue, 1.0 / (uIntensity + 0.1));
  
  // Wave pattern overlay
  float wave = sin(uv.x * uWaveFrequency * 10.0 + time + f * 5.0) * 0.5 + 0.5;
  colorValue = mix(colorValue, wave, 0.2 * modulator);
  
  // Color mixing
  vec3 color1 = uPrimaryColor;
  vec3 color2 = uSecondaryColor;
  vec3 color3 = uBackgroundColor;
  
  vec3 finalColor = mix(color3, color1, smoothstep(0.0, 0.5, colorValue));
  finalColor = mix(finalColor, color2, smoothstep(0.5, 1.0, colorValue));
  
  // Add subtle glow at high values
  float glow = smoothstep(0.7, 1.0, colorValue) * uIntensity;
  finalColor += glow * 0.3;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;
