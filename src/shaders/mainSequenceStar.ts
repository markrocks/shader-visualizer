import { makePortedFragmentShader } from './shadertoyPort';

// based on https://www.shadertoy.com/view/lsf3RH by
// trisomie21 (THANKS!)
// My apologies for the ugly code.
//
// Pasted without an author line; this appears to be "Main Sequence Star"
// by flight404. No license was stated, so Shadertoy's default applies:
// Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported.
//
// Port changes: the music texture is replaced by the app's audio level, and
// the star-surface texture is replaced by procedural value noise.

export const mainSequenceStarFragmentShader = makePortedFragmentShader(`
float snoise(vec3 uv, float res) {   // by trisomie21
  const vec3 s = vec3(1e0, 1e2, 1e4);

  uv *= res;

  vec3 uv0 = floor(mod(uv, res))*s;
  vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;

  vec3 f = fract(uv); f = f*f*(3.0-2.0*f);

  vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,
                uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);

  vec4 r = fract(sin(v*1e-3)*1e5);
  float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

  r = fract(sin((v + uv1.z - uv0.z)*1e-3)*1e5);
  float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

  return mix(r0, r1, f.z)*2.-1.;
}

// Stand-in for the original's surface texture: warm fractal value noise
float starHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float starValueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(starHash(i), starHash(i + vec2(1.0, 0.0)), f.x),
             mix(starHash(i + vec2(0.0, 1.0)), starHash(i + vec2(1.0, 1.0)), f.x), f.y);
}

vec3 starTexture(vec2 uv) {
  uv *= 8.0;
  float n = 0.5 * starValueNoise(uv) + 0.25 * starValueNoise(uv * 2.0)
          + 0.125 * starValueNoise(uv * 4.0) + 0.0625 * starValueNoise(uv * 8.0);
  return vec3(n) * vec3(1.0, 0.8, 0.55);
}

float freqs[4];

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  // The original sampled four music frequency bands; all follow the app's audio level
  float level = clamp(iAudio, 0.0, 1.0);
  freqs[0] = level;
  freqs[1] = level;
  freqs[2] = level;
  freqs[3] = level;

  float brightness = freqs[1] * 0.25 + freqs[2] * 0.25;
  float radius = 0.24 + brightness * 0.2;
  float invRadius = 1.0/radius;

  vec3 orange = vec3( 0.8, 0.65, 0.3 );
  vec3 orangeRed = vec3( 0.8, 0.35, 0.1 );
  float time = iTime * 0.1;
  float aspect = iResolution.x/iResolution.y;
  vec2 uv = fragCoord.xy / iResolution.xy;
  vec2 p = -0.5 + uv;
  p.x *= aspect;

  float fade = pow( length( 2.0 * p ), 0.5 );
  float fVal1 = 1.0 - fade;
  float fVal2 = 1.0 - fade;

  float angle = atan( p.x, p.y )/6.2832;
  float dist = length(p);
  vec3 coord = vec3( angle, dist, time * 0.1 );

  float newTime1 = abs( snoise( coord + vec3( 0.0, -time * ( 0.35 + brightness * 0.001 ), time * 0.015 ), 15.0 ) );
  float newTime2 = abs( snoise( coord + vec3( 0.0, -time * ( 0.15 + brightness * 0.001 ), time * 0.015 ), 45.0 ) );
  for( int i=1; i<=7; i++ ) {
    float power = pow( 2.0, float(i + 1) );
    fVal1 += ( 0.5 / power ) * snoise( coord + vec3( 0.0, -time, time * 0.2 ), ( power * ( 10.0 ) * ( newTime1 + 1.0 ) ) );
    fVal2 += ( 0.5 / power ) * snoise( coord + vec3( 0.0, -time, time * 0.2 ), ( power * ( 25.0 ) * ( newTime2 + 1.0 ) ) );
  }

  float corona = pow( fVal1 * max( 1.1 - fade, 0.0 ), 2.0 ) * 50.0;
  corona += pow( fVal2 * max( 1.1 - fade, 0.0 ), 2.0 ) * 50.0;
  corona *= 1.2 - newTime1;
  vec3 starSphere = vec3( 0.0 );

  vec2 sp = -1.0 + 2.0 * uv;
  sp.x *= aspect;
  sp *= ( 2.0 - brightness );
  float r = dot(sp,sp);
  float f = (1.0-sqrt(abs(1.0-r)))/(r) + brightness * 0.5;
  if( dist < radius ) {
    corona *= pow( dist * invRadius, 24.0 );
    vec2 newUv;
    newUv.x = sp.x*f;
    newUv.y = sp.y*f;
    newUv += vec2( time, 0.0 );

    vec3 texSample = starTexture( newUv );
    float uOff = ( texSample.g * brightness * 4.5 + time );
    vec2 starUV = newUv + vec2( uOff, 0.0 );
    starSphere = starTexture( starUV );
  }

  float starGlow = min( max( 1.0 - dist * ( 1.0 - brightness ), 0.0 ), 1.0 );
  fragColor.rgb = vec3( f * ( 0.75 + brightness * 0.3 ) * orange ) + starSphere + corona * orange + starGlow * orangeRed;
  fragColor.a = 1.0;
}
`);
