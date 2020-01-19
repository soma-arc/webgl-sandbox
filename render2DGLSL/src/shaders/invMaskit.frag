#version 300 es
precision mediump float;

uniform sampler2D u_accTexture;
uniform float u_textureWeight;
uniform float u_numSamples;
uniform vec2 u_resolution;
uniform int u_maxIterations;
uniform sampler2D u_imageTexture;
uniform sampler2D u_imageTexture2;
uniform sampler2D u_imageTexture3;

vec3 u_geometry = vec3(0, 1, 35.88046875); // [translateX, translateY, scale]
vec2 u_uv = vec2(1.8716666666666673, 0.07000000000000023);
float u_k = 2.;
vec3 u_invCircle = vec3(0, 1, 0.9305408887544303);

const vec3 BLACK = vec3(0, 0, 0.01);
const vec3 WHITE = vec3(1);
const vec3 RED = vec3(0.8, 0, 0);
const vec3 GREEN = vec3(0, 0.8, 0);
const vec3 BLUE = vec3(0, 0, 0.8);
const vec3 YELLOW = vec3(1, 1, 0);
const vec3 PINK = vec3(.78, 0, .78);
const vec3 LIGHT_BLUE = vec3(0, 1, 1);

// from Syntopia http://blog.hvidtfeldts.net/index.php/2015/01/path-tracing-3d-fractals/
vec2 rand2n(vec2 co, float sampleIndex) {
    vec2 seed = co * (sampleIndex + 1.0);
	seed+=vec2(-1,1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
                fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}

// vec2 circleInvert(const vec2 pos, const vec4 circle){
//     vec2 p = pos - circle.xy;
//     float d = length(p);
//     return (p * circle.w)/(d * d) + circle.xy;
// }

vec2 circleInvert(vec2 pos, vec3 circle){
	return ((pos - circle.xy) * circle.z * circle.z)/(length(pos - circle.xy) * length(pos - circle.xy) ) + circle.xy;
}

const float GAMMA_COEFF = 2.2;
const float DISPLAY_GAMMA_COEFF = 1. / GAMMA_COEFF;
vec3 gammaCorrect(vec3 rgb) {
  return vec3((min(pow(rgb.r, DISPLAY_GAMMA_COEFF), 1.)),
              (min(pow(rgb.g, DISPLAY_GAMMA_COEFF), 1.)),
              (min(pow(rgb.b, DISPLAY_GAMMA_COEFF), 1.)));
}

vec3 degamma(vec3 rgb) {
  return vec3((min(pow(rgb.r, GAMMA_COEFF), 1.)),
              (min(pow(rgb.g, GAMMA_COEFF), 1.)),
              (min(pow(rgb.b, GAMMA_COEFF), 1.)));
}

float lineY(vec2 pos, vec2 uv){
	return uv.x * .5 + sign(uv.y * .5) * (2.*uv.x-1.95)/4. * sign(pos.x + uv.y * 0.5)* (1. - exp(-(7.2-(1.95-uv.x)*15.)* abs(pos.x + uv.y * 0.5)));
}

vec2 TransA(vec2 z, vec2 uv){
	float iR = 1. / dot(z, z);
	z *= -iR;
	z.x = -uv.y - z.x; z.y = uv.x + z.y;
    return z;
}

vec2 TransAInv(vec2 z, vec2 uv){
	float iR = 1. / dot(z + vec2(uv.y,-uv.x), z + vec2(uv.y, -uv.x));
	z.x += uv.y; z.y = uv.x - z.y;
	z *= iR;
    return z;
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 getColorFromPalettes(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

vec3 computeColorWithPalettes(float loopNum, vec3 a, vec3 b, vec3 c, vec3 d) {
    return getColorFromPalettes((loopNum / 31.3),
                                a, b, c, d);
}

vec4 computeColor(float n){
    return vec4(computeColorWithPalettes(n, vec3(0.8, 0.5, 0.4), vec3(0.2, 0.4, 0.2), vec3(2, 1, 1), vec3(0, 0.25, 0.25)), 1);
    return vec4(hsv2rgb(vec3(0.0 +0.2 * n, 1., .7)), 1.);
	return vec4(hsv2rgb(vec3(.3 +0.06 * n, 1., .7)), 1.);
    //return vec4(hsv2rgb(vec3(-0.05 + (float(invCount) + 1.5) * 0.1 , 1., 1.)));
}

vec4 computeColor2(float n, float numTransA) {
    if(n == 0.) {
        return vec4(BLACK, 0.);
    }
    return vec4(hsv2rgb(vec3(0. + 0.05 * (n -1.), 1.0, 1.0)), 1.);
}

const int LOOP_NUM = 200;
vec4 josKleinian(vec2 pos, vec2 uv, float translation){
    float loopNum = 0.;
    vec2 lz = pos + vec2(1.);
    vec2 llz = pos + vec2(-1.);
    float numTransA = 0.;
    for(int i = 0 ; i < LOOP_NUM ; i++){
        // translate
    	pos.x += translation/2. + (uv.y * pos.y) / uv.x;
        pos.x = mod(pos.x, translation);
        pos.x -= translation/2. + (uv.y * pos.y) / uv.x;

        // rotate 180
        if (pos.y >= lineY(pos, uv.xy)){
            // pos -= vec2(-uv.y, uv.x) * .5;
            // pos = - pos;
            // pos += vec2(-uv.y, uv.x) * .5;
            // |
            pos = vec2(-uv.y, uv.x) - pos;
            //loopNum++;
        }

        pos = TransA(pos, uv);
        loopNum++;

        // 2-cycle
        if(dot(pos-llz,pos-llz) < 1e-6)
            return vec4(BLACK, 0);

        if(pos.y <= 0. || uv.x < pos.y) {
        	return computeColor(loopNum);
        }

        llz=lz; lz=pos;
    }
    return vec4(BLACK, 0);
}

vec4 josKleinianIIS(vec2 pos, vec2 uv, float translation){
    float loopNum = 0.;
    vec2 lz = pos + vec2(1.);
    vec2 llz = pos + vec2(-1.);

    float numTransA = 0.;
    for(int i = 0 ; i < LOOP_NUM ; i++){
        // translate
    	pos.x += translation/2. + (uv.y * pos.y) / uv.x;
        pos.x = mod(pos.x, translation);
        pos.x -= translation/2. + (uv.y * pos.y) / uv.x;

        // rotate 180
        if (pos.y >= lineY(pos, uv.xy)){
            // pos -= vec2(-uv.y, uv.x) * .5;
            // pos = - pos;
            // pos += vec2(-uv.y, uv.x) * .5;
            // |
            pos = vec2(-uv.y, uv.x) - pos;
            //loopNum++;
        }

        pos = TransA(pos, uv);
        numTransA++;
        if(uv.x < pos.y) {
            pos.y -= uv.x;
            pos.y *= -1.;
            pos.y += uv.x;
            loopNum++;
        }
        if(pos.y <= 0.){
            pos.y *= -1.;
            loopNum++;
        }

        // 2-cycle
        if(dot(pos-llz,pos-llz) < 1e-6) return computeColor2(loopNum, numTransA);

        llz=lz; lz=pos;
    }
    return computeColor2(loopNum, numTransA);
}

out vec4 outColor;
void main() {
    vec3 sum = vec3(0);
	float ratio = u_resolution.x / u_resolution.y / 2.0;

    vec2 position = ( (gl_FragCoord.xy + (rand2n(gl_FragCoord.xy, u_numSamples))) / u_resolution.yy ) - vec2(ratio, 0.5);
    position *= u_geometry.z;
    position += u_geometry.xy;

    vec4 cc = vec4(0);

    position = circleInvert(position, u_invCircle);

    vec4 col;
    //col = josKleinianIIS(position, u_uv, u_k);
    col = josKleinian(position, u_uv, u_k);

    vec4 texCol = texture(u_accTexture, gl_FragCoord.xy / u_resolution);
	outColor = vec4(mix(col, texCol, u_textureWeight));
}
