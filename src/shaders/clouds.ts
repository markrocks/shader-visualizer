// Ported from "Protean clouds" by nimitz (twitter: @stormoid)
// https://www.shadertoy.com/view/3l23Rh
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
// Contact the author for other licensing options

export const cloudsVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const cloudsFragmentShader = `
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
uniform float uCloudsDensity;
uniform int uCloudsSteps;
uniform float uCloudsColorMix;
uniform int uAnimationMode;
uniform int uMirrorQuadrants;
uniform int uMirrorSegments;

varying vec2 vUv;

#define TAU 6.28318530718
#define MAX_STEPS 130

mat2 rot(in float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
const mat3 m3 = mat3(0.33338, 0.56034, -0.71817, -0.87887, 0.32651, -0.15323, 0.15162, 0.69596, 0.61339) * 1.93;
float mag2(vec2 p) { return dot(p, p); }
float linstep(in float mn, in float mx, in float x) { return clamp((x - mn) / (mx - mn), 0., 1.); }

// Globals set once per pixel in main()
float iTime = 0.;
float prm1 = 0.;
float audioAmp = 0.;
// Stands in for the original's mouse position: x offsets the camera,
// y shifts the density threshold (driven by the Density slider)
vec2 bsMo = vec2(0);

vec2 disp(float t) { return vec2(sin(t * 0.22) * 1., cos(t * 0.175) * 1.) * 2.; }

vec2 cloudMap(vec3 p) {
  vec3 p2 = p;
  p2.xy -= disp(p.z).xy;
  p.xy *= rot(sin(p.z + iTime) * (0.1 + prm1 * 0.05) + iTime * 0.09);
  float cl = mag2(p2.xy);
  float d = 0.;
  p *= .61 * uScale;
  float z = 1.;
  float trk = 1.;
  float dspAmp = 0.1 + prm1 * 0.2 + audioAmp * 0.15;
  for (int i = 0; i < 5; i++) {
    p += sin(p.zxy * 0.75 * trk + iTime * trk * .8) * dspAmp;
    d -= abs(dot(cos(p), sin(p.yzx)) * z);
    z *= 0.57;
    trk *= 1.4;
    p = p * m3;
  }
  d = abs(d + prm1 * 3.) + prm1 * .3 - 2.5 + bsMo.y;
  return vec2(d + cl * .2 + 0.25, cl);
}

vec4 renderClouds(in vec3 ro, in vec3 rd, float time) {
  vec4 rez = vec4(0);
  float t = 1.5;
  float fogT = 0.;
  for (int i = 0; i < MAX_STEPS; i++) {
    if (i >= uCloudsSteps || rez.a > 0.99) break;

    vec3 pos = ro + t * rd;
    vec2 mpv = cloudMap(pos);
    float den = clamp(mpv.x - 0.3, 0., 1.) * 1.12;
    float dn = clamp((mpv.x + 2.), 0., 3.);

    vec4 col = vec4(0);
    if (mpv.x > 0.6) {
      col = vec4(sin(vec3(5., 0.4, 0.2) + mpv.y * 0.1 + sin(pos.z * 0.4) * 0.5 + 1.8) * 0.5 + 0.5, 0.08);
      col *= den * den * den;
      col.rgb *= linstep(4., -2.5, mpv.x) * 2.3;
      float dif = clamp((den - cloudMap(pos + .8).x) / 9., 0.001, 1.);
      dif += clamp((den - cloudMap(pos + .35).x) / 2.5, 0.001, 1.);
      col.xyz *= den * (vec3(0.005, .045, .075) + 1.5 * vec3(0.033, 0.07, 0.03) * dif);
    }

    float fogC = exp(t * 0.2 - 2.2);
    col.rgba += vec4(0.06, 0.11, 0.11, 0.1) * clamp(fogC - fogT, 0., 1.);
    fogT = fogC;
    rez = rez + col * (1. - rez.a);
    t += clamp(0.5 - dn * dn * .05, 0.09, 0.3);
  }
  return clamp(rez, 0.0, 1.0);
}

float getsat(vec3 c) {
  float mi = min(min(c.x, c.y), c.z);
  float ma = max(max(c.x, c.y), c.z);
  return (ma - mi) / (ma + 1e-7);
}

// From nimitz's "Will it blend" shader (https://www.shadertoy.com/view/lsdGzN)
vec3 iLerp(in vec3 a, in vec3 b, in float x) {
  vec3 ic = mix(a, b, x) + vec3(1e-6, 0., 0.);
  float sd = abs(getsat(ic) - mix(getsat(a), getsat(b), x));
  vec3 dir = normalize(vec3(2. * ic.x - ic.y - ic.z, 2. * ic.y - ic.x - ic.z, 2. * ic.z - ic.y - ic.x));
  float lgt = dot(vec3(1.0), ic);
  float ff = dot(dir, normalize(ic));
  ic += 1.5 * dir * sd * ff * lgt;
  return clamp(ic, 0., 1.);
}

void main() {
  vec2 q = vUv;
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

  float aspect = uResolution.x / uResolution.y;
  vec2 p = uv * vec2(aspect, 1.0) * 0.5;

  // Default evolution rate (0.5) runs at the original shader's pace
  iTime = uTime * uSpeed * uEvolutionRate * 2.0;
  audioAmp = uAnimationMode == 1 ? uAudioLevel : 0.0;

  // The original reads the mouse; Shadertoy's unclicked mouse is (0,0),
  // which puts bsMo at about (-0.89, -0.5) on a 16:9 canvas
  bsMo = vec2(-0.89, 0.5 - uCloudsDensity * 2.0);

  float time = iTime * 3.;
  vec3 ro = vec3(0, 0, time);

  ro += vec3(sin(iTime) * 0.5, 0., 0);

  float dspAmp = .85;
  ro.xy += disp(ro.z) * dspAmp;
  float tgtDst = 3.5;

  vec3 target = normalize(ro - vec3(disp(time + tgtDst) * dspAmp, time + tgtDst));
  ro.x -= bsMo.x * 2.;
  vec3 rightdir = normalize(cross(target, vec3(0, 1, 0)));
  vec3 updir = normalize(cross(rightdir, target));
  rightdir = normalize(cross(updir, target));
  vec3 rd = normalize((p.x * rightdir + p.y * updir) * 1. - target);
  rd.xy *= rot(-disp(time + 3.5).x * 0.2 + bsMo.x);
  prm1 = smoothstep(-0.4, 0.4, sin(iTime * 0.3 * uWaveFrequency));
  vec4 scn = renderClouds(ro, rd, time);

  vec3 col = scn.rgb;
  col = iLerp(col.bgr, col.rgb, clamp(1. - prm1, 0.05, 1.));

  col = pow(col, vec3(.55, 0.65, 0.6)) * vec3(1., .97, .9);

  // Blend toward the user's palette by brightness
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 themed = mix(uBackgroundColor, uSecondaryColor, smoothstep(0.15, 0.55, lum));
  themed = mix(themed, uPrimaryColor * 1.4, smoothstep(0.45, 0.85, lum));
  col = mix(col, themed, uCloudsColorMix);

  // Default intensity (0.8) gives the original brightness
  col *= uIntensity * 1.25 * (1.0 + audioAmp * 0.5);

  col *= pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.12) * 0.7 + 0.3; // Vignette

  gl_FragColor = vec4(col, 1.0);
}
`;
