import { makePortedFragmentShader } from './shadertoyPort';

// The MIT License
// Copyright © 2013 Inigo Quilez
// https://www.youtube.com/c/InigoQuilez
// https://iquilezles.org/
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// Mathematically correct Voronoi cell interior distances and edges:
// https://iquilezles.org/articles/voronoilines
//
// Port changes: uses the procedural white noise from the original's
// comments instead of the noise texture.

export const voronoiDistancesFragmentShader = makePortedFragmentShader(`
#define ANIMATE

vec2 hash2( vec2 p ) {
  // procedural white noise
  return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

vec3 voronoi( in vec2 x ) {
  vec2 ip = floor(x);
  vec2 fp = fract(x);

  //----------------------------------
  // first pass: regular voronoi
  //----------------------------------
  vec2 mg, mr;

  float md = 8.0;
  for( int j=-1; j<=1; j++ )
  for( int i=-1; i<=1; i++ ) {
    vec2 g = vec2(float(i),float(j));
    vec2 o = hash2( ip + g );
    #ifdef ANIMATE
    o = 0.5 + uCtlCellMotion*sin( iTime + 6.2831*o );
    #endif
    vec2 r = g + o - fp;
    float d = dot(r,r);

    if( d<md ) {
      md = d;
      mr = r;
      mg = g;
    }
  }

  //----------------------------------
  // second pass: distance to borders
  //----------------------------------
  md = 8.0;
  for( int j=-2; j<=2; j++ )
  for( int i=-2; i<=2; i++ ) {
    vec2 g = mg + vec2(float(i),float(j));
    vec2 o = hash2( ip + g );
    #ifdef ANIMATE
    o = 0.5 + uCtlCellMotion*sin( iTime + 6.2831*o );
    #endif
    vec2 r = g + o - fp;

    if( dot(mr-r,mr-r)>0.00001 )
    md = min( md, dot( 0.5*(mr+r), normalize(r-mr) ) );
  }

  return vec3( md, mr );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec2 p = fragCoord/iResolution.xx;

  vec3 c = voronoi( uCtlCellDensity*p );

  // isolines
  vec3 col = c.x*(0.5 + 0.5*sin(uCtlIsolineFrequency*c.x))*vec3(1.0);
  // borders
  col = mix( uCtlBorderColor, col, smoothstep( uCtlBorderWidth, uCtlBorderWidth + 0.03, c.x ) );
  // feature points
  float dd = length( c.yz );
  col = mix( uCtlPointColor, col, smoothstep( 0.0, 0.12*uCtlPointSize, dd) );
  col += uCtlPointColor*(1.0-smoothstep( 0.0, 0.04*uCtlPointSize, dd));

  fragColor = vec4(col,1.0);
}
`);
