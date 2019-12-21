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

const int ITERATIONS = 50;
int maxIterations = 4;
int IIS(vec2 pos){
    if(length(pos) > 1.) return 0;

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
        }else if(distance(pos, c4.xy) < c4.z ){
            pos = circleInvert(pos, c4);
            invCount++;
            fund = false;
        } 
        
        if(fund){
        	return invCount;
        }
    }

	return 0;
}

vec4 computeColor(vec2 position) {
    vec3 col = vec3(0);
    int d = IIS(position);
    float alpha = 1.0;
    if(d == 0){
        col = vec3(0.,0.,0.);
        alpha = 0.0;
    }else{
        if(mod(float(d), 2.) == 0.){
            col += hsv2rgb(vec3(0., 1., 1.));
        }else{
            col += hsv2rgb(vec3(0.5, 1., 1.));
        }
    }
    return vec4(col, alpha);
}

void main() {
    float ratio = u_resolution.x / u_resolution.y / 2.0;
    vec3 col;
    
    vec2 position = ( (gl_FragCoord.xy + Rand2n(gl_FragCoord.xy, u_numSamples)) / u_resolution.yy ) - vec2(ratio, 0.5);
    position *= 2.2;

    computeColor(position);
    
    vec4 texCol = texture(u_accTexture, gl_FragCoord.xy / u_resolution);
	outColor = vec4(mix(computeColor(position), texCol, u_textureWeight));
}
