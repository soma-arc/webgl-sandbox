#version 300 es

precision mediump float;

uniform sampler2D u_accTexture;
uniform float u_textureWeight;
uniform float u_numSamples;
uniform vec2 u_resolution;
uniform int u_maxIterations;

out vec4 outColor;


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


vec3 c1 = vec3(1.7317, 0, 1.413);
vec3 c2 = vec3(0, 1.7317, 1.413);
vec3 c3 = vec3(0, -1.7317, 1.413);
vec3 c4 = vec3(-1.7317, 0, 1.413);

const float PI = 3.14159265359;


vec2 circleInvert(vec2 pos, vec3 circle){
	return ((pos - circle.xy) * circle.z * circle.z)/(length(pos - circle.xy) * length(pos - circle.xy) ) + circle.xy;
}

const float triangleEdgeLength = 5.0;
vec3 cCenter = vec3(triangleEdgeLength * 0.5, sqrt(3.) * triangleEdgeLength / 6.0,
                    triangleEdgeLength * (2.0 * sqrt(3.0) - 3.)/6.0);
vec3 cRight = vec3(triangleEdgeLength, 0, triangleEdgeLength * 0.5);
vec3 cLeft = vec3(0, 0, triangleEdgeLength * 0.5);
vec3 cTop = vec3(triangleEdgeLength * 0.5, sqrt(3.) * 0.5 * triangleEdgeLength, triangleEdgeLength * 0.5);

vec3 redCircleRight = vec3(3.1698729810778064, 1.8301270189221934, 0.6698729810778069);
vec3 redCircleLeft = vec3(1.8301270189221932, 1.8301270189221934, 0.6698729810778066 );

const int ITERATIONS = 50;
int maxIterations = 20;
int IIS(vec2 pos){
    bool fund = true;
    int invCount = 1;
	for(int i = 0 ; i < ITERATIONS ; i++){
        if(i > maxIterations) return 0;
        fund = true;

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

        if(distance(pos, redCircleRight.xy) < redCircleRight.z ){
            return ++invCount;
        } else if (distance(pos, redCircleLeft.xy) < redCircleLeft.z) {
            return ++invCount;
        }
        
        
        if(fund){
        	return invCount;
        }
    }

	return 0;
}

vec4 computeColor(vec2 position) {
    vec3 col = vec3(0);
    float alpha = 1.0;

    if (abs(distance(position, cTop.xy) - cTop.z) < 0.01) {
        col = vec3(0);
    }else if (abs(distance(position, cCenter.xy) - cCenter.z) < 0.01){
        col = vec3(0);
    }else if (abs(distance(position, cRight.xy) - cRight.z) < 0.01){
        col = vec3(0);
    }else if (abs(distance(position, cLeft.xy) - cLeft.z) < 0.01){
        col = vec3(0);
    }else if (abs(distance(position, redCircleRight.xy) - redCircleRight.z) < 0.01){
        col = vec3(1, 0, 0);
    }else if (abs(distance(position, redCircleLeft.xy) - redCircleLeft.z) < 0.01){
        col = vec3(1, 0, 0);
    }else {
        col = vec3(1);
    }
    return vec4(col, alpha);
    
    int count = IIS(position);
    if(count == 0) return vec4(vec3(0), alpha);
    return vec4(hsv2rgb(vec3(float(count) * 0.01, 1., 1.)), alpha);
}

void main() {
    float ratio = u_resolution.x / u_resolution.y / 2.0;
    vec3 col;
    
    vec2 position = ( (gl_FragCoord.xy + Rand2n(gl_FragCoord.xy, u_numSamples)) / u_resolution.yy ) - vec2(ratio, 0.5);
    position *= 11.2;
    position += 2.0;
    
    vec4 texCol = texture(u_accTexture, gl_FragCoord.xy / u_resolution);
	outColor = vec4(mix(computeColor(position), texCol, u_textureWeight));
}
