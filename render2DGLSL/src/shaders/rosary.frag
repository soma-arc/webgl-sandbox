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

out vec4 outColor;

const float DISPLAY_GAMMA_COEFF = 2.2;
vec4 degamma(vec4 rgba) {
    return vec4((min(pow(rgba.r, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgba.g, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgba.b, DISPLAY_GAMMA_COEFF), 1.)),
                rgba.a);
}

// from Syntopia http://blog.hvidtfeldts.net/index.php/2015/01/path-tracing-3d-fractals/
vec2 Rand2n(vec2 co, float sampleIndex) {
    vec2 seed = co * (sampleIndex + 1.0);
	seed+=vec2(-1,1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
                fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

const float PI = 3.14159265359;


vec2 circleInvert(vec2 pos, vec3 circle){
	return ((pos - circle.xy) * circle.z * circle.z)/(length(pos - circle.xy) * length(pos - circle.xy) ) + circle.xy;
}

vec2 circleInv(const vec2 pos, const vec3 circle, inout float dr){
    vec2 p = pos - circle.xy;
    float d = (circle.z * circle.z) / dot(p, p);
    //dr *= circle.w / d;
    //return (p * circle.w) / d + circle.xy;
    dr *= d;
    return p * d + circle.xy;
}

const float y = 1.3;
vec3 cRight = vec3(1, 0, 1);
vec3 cLeft = vec3(-1, 0, 1);
vec3 cTop = vec3(0, y, -1. + sqrt(1. + y * y));

const int ITERATIONS = 1000;
int maxIterations = 6;
int IIS(vec2 pos, out vec3 tex){
    bool fund = true;
    int invCount = 1;
    float dr = 1.;
	for(int i = 0 ; i < ITERATIONS ; i++){
        if(i > maxIterations) return 0;
        fund = true;

        if(distance(pos, cTop.xy) < cTop.z){
            // vec2 texTranslate = -cTop.xy + vec2(1.2, 0.77);
            // vec2 texSize = vec2(2);
            // tex = degamma(texture(u_imageTexture2,
            //                       abs( vec2( 1.) - (pos + texTranslate) / texSize))).rgb;
            // if(abs(distance(pos, cTop.xy) - cTop.z)/dr < 0.06/float(invCount)) {
            //     tex *= 0.5;
            // }

            float v = 1.;
            // if(abs(distance(pos, cTop.xy) - cTop.z)/dr < 0.03/float(invCount)) {
            //     v = 0.5;
            // }
            tex = hsv2rgb(vec3(-0.05 + (float(invCount) + 1.5) * 0.1 , 1., v));

            return ++invCount;
        }
        
        if(distance(pos, cRight.xy) < cRight.z ){
            pos = circleInv(pos, cRight, dr);
            invCount++;
            fund = false;
        }else if(distance(pos, cLeft.xy) < cLeft.z ){
            pos = circleInv(pos, cLeft, dr);
            invCount++;
            fund = false;
        }
        
//        if(fund){
//        	return invCount;
//        }
    }
	return 0;
}

vec4 computeColor(vec2 position) {
    vec3 col = vec3(0);
    float alpha = 1.0;

    if (abs(distance(position, cLeft.xy) - cLeft.z) < 0.02) {
        //col = vec3(0, 1, 0);
        return vec4(0, 0, 0, 1);
    }else if (abs(distance(position, cRight.xy) - cRight.z) < 0.02){
        col = vec3(0, 0, 0);
        return vec4(0, 0, 0, 1);
    }

    if (abs(distance(position, cLeft.xy)) < 0.02) {
        //col = vec3(0, 1, 0);
        return vec4(0, 0, 0, 1);
    }else if (abs(distance(position, cRight.xy)) < 0.02){
        col = vec3(0, 0, 0);
        return vec4(0, 0, 0, 1);
    }

    //return vec4(col, alpha);
    vec3 tex;
    int count = IIS(position, tex);
    if(count == 0) return vec4(vec3(0), 0.);
    return vec4(tex, alpha);
}

void main() {
    float ratio = u_resolution.x / u_resolution.y / 2.0;
    vec3 col;
    
    vec2 position = ( (gl_FragCoord.xy + Rand2n(gl_FragCoord.xy, u_numSamples)) / u_resolution.yy ) - vec2(ratio, 0.5);

    //position *= 5.;
    position *= 2.2;
    position += vec2(0, 1.);
    
    vec4 texCol = texture(u_accTexture, gl_FragCoord.xy / u_resolution);
	outColor = vec4(mix(computeColor(position), texCol, u_textureWeight));
}
