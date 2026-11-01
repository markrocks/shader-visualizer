// Transitions between two presets. Both presets are rendered to textures and
// this shader combines them: tFrom is the outgoing view, tTo the incoming one,
// and uProgress runs 0 (all tFrom) to 1 (all tTo).

export const TRANSITIONS = [
  {
    id: 'crossfade',
    label: 'Crossfade',
    description: 'The next view fades in over the current one.',
  },
  {
    id: 'shrink-grow',
    label: 'Shrink & Grow',
    description: 'The current view shrinks and spins into the center and fades out, then the next view grows out from the center to full size.',
  },
  {
    id: 'radial',
    label: 'Radial Fade',
    description: 'The next view spreads outward from the center through a soft radial gradient, with a glowing ring at its edge.',
  },
  {
    id: 'kaleidoscope',
    label: 'Kaleidoscope',
    description: 'The image folds into spinning mirrored wedges, the next view fades in wedge by wedge, then everything unfolds.',
  },
  {
    id: 'sphere',
    label: 'Sphere Portal',
    description: 'The current view wraps around a sphere that shrinks and spins away into the center, while the next view emerges around it.',
  },
  {
    id: 'cube',
    label: 'Cube Spin',
    description: 'The screen becomes a 3D cube that turns to reveal the next view on its side face.',
  },
  {
    id: 'hex',
    label: 'Hex Shatter',
    description: 'The current view breaks into hexagonal tiles that spin and shrink away in a wave from the center.',
  },
  {
    id: 'vortex',
    label: 'Vortex',
    description: 'The current view twists into a whirlpool and drains into the center, and the next view unwinds out of it.',
  },
  {
    id: 'rings',
    label: 'Ripple Rings',
    description: 'Concentric rings ripple outward and flip to the next view in an alternating stagger.',
  },
] as const;

export type TransitionId = (typeof TRANSITIONS)[number]['id'];

// A sequence can also pick a different transition each time
export type TransitionChoice = TransitionId | 'random';

export function transitionIndex(id: TransitionId): number {
  return TRANSITIONS.findIndex((t) => t.id === id);
}

export function pickTransition(choice: TransitionChoice | undefined): TransitionId {
  if (!choice) return 'crossfade';
  if (choice !== 'random') return choice;
  return TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)].id;
}

// How progress speeds up and slows down over a transition's duration
export const EASINGS = [
  { id: 'smooth', label: 'Smooth', description: 'Starts slowly, speeds up, then settles gently.' },
  { id: 'linear', label: 'Linear', description: 'Moves at a constant speed from start to finish.' },
  { id: 'ease-in', label: 'Ease In', description: 'Starts slowly and accelerates into the next view.' },
  { id: 'ease-out', label: 'Ease Out', description: 'Starts quickly and slows down as it arrives.' },
] as const;

export type TransitionEasing = (typeof EASINGS)[number]['id'];

export function applyEasing(easing: TransitionEasing | undefined, t: number): number {
  switch (easing) {
    case 'linear':
      return t;
    case 'ease-in':
      return t * t * t;
    case 'ease-out':
      return 1 - Math.pow(1 - t, 3);
    case 'smooth':
    default:
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}

export const transitionVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// uType indexes TRANSITIONS above
export const transitionFragmentShader = `
uniform sampler2D tFrom;
uniform sampler2D tTo;
uniform float uProgress;
uniform int uType;
uniform float uAspect;
// 1 when no post-processing pass will convert to sRGB for the screen
uniform float uEncodeSRGB;

varying vec2 vUv;

#define PI 3.14159265359
#define TAU 6.28318530718

// Centered coordinates: y spans -0.5..0.5, x is aspect-corrected
vec2 toUv(vec2 q) { return q / vec2(uAspect, 1.0) + 0.5; }

// Mirror-repeat so distorted lookups never hit a hard edge
vec2 mirrorUv(vec2 uv) { return 1.0 - abs(1.0 - mod(uv, 2.0)); }

vec3 fromAt(vec2 q) { return texture(tFrom, mirrorUv(toUv(q))).rgb; }
vec3 toAt(vec2 q) { return texture(tTo, mirrorUv(toUv(q))).rgb; }

// Black outside the frame, for views that shrink inside the screen
vec3 fromFramed(vec2 q) {
  vec2 uv = toUv(q);
  return (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) ? vec3(0.0) : texture(tFrom, uv).rgb;
}
vec3 toFramed(vec2 q) {
  vec2 uv = toUv(q);
  return (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) ? vec3(0.0) : texture(tTo, uv).rgb;
}

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// ---------------------------------------------------------------------------

vec3 crossfade(vec2 q, float p) {
  return mix(fromAt(q), toAt(q), p);
}

vec3 shrinkGrow(vec2 q, float p) {
  float s1 = 1.0 - smoothstep(0.0, 0.55, p);
  float s2 = smoothstep(0.45, 1.0, p);
  vec3 a = vec3(0.0);
  vec3 b = vec3(0.0);
  if (s1 > 0.001) a = fromFramed(rot((1.0 - s1) * 0.8) * q / s1) * (1.0 - smoothstep(0.3, 0.55, p));
  if (s2 > 0.001) b = toFramed(rot(-(1.0 - s2) * 0.8) * q / s2) * smoothstep(0.45, 0.7, p);
  return a + b;
}

vec3 radialFade(vec2 q, float p) {
  float maxR = length(vec2(uAspect, 1.0)) * 0.5;
  float d = length(q);
  float width = 0.35 * maxR;
  float R = p * (maxR + width);
  float m = 1.0 - smoothstep(R - width, R, d);
  vec3 c = mix(fromAt(q), toAt(q), m);
  // Glowing ring riding the leading edge
  float ring = exp(-pow((d - R + width * 0.5) / 0.015, 2.0)) * sin(PI * p);
  return c + ring * 0.5 * (fromAt(q) + toAt(q));
}

vec3 kaleidoscope(vec2 q, float p) {
  float fold = sin(PI * p);
  float r = length(q);
  float a = atan(q.y, q.x);
  float seg = TAU / 6.0;
  float ka = mod(a + p * PI, seg);
  ka = abs(ka - seg * 0.5);
  vec2 kq = vec2(cos(ka), sin(ka)) * r * (1.0 + 0.4 * fold);
  vec2 sq = mix(q, kq, fold);
  // Each wedge switches over at its own moment
  float wedge = floor((a + PI) / seg);
  float delay = fract(wedge * 0.618) * 0.3;
  float m = smoothstep(0.2 + delay, 0.5 + delay, p);
  return mix(fromAt(sq), toAt(sq), m);
}

vec3 spherePortal(vec2 q, float p) {
  float maxR = length(vec2(uAspect, 1.0)) * 0.5;
  float e = smoothstep(0.0, 1.0, p);
  float R = maxR * 1.05 * (1.0 - e);
  float r = length(q);

  // The next view comes out from behind, zooming toward the viewer
  vec3 outside = toAt(q * mix(0.4, 1.0, e));
  outside *= 1.0 - 0.6 * exp(-max(r - R, 0.0) * 12.0) * step(0.001, R);
  if (r >= R) return outside;

  // Current view wrapped onto the sphere's front hemisphere
  float x = r / R;
  float z = sqrt(max(1.0 - x * x, 0.0));
  float bend = smoothstep(0.0, 0.35, p);
  float wrapped = asin(clamp(x, 0.0, 1.0)) / (PI * 0.5) * maxR;
  vec2 dir = r > 0.0 ? q / r : vec2(0.0);
  vec2 sq = rot(p * 2.5) * dir * mix(r, wrapped, bend);
  vec3 c = fromAt(sq);
  c *= mix(1.0, 0.5 + 0.5 * z, bend);
  c += pow(1.0 - z, 3.0) * bend * 0.6 * (c + 0.15);
  // Soft edge
  float edge = smoothstep(R, R - 0.004, r);
  return mix(outside, c, edge * (1.0 - smoothstep(0.85, 1.0, p)));
}

vec3 cubeSpin(vec2 q, float p) {
  float A = uAspect * 0.5;
  vec3 halfSize = vec3(A, 0.5, A);
  float theta = p * PI * 0.5;
  float focal = 1.5;
  // Pull back mid-turn so the cube's corners stay in view
  float camZ = A + focal + sin(PI * p) * 0.9;
  vec3 ro = vec3(0.0, 0.0, -camZ);
  vec3 rd = normalize(vec3(q, focal));

  // Into cube space: undo the cube's rotation about Y
  float c = cos(-theta), s = sin(-theta);
  mat3 ry = mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
  vec3 o = ry * ro;
  vec3 d = ry * rd;

  vec3 t1 = (-halfSize - o) / d;
  vec3 t2 = (halfSize - o) / d;
  vec3 tn = min(t1, t2);
  vec3 tf = max(t1, t2);
  float tNear = max(max(tn.x, tn.y), tn.z);
  float tFar = min(min(tf.x, tf.y), tf.z);
  if (tFar < tNear || tFar < 0.0) return vec3(0.0);

  vec3 hit = o + d * tNear;
  vec3 col;
  vec3 n;
  if (tNear == tn.z) {
    // Front face: the outgoing view
    col = texture(tFrom, vec2(hit.x / (2.0 * A) + 0.5, hit.y + 0.5)).rgb;
    n = vec3(0.0, 0.0, -1.0);
  } else if (tNear == tn.x) {
    // Side face turning toward the camera: the incoming view
    col = texture(tTo, vec2(hit.z / (2.0 * A) + 0.5, hit.y + 0.5)).rgb;
    n = vec3(sign(hit.x), 0.0, 0.0);
  } else {
    return vec3(0.0);
  }
  float shade = 0.35 + 0.65 * max(dot(n, -d), 0.0);
  return col * shade;
}

// Distance to a hexagon's edge (0.5 at the edge of a unit-spaced cell)
float hexDist(vec2 p) {
  p = abs(p);
  return max(dot(p, normalize(vec2(1.0, 1.73))), p.x);
}

vec3 hexShatter(vec2 q, float p) {
  float density = 8.0;
  vec2 hq = q * density;
  vec2 r = vec2(1.0, 1.73);
  vec2 h = r * 0.5;
  vec2 a = mod(hq, r) - h;
  vec2 b = mod(hq - h, r) - h;
  vec2 local = dot(a, a) < dot(b, b) ? a : b;
  vec2 id = hq - local;

  float maxR = length(vec2(uAspect, 1.0)) * 0.5;
  float rnd = hash(id);
  float delay = length(id / density) / maxR * 0.45 + rnd * 0.15;
  float lp = clamp((p - delay) / 0.4, 0.0, 1.0);
  float scale = 1.0 - lp;

  vec3 next = toAt(q);
  if (scale <= 0.001) return next;
  vec2 lq = rot(-lp * 3.0 * (rnd < 0.5 ? -1.0 : 1.0)) * local / scale;
  float hd = hexDist(lq);
  if (hd >= 0.5) return next;
  vec3 tile = fromAt((id + lq) / density);
  // Darken tile edges while they break apart
  tile *= 1.0 - smoothstep(0.42, 0.5, hd) * 0.7 * step(0.001, lp);
  return tile;
}

vec3 vortex(vec2 q, float p) {
  float maxR = length(vec2(uAspect, 1.0)) * 0.5;
  float r = length(q);
  float f = sin(PI * p);
  float e = smoothstep(0.0, 1.0, p);
  float twist = f * 7.0 * (1.0 - smoothstep(0.0, maxR, r));
  vec2 tq = rot(twist) * q;
  vec3 a = fromAt(tq * (1.0 + 2.5 * e));
  vec3 b = toAt(tq * (0.35 + 0.65 * e));
  // The center switches first, then outward
  float m = smoothstep(0.0, 1.0, p * 1.8 - r / maxR * 0.8);
  return mix(a, b, m);
}

vec3 rippleRings(vec2 q, float p) {
  float maxR = length(vec2(uAspect, 1.0)) * 0.5;
  float r = length(q);
  float rn = r / maxR;
  float rings = 10.0;
  float ringId = floor(rn * rings);
  float delay = ringId / rings * 0.45 + mod(ringId, 2.0) * 0.15;
  float m = smoothstep(delay, delay + 0.3, p);
  float wave = sin((rn * rings * 2.0 - p * 12.0) * PI) * sin(PI * p) * 0.012;
  vec2 dq = q + (r > 0.0 ? q / r : vec2(0.0)) * wave;
  return mix(fromAt(dq), toAt(dq), m);
}

void main() {
  vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
  float p = clamp(uProgress, 0.0, 1.0);

  vec3 col;
  if (p <= 0.0) col = fromAt(q);
  else if (p >= 1.0) col = toAt(q);
  else if (uType == 1) col = shrinkGrow(q, p);
  else if (uType == 2) col = radialFade(q, p);
  else if (uType == 3) col = kaleidoscope(q, p);
  else if (uType == 4) col = spherePortal(q, p);
  else if (uType == 5) col = cubeSpin(q, p);
  else if (uType == 6) col = hexShatter(q, p);
  else if (uType == 7) col = vortex(q, p);
  else if (uType == 8) col = rippleRings(q, p);
  else col = crossfade(q, p);

  if (uEncodeSRGB > 0.5) {
    col = max(col, 0.0);
    col = mix(col * 12.92, 1.055 * pow(col, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), col));
  }

  gl_FragColor = vec4(col, 1.0);
}
`;
