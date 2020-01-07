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

// Apollonius packing
// vec3 cLeft = vec3(-1, -1, 1);
// vec3 cCenter = vec3(0, -0.25, 0.25);
// vec3 cRight = vec3(1, -1,  1);

// hyperbolic tessellation
// vec3 cLeft = vec3(-1, -0.7071067811865476, 0.7071067811865476);
// vec3 cCenter = vec3(0, -1.0606601717798212, 0.3535533905932737);
// vec3 cRight = vec3(1, -0.7071067811865476, 0.7071067811865476 );

vec3 cLeft = vec3(-1, -0.7071067811865476, 0.7071067811865476);
vec3 cCenter = vec3(0, -1.0606601717798212, 0.3535533905932737);
vec3 cRight = vec3(1, -0.7071067811865476, 0.7071067811865476 );

const int ITERATIONS = 1000;
int maxIterations = 100;
int IIS(vec2 pos, out vec3 tex){
    bool fund = true;
    int invCount = 1;
	for(int i = 0 ; i < ITERATIONS ; i++){
        if(i > maxIterations) return 0;
        fund = true;

        // if(distance(pos, originCLeft.xy) < originCLeft.z ){
        //     invCount++;            
        //     vec2 texTranslate = vec2(1.2, 1.4);
        //     vec2 texSize = vec2(2.2);
        //     tex = degamma(texture(u_imageTexture3,
        //                           abs(vec2(0.,1.) - (pos + texTranslate) / texSize))).rgb;
        //     // if(abs(distance(pos, originCLeft.xy) - originCLeft.z) < 0.06) {
        //     //     tex *= 0.5;
        //     // }
        //     return invCount;
        // } else if (distance(pos, originCRight.xy) < originCRight.z) {
        //     invCount++;
        //     vec2 texTranslate = vec2(1., 1.4);
        //     vec2 texSize = vec2(2.2);
        //     tex = degamma(texture(u_imageTexture2,
        //                           abs(vec2(0.,1.) - (pos + texTranslate) / texSize))).rgb;
        //     // if(abs(distance(pos, originCRight.xy) - originCRight.z) < 0.06) {
        //     //     tex *= 0.5;
        //     // }
        //     return invCount;
        // }
        
        if(pos.y > 0.){
            pos.y *= -1.;
            invCount++;
            fund = false;
        }else if(distance(pos, cCenter.xy) < cCenter.z ){
            pos = circleInvert(pos, cCenter);
            invCount++;
            fund = false;
        }else if(distance(pos, cRight.xy) < cRight.z ){
            pos = circleInvert(pos, cRight);
            invCount++;
            fund = false;
        }else if(distance(pos, cLeft.xy) < cLeft.z ){
            pos = circleInvert(pos, cLeft);
            invCount++;
            fund = false;
        } 
        
        if(fund){
            // if (pos.x > 1. ||
            //     pos.x < -1. ||
            //     pos.y > 1.4 ||
            //     pos.y < -0.4
            //     ) {
            //     return 0;
            // }

            if (pos.x > 1. ||
                pos.x < -1. ||
                pos.y > 0. ||
                pos.y < (-2. * sqrt(2.)) / 3.0
                ) {
                return 0;
            }
            
            if (pos.x < 0.) {
                vec2 texTranslate = vec2(-0.1, 1.4);
                vec2 texSize = vec2(1.5);
                tex = degamma(texture(u_imageTexture3,
                                      abs(vec2(0.,1.) - (pos + texTranslate) / texSize))).rgb;
            } else {
                vec2 texTranslate = vec2(-1.4, 1.4);
                vec2 texSize = vec2(1.5);
                tex = degamma(texture(u_imageTexture3,
                                      abs(vec2(0.,1.) - (pos + texTranslate) / texSize))).rgb;
            }
            if(mod(float(invCount), 2.) == 0.){
                tex.yz *= 0.5;
            }
            // float strokeWeight = 0.02 ;
            // if(abs(pos.y) < strokeWeight ||
            //    distance(pos, cCenter.xy) - cCenter.z < strokeWeight ||
            //    distance(pos, cRight.xy) - cRight.z < strokeWeight ||
            //    distance(pos, cLeft.xy) - cLeft.z < strokeWeight){
            //     tex *= 0.5;
            // }
        	return invCount;
        }
    }

	return 0;
}

vec4 computeColor(vec2 position) {
    vec3 col = vec3(0);
    float alpha = 1.0;

    float strokeWeight = 0.01;
    if (abs(position.y) < strokeWeight) {
        col = vec3(0);
        return vec4(col, alpha);        
    }else
     if (abs(distance(position, cCenter.xy) - cCenter.z) < strokeWeight){
        col = vec3(0);
        return vec4(col, alpha);
    }else if (abs(distance(position, cRight.xy) - cRight.z) < strokeWeight){
        col = vec3(0);
        return vec4(col, alpha);
    }else if (abs(distance(position, cLeft.xy) - cLeft.z) < strokeWeight){
        col = vec3(0);
         return vec4(col, alpha);
     } else
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
    position *= 5.2;
    //position *= 13.5;
    computeColor(position);
    
    vec4 texCol = texture(u_accTexture, gl_FragCoord.xy / u_resolution);
	outColor = vec4(mix(computeColor(position), texCol, u_textureWeight));
}
