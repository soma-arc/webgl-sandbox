#version 300 es
precision mediump float;

in vec2 v_texCoord;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec2 u_textureResolution;
uniform float u_time;

// from Syntopia http://blog.hvidtfeldts.net/index.php/2015/01/path-tracing-3d-fractals/
vec2 Rand2n(vec2 co, float sampleIndex) {
    vec2 seed = co * (sampleIndex + 1.0);
	seed+=vec2(-1,1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
                fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}

const float GAMMA = 2.2;
vec4 degamma(vec4 rgba) {
    return vec4((min(pow(rgba.r, GAMMA), 1.)),
                (min(pow(rgba.g, GAMMA), 1.)),
                (min(pow(rgba.b, GAMMA), 1.)),
                rgba.a);
}

const float DISPLAY_GAMMA_COEFF = 1. / 2.2;
vec4 gammaCorrect(vec4 rgba) {
    return vec4((min(pow(rgba.r, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgba.g, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgba.b, DISPLAY_GAMMA_COEFF), 1.)),
                rgba.a);
}


vec2 circleInvert(vec2 pos, vec3 circle){
	return ((pos - circle.xy) * circle.z * circle.z)/(length(pos - circle.xy) * length(pos - circle.xy) ) + circle.xy;
}

vec3 hsv2rgb(float h, float s, float v){
    vec3 c = vec3(h, s, v);
    const vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 computeColor(float loopNum) {
    return hsv2rgb(0.01 + 0.05 * (loopNum -1.), 1., 1.);
}

vec3 c1 = vec3(1, -1, 1);
vec3 c2 = vec3(1, 1, 1);
vec3 c3 = vec3(-1, -1, 1);
vec3 c4 = vec3(-1, 1, 1);
const int ITERATIONS = 100;
bool IIS(vec2 pos, out vec3 col){
    bool fund = true;
    float invCount = 0.;
    for(int i = 0 ; i < ITERATIONS ; i++){
      vec2 texPos = -vec2(.81, 0.42);
      vec2 size = u_textureResolution / 1150.;
      vec2 uv = (pos - texPos) / size;
      vec4 texColor = vec4(0, 0, 0, 1);
      if(0. < uv.x && uv.x < 1. &&
         0. < uv.y && uv.y < 1.) {
        texColor = degamma(texture(u_texture, vec2(uv.x, 1. - uv.y)));
        if (texColor.r > 0.001 && texColor.g > 0.001 && texColor.b < 0.999) {
          col = texColor.rgb;
          return true;
        }
      }
      
      if(distance(pos, c1.xy) < c1.z ){
        pos = circleInvert(pos, c1);
        invCount++;
        fund = false;
      }else if(distance(pos, c2.xy) < c2.z ){
        pos = circleInvert(pos, c2);
        invCount++;
        fund = false;
      }else if(distance(pos, c3.xy) < c3.z ){
        pos = circleInvert(pos, c3);
        invCount++;
        fund = false;
      }else if(distance(pos, c4.xy) < c4.z ){
        pos = circleInvert(pos, c4);
        invCount++;
        fund = false;
      }
      if(fund) break;
    }

    col = computeColor(invCount);
    return (invCount == 0.) ? false : true;
}

//w: start time
//s: duration
float scene(in float t, in float w, in float s){
    return clamp(t - w, 0.0, s) / s;  
}


float expEasingIn(float t){
    return pow( 2., 13. * (t - 1.) );
}
float expEasingOut(float t) {
	return -pow( 2., -10. * t) + 1.;
}

float circEasingInOut(float t){
	t /= .5;
	if (t < 1.) return -.5 * (sqrt(1. - t*t) - 1.);
	t -= 2.;
	return .5 * (sqrt(1. - t*t) + 1.);
}

float circEasingIn(float t){
	return -  (sqrt(1. - t*t) - 1.);
}

out vec4 outColor;
void main() {
  float ratio = u_resolution.x / u_resolution.y / 2.0;
  vec3 sum = vec3(0);
  float numSamples = 10.;
  float zoom = 0.;
  vec2 translate = vec2(0);

  float t = mod(u_time, 40.);
  float start = 3.;
  zoom += mix(0., 2.299, scene(t, start, 5.));
  translate += mix(0.   , .707,(scene(t, start, 2.)));
  translate.y += mix(0., 0.01,(scene(t, start + 5., 15.)));
  translate.x -= mix(0., 0.01,(scene(t, start + 5., 15.)));
  zoom -= mix(0., 0.01, (scene(t, start + 10., 15.)));
  
  zoom -= mix(0., 2.289, (scene(t, start + 20., 15.)));
  translate.y -= mix(0., .717,(scene(t, start + 20., 15.)));
  translate.x -= mix(0., .697,(scene(t, start + 20., 15.)));
  vec2 coord = gl_FragCoord.xy;
  coord.y = u_resolution.y - gl_FragCoord.y;
  for(float i = 0.; i < numSamples; i++) {
    vec2 pos = ( (coord + Rand2n(coord, i)) / u_resolution.yy ) - vec2(ratio, 0.5);
    pos *= 2.3 - zoom;
    pos += translate;
    vec3 col;
    sum += IIS(pos, col) ? col : vec3(0);
  }
  
  outColor = gammaCorrect(vec4(sum / numSamples, 1.0));
}
