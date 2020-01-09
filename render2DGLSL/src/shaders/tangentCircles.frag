#version 300 es

precision mediump float;

uniform sampler2D u_accTexture;
uniform float u_textureWeight;
uniform float u_numSamples;
uniform vec2 u_resolution;
uniform int u_maxIterations;
uniform sampler2D u_imageTexture2;
uniform sampler2D u_imageTexture3;

out vec4 outColor;

vec3 originCRight = vec3(.5, -0.3, 0.58);
vec3 originCLeft = vec3(-.5, -0.3, 0.58);

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

const float triangleEdgeLength = 5.0;

const float sq = 1. / sqrt(2.);
// const vec3 c1 = vec3(sq + sq, sq - sq, 1);
// const vec3 c2 = vec3(sq - sq, sq + sq, 1);
// const vec3 c3 = vec3(-sq + sq, -sq -sq, 1);
// const vec3 c4 = vec3(-sq -sq, -sq + sq, 1);
const vec3 cInner = vec3(0, 0, 1);

const float cos50 = cos(0.8726646259971648);
const float cos40 = cos(0.6981317007977318);
const float cos55 = cos(0.9599310885968813);
const float cos35 = cos(0.6108652381980153);
// const vec3 c1 = vec3(0, 2. * cos50, 1);
// const vec3 c2 = vec3(-2. * cos40, 0, 1);
// const vec3 c3 = vec3(0, -2. * cos50, 1);
// const vec3 c4 = vec3(2. * cos40, 0, 1);
const vec3 c1 = vec3(0, 2. * cos55, 1);
const vec3 c2 = vec3(-2. * cos35, 0, 1);
const vec3 c3 = vec3(0, -2. * cos55, 1);
const vec3 c4 = vec3(2. * cos35, 0, 1);

const int ITERATIONS = 10000;
int maxIterations = 0;
int IIS(vec2 pos, out vec3 tex){
    bool fund = true;
    int invCount = 1;
	for(int i = 0 ; i < ITERATIONS ; i++){
        if(i > maxIterations) return 0;
        fund = true;

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
        }
        else if(distance(pos, c4.xy) < c4.z ){
            pos = circleInvert(pos, c4);
            invCount++;
            fund = false;
        }

        if(fund){
            if (distance(cInner.xy, pos) > cInner.z) {
                return 0;
            }

            if (distance(cInner.xy, pos) < cInner.z * 0.5) {
                //vec2 texTranslate = vec2(0.75, 0.8);
                //vec2 texSize = vec2(1.5);
                vec2 texTranslate = vec2(.75, 0.77);
                vec2 texSize = vec2(1.5);
                tex = degamma(texture(u_imageTexture3,
                                      abs(vec2(0.,1.) - (pos + texTranslate) / texSize))).rgb;
            } else {
                vec2 texTranslate = vec2(0., 0.77);
                vec2 texSize = vec2(1.5);
                tex = degamma(texture(u_imageTexture3,
                                      abs(vec2(0.,1.) - (pos + texTranslate) / texSize))).rgb;
            }

            if(mod(float(invCount), 2.) == 0.){
                tex.yz *= 0.5;
            }
        	return invCount;
        }
    }

	return 0;
}

vec4 computeColor(vec2 position) {
    vec3 col = vec3(0);
    float alpha = 1.0;

    float strokeWeight = 0.01;

     if (abs(distance(position, c1.xy) - c1.z) < strokeWeight){
        col = vec3(0);
        return vec4(col, alpha);
    }else if (abs(distance(position, c2.xy) - c2.z) < strokeWeight){
        col = vec3(0);
        return vec4(col, alpha);
    }else if (abs(distance(position, c3.xy) - c3.z) < strokeWeight){
        col = vec3(0);
        return vec4(col, alpha);
     }else if (abs(distance(position, c4.xy) - c4.z) < strokeWeight){
         col = vec3(0);
         return vec4(col, alpha);
         
     }// lse if (abs(distance(position, cInner.xy) - cInner.z) < strokeWeight){
     //     col = vec3(0);
     //     return vec4(col, alpha);
     // }
     else
        {
        col = vec3(1);
    }

    vec3 tex;
    int count = IIS(position, tex);
    if(count == 0) return vec4(vec3(0), 0.);
    //if(count == 2) return vec4(vec3(0, 0.7, 0), 1.);
    //return vec4(hsv2rgb(vec3(float(count) * 0.01, 1., 1.)), alpha);
    return vec4(tex, 1.0);
}

void main() {
    float ratio = u_resolution.x / u_resolution.y / 2.0;
    vec3 col;
    
    vec2 position = ( (gl_FragCoord.xy + Rand2n(gl_FragCoord.xy, u_numSamples)) / u_resolution.yy ) - vec2(ratio, 0.5);
    position *= 5.5;
    //position *= 5.2;
    //position *= 11.;

    computeColor(position);
    
    vec4 texCol = texture(u_accTexture, gl_FragCoord.xy / u_resolution);
	outColor = vec4(mix(computeColor(position), texCol, u_textureWeight));
}
