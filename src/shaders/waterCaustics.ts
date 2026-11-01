import { makePortedFragmentShader } from './shadertoyPort';

// Found this on GLSL sandbox. I really liked it, changed a few things and made it tileable.
// :)
// by David Hoskins.
// Original water turbulence effect by joltz0r
//
// No license was stated, so Shadertoy's default applies:
// Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported.
//
// Port changes: SHOW_TILING debug path removed (it was off).

export const waterCausticsFragmentShader = makePortedFragmentShader(`
#define TAU 6.28318530718

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  float time = iTime * .5+23.0;
  // uv should be the 0-1 uv of texture...
  vec2 uv = fragCoord.xy / iResolution.xy;

  vec2 p = mod(uv*TAU, TAU)-250.0;
  vec2 i = vec2(p);
  float c = 1.0;
  float inten = uCtlLineIntensity;

  for (int n = 0; n < 10; n++) {
    if (float(n) >= uCtlIterations) break;
    float t = time * (1.0 - (3.5 / float(n+1)));
    i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
    c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
  }
  c /= floor(uCtlIterations + 0.5);
  c = 1.17-pow(c, uCtlContrast);
  vec3 colour = vec3(pow(abs(c), uCtlSharpness));
  colour = clamp(colour + uCtlWaterColor, 0.0, 1.0);

  fragColor = vec4(colour, 1.0);
}
`);
