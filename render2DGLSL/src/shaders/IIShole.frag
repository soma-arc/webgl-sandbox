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

vec4 plane1 = vec4(350, 0, 1, 0);
vec4 plane2 = vec4(650, 0, -1, 0);
const float zz=50.;
const float xx=zz*(zz + 600.)/600.;
const float cx=350.+xx;
const float cy=650.+zz;
const float cr = xx;
vec3 circle1 = vec3(350, 350, 300);
vec3 circle2 = vec3(cx, cy, cr);

const float PI = 3.14159265359;

vec2 circleInv(const vec2 pos, const vec3 circle, inout float dr){
    vec2 p = pos - circle.xy;
    float d = (circle.z * circle.z) / dot(p, p);
    //dr *= circle.w / d;
    //return (p * circle.w) / d + circle.xy;
    dr *= d;
    return p * d + circle.xy;
}

vec3 calcColor(float loopNum) {
    return hsv2rgb(vec3(0.01 + 0.05 * (loopNum -1.), 1., 1.));
}

const int ITERATIONS = 1000;
int maxIterations = 30;
bool isPrevHalfPlane = false;
vec4 prevHalfPlane;
vec4 currentHalfPlane;
vec3 prevCircle;
vec3 currentCircle;
float prevDr;
vec2 prevPos;
int IIS(vec2 pos, out vec2 lastPos){
    bool inFund = true;
    float invNum = 0.;
    float dr = 1.0;
    float prevDr = 1.0;
	for(int i = 0 ; i < ITERATIONS ; i++){
        if(i > maxIterations) return 0;
        inFund = true;

        pos -= plane1.xy;
        float dHalfPlane1 = dot(pos, plane1.zw);
        invNum += (dHalfPlane1 < 0.) ? 1. : 0.;
        inFund = (dHalfPlane1 < 0. ) ? false : inFund;
        if(dHalfPlane1 < 0. ) {
            isPrevHalfPlane = true;
            prevHalfPlane = currentHalfPlane;
            currentHalfPlane = plane1;
            prevPos = pos + plane1.xy;
        }
        pos -= 2.0 * min(0., dHalfPlane1) * plane1.zw;
        pos += plane1.xy;

        pos -= plane2.xy;
        float dHalfPlane2 = dot(pos, plane2.zw);
        invNum += (dHalfPlane2 < 0.) ? 1. : 0.;
        inFund = (dHalfPlane2 < 0. ) ? false : inFund;
        if(dHalfPlane1 < 0. ) {
            isPrevHalfPlane = true;
            prevHalfPlane = currentHalfPlane;
            currentHalfPlane = plane2;
            prevPos = pos + plane2.xy;
        }
        pos -= 2.0 * min(0., dHalfPlane2) * plane2.zw;
        pos += plane2.xy;
        
        if(distance(pos, circle1.xy) < circle1.z ){
            prevCircle = currentCircle;
            currentCircle = circle1;
            prevDr = dr;
            prevPos = pos;
            pos = circleInv(pos, circle1, dr);
            invNum++;
            isPrevHalfPlane = false;
            inFund = false;
        }else if(distance(pos, circle2.xy) < circle2.z ){
            prevCircle = currentCircle;
            currentCircle = circle2;
            prevDr = dr;
            prevPos = pos;
            pos = circleInv(pos, circle2, dr);
            invNum++;
            isPrevHalfPlane = false;
            inFund = false;
        }
        
        if(inFund){
            lastPos = pos;
        	return int(invNum);
        }
    }

    vec3 col;
    if(isPrevHalfPlane) {
        col = (invNum > 0. &&
               abs(dot(pos - currentHalfPlane.xy, currentHalfPlane.zw))  / dr < 0.003) ? calcColor(invNum) : vec3(0);
    } else {
        // Use previous position to avoid artifacts.
        // When pos is at the center of the circle,
        // the jacobian of the inversion becomes infinity.
        col = (invNum > 0. &&
               abs(distance(prevPos, currentCircle.xy) - currentCircle.z)  / prevDr < 0.003) ? calcColor(invNum) : vec3(0);
    }
    
    lastPos = pos;
	return 0;
}

vec4 computeColor(vec2 position) {
    vec3 col = vec3(0);
    float alpha = 1.0;

    vec2 lastPos;
    int count = IIS(position, lastPos);
    vec3 tex;
    if(lastPos.y <= 350. ) {
        return vec4(vec3(1), 1.);
    }
    if (lastPos.x>=350. && lastPos.x<=350.+300.*xx/(300.+xx) && lastPos.y>=640. && lastPos.y<=650.+zz) {
        return vec4(vec3(1), 1.);
    }
    tex = hsv2rgb(vec3(0.05 * (float(count)), 1, 1));
    return vec4(tex, alpha);
}

void main() {
    float ratio = u_resolution.x / u_resolution.y / 2.0;
    vec3 col;
    
    vec2 position = ( (gl_FragCoord.xy + Rand2n(gl_FragCoord.xy, u_numSamples)) / u_resolution.yy ) - vec2(ratio, 0.5);
    position *= 2000.;
    position.y *= -1.;
    //position *= 11.;
    position += vec2(300, 500);
    
    vec4 texCol = texture(u_accTexture, gl_FragCoord.xy / u_resolution);
	outColor = vec4(mix(computeColor(position), texCol, u_textureWeight));
}
