#version 300 es

precision mediump float;

uniform sampler2D u_accTexture;
uniform float u_textureWeight;
uniform float u_numSamples;
uniform vec2 u_resolution;
uniform int u_maxIterations;

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
vec2 rand2n(vec2 co, float sampleIndex) {
    vec2 seed = co * (sampleIndex + 1.0);
	seed+=vec2(-1,1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
                fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}


vec2 cPos1 = vec2(1.2631, 0);
vec2 cPos2 = vec2(0, 1.2631);
float cr1 = 0.771643;
float cr2 = 0.771643;
const float PI = 3.14159265359;

vec2 circleInverse(vec2 pos, vec2 circlePos, float circleR){
	return ((pos - circlePos) * circleR * circleR)/(length(pos - circlePos) * length(pos - circlePos) ) + circlePos;
}

vec2 reverseStereoProject(vec3 pos){
	return vec2(pos.x / (1. - pos.z), pos.y / (1. - pos.z));
}

vec4 circleIntersection(vec2 cPos1, float r1, vec2 cPos2, float r2){
	float x = cPos1.x - cPos2.x;
    float y = cPos1.y - cPos2.y;
    float x2 = x * x;
    float y2 = y * y;
    float x2y2 = x2 + y2;
    float a = (x2y2 + r2 * r2 - r1 * r1) / 2.;
    float a2 = a * a;
    float numR = sqrt(x2y2 * r2 * r2 - a2);
    return vec4((a * x + y * numR) / x2y2 + cPos2.x, (a * y - x * numR) / x2y2 + cPos2.y,
                (a * x - y * numR) / x2y2 + cPos2.x, (a * y + x * numR) / x2y2 + cPos2.y);
}


vec3 stereoProject(vec2 pos){
	float x = pos.x;
    float y = pos.y;
    float x2y2 = x * x + y * y;
    return vec3((2. * x) / (1. + x2y2),
                (2. * y) / (1. + x2y2),
                (-1. + x2y2) / (1. + x2y2));
}

vec3 getCircleFromSphere(vec3 upper, vec3 lower){
	vec2 p1 = reverseStereoProject(upper);
    vec2 p2 = reverseStereoProject(lower);
   	return vec3((p1 + p2) / 2., distance(p1, p2)/ 2.); 
}

bool revCircle = false;
bool revCircle2 = false;
const int ITERATIONS = 50;
float colCount = 0.;
bool outer = false;
int maxIterations = 100;

int IIS(vec2 pos, out vec3 tex){
    colCount = 0.;
    //if(length(pos) > 1.) return 0;

    bool fund = true;
    int invCount = 1;
	for(int i = 0 ; i < ITERATIONS ; i++){
        if(i > maxIterations) return 0;
        fund = true;

        if(revCircle){
            if(distance(pos, cPos1) > cr1 ){
                pos = circleInverse(pos, cPos1, cr1);
                invCount++;
                colCount++;
                fund = false;
                continue;
            }
            if(distance(pos, -cPos1) > cr1 ){
                pos = circleInverse(pos, -cPos1, cr1);
                invCount++;
                colCount++;
                fund = false;
                continue;
            }
        }else{
        	if(distance(pos, cPos1) < cr1 ){
                pos = circleInverse(pos, cPos1, cr1);
                invCount++;
                colCount++;
                fund = false;
                continue;
            }
            if(distance(pos, -cPos1) < cr1 ){
                pos = circleInverse(pos, -cPos1, cr1);
                invCount++;
                colCount++;
                fund = false;
                continue;
            }
        }
        
        if(revCircle2){
            if(distance(pos, cPos2) > cr2 ){
                pos = circleInverse(pos, cPos2, cr2);
                invCount++;
                colCount++;
                fund = false;
                continue;
            }
            if(distance(pos, -cPos2) > cr2 ){
                pos = circleInverse(pos, -cPos2, cr2);
                invCount++;
                colCount++;
                fund = false;
                continue;
            }
        }else{
        	if(distance(pos, cPos2) < cr2 ){
                pos = circleInverse(pos, cPos2, cr2);
                invCount++;
                colCount++;
                fund = false;
                continue;
            }
            if(distance(pos, -cPos2) < cr2 ){
                pos = circleInverse(pos, -cPos2, cr2);
                invCount++;
                colCount++;
                fund = false;
                continue;
            }
        }
        
        if(fund){
            vec2 texTranslate = vec2(0.57, 0.58);
            vec2 texSize = vec2(1.15);
            tex = degamma(texture(u_imageTexture3, abs(  vec2(0.,1.) - (pos + texTranslate) / texSize))).rgb;
            if(mod(float(invCount), 2.) == 0.){
                tex.yz *= 0.5;
            }
            if(length(pos) > 1.5){
                outer = true;
            	return 0;
            }
        	return invCount;
        }
    }

	return invCount;
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 calcCircleFromLine(vec4 line){
	float a = line.x;
    float b = line.y;
    float c = line.z;
    float d = line.w;
    
    float bcad = b * c - a * d;
    float a2 = a * a;
    float b2 = b * b;
    float c2 = c * c;
    float d2 = d * d;
    float c2d2 = (1. + c2 + d2);
    vec2 pos = vec2(((1. + a2) * d + b2 * d - b * c2d2)/(-2. * bcad),
                     (a2 * c + (1. + b2) * c - a * c2d2)/ (2. * bcad));
    return vec3(pos, distance(pos, line.xy));
}

void main(){
    float ratio = u_resolution.x / u_resolution.y / 2.0;
    float x = 0.57735;

    float bendX = 0.3;// 0. + 1. * abs(sin(iTime));;//PI / 6.;
    mat3 xRotate = mat3(1, 0, 0,
                        0, cos(bendX), -sin(bendX),
                        0, sin(bendX), cos(bendX));
    float bendY = 0.0;//PI/6.5;//-abs(0.8 * sin(iTime));
    mat3 yRotate = mat3(cos(bendY), 0, sin(bendY),
                         0, 1, 0,
                         -sin(bendY), 0, cos(bendY));
	float y = .57735;
    vec3 c1 = getCircleFromSphere(vec3(0, y, sqrt(1. - y * y))* xRotate,
                                  vec3(0, y, -sqrt(1. - y * y))* xRotate);
    vec3 c2 = getCircleFromSphere(vec3(x, 0, sqrt(1. - x * x)) * yRotate,
                                  vec3(x, 0, -sqrt(1. - x * x)) * yRotate);
    
	cr1 = c1.z;
    cr2 = c2.z;
    cPos1 = c1.xy;
    cPos2 = c2.xy;
    
    if(y > cPos1.y){
    	revCircle = true;
    }
	if(x > cPos2.x){
    	revCircle2 = true;
    }

    vec2 position = ( (gl_FragCoord.xy + rand2n(gl_FragCoord.xy, u_numSamples)) / u_resolution.yy ) - vec2(ratio, 0.5);

    //position *= ( 12.7);
    position *= ( 3.8);

    vec3 tex;
    int d = IIS(position, tex);

    vec4 col;

    if (abs(distance(position, cPos1) - cr1) < 0.01) {
        col = vec4(0, 0, 0, 1);
    }else if (abs(distance(position, -cPos1) - cr1) < 0.01){
        col = vec4(0, 0, 0, 1);
    } else if (abs(distance(position, cPos2) - cr2) < 0.01){
        col = vec4(0, 0, 0, 1);
    } else if (abs(distance(position, -cPos2) - cr2) < 0.01){
        col = vec4(0, 0, 0, 1);
    } else
    if(d == 0){
        col = vec4(0.,0.,0., 0.);
    }else{
        col = vec4(tex, 1.0);
        // if(mod(float(d), 2.) == 0.){
        //     col += hsv2rgb(vec3(0., 1., 1.));
        // }else{
        //     col += hsv2rgb(vec3(0.5, 1., 1.));
        // }
        
        // float cIni = 0.19;
        // if(mod(float(d), 2.) == 0.){
        //     if(outer){
        //         col = vec4(hsv2rgb(vec3(cIni, 1., 1.)), 1.0);
        //     }else{
        //         col = vec4(hsv2rgb(vec3(cIni, 1., 1.)), 1.0);
        //     }
        // }else{
        //     if(outer){
        //         col = vec4(hsv2rgb(vec3(cIni + 0.5 + 0.5, 1., 1.)), 1.0);
        //     }else{
        //         col = vec4(hsv2rgb(vec3(cIni + 0.5, 1., 1.)), 1.0);
        //     }
        // }
    }

    vec4 texCol = texture(u_accTexture, gl_FragCoord.xy / u_resolution);
	outColor = vec4(mix(col, texCol, u_textureWeight));
}
