#version 300 es

precision mediump float;

out vec4 outColor;

uniform sampler2D u_accTexture;
uniform vec2 u_resolution;
// [translateX, translateY, scale]
uniform vec3 u_geometry;
uniform int u_maxIISIterations;
uniform sampler2D u_imageTextures;

struct Circle {
    vec4 centerAndRadius; // [x, y, r, r * r]
    float ui; // [boundaryThickness]
};

struct HalfPlane {
    vec2 p;
    vec2 normal; //[x, y]
};

//[x, y, r, r * r]
{% for n  in range(0,  numCircles ) %}
uniform Circle u_circle{{ n }};
{% endfor %}

{% for n in range(0, numHalfPlanes) %}
uniform HalfPlane u_halfPlane{{ n }};
{% endfor %}

const vec3 BLACK = vec3(0);
const vec3 WHITE = vec3(1);
const vec3 GRAY = vec3(0.78);
const vec3 RED = vec3(0.8, 0, 0);
const vec3 GREEN = vec3(0, 0.8, 0);
const vec3 BLUE = vec3(0, 0, 0.8);
const vec3 YELLOW = vec3(1, 1, 0);
const vec3 PINK = vec3(.78, 0, .78);
const vec3 LIGHT_BLUE = vec3(0, 1, 1);

vec3 hsv2rgb(float h, float s, float v){
    vec3 c = vec3(h, s, v);
    const vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// front to back blend
vec4 blendCol(vec4 srcC, vec4 outC){
	srcC.rgb *= srcC.a;
	return outC + srcC * (1.0 - outC.a);
}

// from Syntopia http://blog.hvidtfeldts.net/index.php/2015/01/path-tracing-3d-fractals/
vec2 rand2n(const vec2 co, const float sampleIndex) {
    vec2 seed = co * (sampleIndex + 1.0);
    seed+=vec2(-1,1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
                fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}

// circle [x, y, radius, radius * radius]
vec2 circleInvert(const vec2 pos, const vec4 circle){
    vec2 p = pos - circle.xy;
    float d = length(p);
    return (p * circle.w)/(d * d) + circle.xy;
}

void renderGenerator(vec2 pos, out vec3 color) {
    color = vec3(0);
    float dist;
    {% for n in range(0, numCircles) %}
    if(distance(pos, u_circle{{ n }}.centerAndRadius.xy) < u_circle{{ n }}.centerAndRadius.z) {
        color = RED;
        return;
    }
    {% endfor %}

    {% for n in range(0, numHalfPlanes) %}
    if(dot(normalize(u_halfPlane{{ n }}.p - pos), normalize(u_halfPlane{{ n }}.normal.xy)) > 0. ) {
        color = RED;
        return;
    }
    {% endfor %}
}

vec3 computeColor(float loopNum) {
    return hsv2rgb(0.01 + 0.05 * (loopNum -1.), 1., 1.);
}

const int MAX_ITERATIONS = 200;
void IIS(vec2 pos, out vec3 col) {
    float invNum = 0.;
    bool inFund = true;
    vec4 c = vec4(0);

    for (int i = 0; i < MAX_ITERATIONS; i++) {
        if(i > u_maxIISIterations) break;
        inFund = true;
        
        {% for n in range(0,  numCircles ) %}
        if(distance(pos, u_circle{{ n }}.centerAndRadius.xy) < u_circle{{ n }}.centerAndRadius.z){
            pos = circleInvert(pos, u_circle{{ n }}.centerAndRadius);
            inFund = false;
            invNum++;
            continue;
        }
        {% endfor %}

        {% for n in range(0, numHalfPlanes ) %}
        pos -= u_halfPlane{{ n }}.p;
        float dHalfPlane{{ n }} = dot(pos, u_halfPlane{{ n }}.normal.xy);
        invNum += (dHalfPlane{{ n }} < 0.) ? 1. : 0.;
        inFund = (dHalfPlane{{ n }} < 0. ) ? false : inFund;
        pos -= 2.0 * min(0., dHalfPlane{{ n }}) * u_halfPlane{{ n }}.normal.xy;
        pos += u_halfPlane{{ n }}.p;
        {% endfor %}

        if (inFund) break;
    }
    col = computeColor(invNum);
    
}


const float MAX_SAMPLES = 20.;
void main() {
    vec3 sum = vec3(0);
    float ratio = u_resolution.x / u_resolution.y / 2.0;
    for(float i = 0.; i < MAX_SAMPLES; i++){
        vec2 position = ((gl_FragCoord.xy + rand2n(gl_FragCoord.xy, i)) / u_resolution.yy ) - vec2(ratio, 0.5);
        position = position * u_geometry.z;
        position += u_geometry.xy;

        vec3 col;
        renderGenerator(position, col);
        sum = sum + col;
    }
    vec3 texCol = textureLod(u_accTexture, gl_FragCoord.xy / u_resolution, 0.0).rgb;
    outColor = vec4(sum / MAX_SAMPLES, 1);
}
