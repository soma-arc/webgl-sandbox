#version 300 es
precision mediump float;

in vec2 v_texCoord;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec2 u_textureResolution;
uniform float u_time;

// from Syntopia http://blog.hvidtfeldts.net/index.php/2015/01/path-tracing-3d-fractals/
vec2 rand2n(vec2 co, float sampleIndex) {
	vec2 seed = co * (sampleIndex + 1.0);
	seed+=vec2(-1,1);
	// implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
	return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
                fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}

mat3 getRotationX(float rotationDegrees) {
    float thetaRad = radians(rotationDegrees);
    float cosTheta = cos(thetaRad);
    float sinTheta = sin(thetaRad);
    return mat3(1, 0, 0,
                0, cosTheta, -sinTheta,
                0, sinTheta, cosTheta);
}

mat3 getRotationY(float rotationDegrees){
    float thetaRad = radians(rotationDegrees);
    float cosTheta = cos(thetaRad);
    float sinTheta = sin(thetaRad);
    return mat3(cosTheta, 0, sinTheta,
                0, 1, 0,
                -sinTheta, 0, cosTheta);
}

mat3 getRotationZ(float rotationDegrees){
    float thetaRad = radians(rotationDegrees);
    float cosTheta = cos(thetaRad);
    float sinTheta = sin(thetaRad);
    return mat3(cosTheta, -sinTheta, 0,
                sinTheta, cosTheta, 0,
                0, 0, 1);
}

vec2 opUnion(vec2 d1, vec2 d2) {
	return (d1.x < d2.x) ? d1 : d2;
}

float distSphere(vec3 p, vec4 sphere){
	return distance(p, sphere.xyz) - sphere.w;
}

float distPlane(vec3 p, vec4 n) {
    return dot(p, n.xyz) + n.w;
}

float distEllipsoid( in vec3 p, in vec3 r ) 
{
    float k0 = length(p/r);
    float k1 = length(p/(r*r));
    return k0*(k0-1.0)/k1;
}

float distTorus( vec3 p, vec2 t ) {
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float distVerticalCapsule( vec3 p, float h, float r )
{
  p.y -= clamp( p.y, 0.0, h );
  return length( p ) - r;
}

float distCappedTorus(in vec3 p, in vec2 sc, in float ra, in float rb)
{
  p.x = abs(p.x);
  float k = (sc.y*p.x>sc.x*p.y) ? dot(p.xy,sc) : length(p.xy);
  return sqrt( dot(p,p) + ra*ra - 2.0*ra*k ) - rb;
}

const int OBJ_KYU_BODY = 1;
const int OBJ_KYU_EYE = 2;
const int OBJ_KYU_BROW = 3;
const int OBJ_KYU_MOUTH = 4;
const int OBJ_KYU_CHEEK = 5;
const int OBJ_KYU_ARM = 6;
const int OBJ_KYU_TAIL = 7;

vec2 distKyuBrow(vec3 p) {
    mat3 r1 = getRotationX(135.) * getRotationY(-70.) * getRotationZ(-30.);
    mat3 r2 = getRotationX(135.) * getRotationY(70.) * getRotationZ(30.);
    vec3 t1 = vec3(130, -260, -180);
    vec3 t2 = vec3(-130, -260, -180);
    return opUnion(vec2(distVerticalCapsule(r1 * (p + t1), 100., 20.),
                   OBJ_KYU_BROW),
                   vec2(distVerticalCapsule(r2 * (p + t2), 100., 20.),
                   OBJ_KYU_BROW));
}

vec2 distKyuEye(vec3 p) {
    mat3 r1 = getRotationX(40.) * getRotationZ(15.);
    mat3 r2 = getRotationX(40.) * getRotationZ(-15.);
    vec3 t1 = vec3(120, -200, -280);
    vec3 t2 = vec3(-120, -200, -280);
    return opUnion(vec2(distTorus(r1 * (p + t1), vec2(50, 20)),
                   OBJ_KYU_EYE),
                   vec2(distTorus(r2 * (p + t2), vec2(50, 20)),
                   OBJ_KYU_EYE));
}

vec2 distKyuMouth(vec3 p){
    mat3 r = getRotationX(30.) * getRotationZ(180.);
    vec3 t1 = vec3(120 -70, -120, -350);
    vec3 t2 = vec3(10  -70, -120, -350);
    float an = radians(90.);
    return opUnion(vec2(distCappedTorus(r * (p + t1), vec2(sin(an),cos(an)), 50., 20.),
                        OBJ_KYU_MOUTH),
                   vec2(distCappedTorus(r * (p + t2), vec2(sin(an),cos(an)), 50., 20.),
                        OBJ_KYU_MOUTH));
}

vec2 distKyuCheek(vec3 p ) {
    mat3 r1 = getRotationX(130.) * getRotationY(-40.) * getRotationZ(-20.);
    mat3 r2 = getRotationX(130.) * getRotationY(40.) * getRotationZ(20.);
    vec3 t1 = vec3(-260, -140, -280);
    vec3 t2 = vec3(260, -140, -280);
    return opUnion(vec2(distVerticalCapsule(r1 * (p + t1), 100., 20.),
                   OBJ_KYU_BROW),
                   vec2(distVerticalCapsule(r2 * (p + t2), 100., 20.),
                   OBJ_KYU_BROW));
}

vec2 distKyuArm(vec3 p){
    return opUnion(vec2(distEllipsoid(p + vec3(400, 0, -100),
                                      vec3(100, 100, 200)),
                   OBJ_KYU_ARM),
                   vec2(distEllipsoid(p + vec3(-400, 0, -100),
                                      vec3(100, 100, 200)),
                   OBJ_KYU_ARM));
}

vec2 distKyuTail(vec3 p){
    return vec2(distEllipsoid(p + vec3(0, 0, 500), 
                              vec3(200, 100, 200)),
                OBJ_KYU_TAIL);
}

vec2 distKyu190a(vec3 p) {
    p = getRotationX(-90.) * p;
    vec2 d = vec2(distEllipsoid(p, vec3(500, 300, 400)), OBJ_KYU_BODY);
    d = opUnion(d, distKyuEye(p));
    d = opUnion(d, distKyuBrow(p));
    d = opUnion(d, distKyuMouth(p));
    d = opUnion(d, distKyuCheek(p));
    d = opUnion(d, distKyuArm(p));
    d = opUnion(d, distKyuTail(p));
    return d;
}

vec3 getMatKyu190a(int objId) {
    if(objId == OBJ_KYU_BODY){
        return vec3(1);
    } else if(objId == OBJ_KYU_EYE) {
        return vec3(0);
    } else if(objId == OBJ_KYU_BROW) {
        return vec3(0);
    } else if (objId== OBJ_KYU_MOUTH) {
        return vec3(0);
    } else if(objId == OBJ_KYU_CHEEK) {
        return vec3(0);
    } else if(objId == OBJ_KYU_ARM) {
        return vec3(1);
    } else if(objId == OBJ_KYU_TAIL) {
        return vec3(1);
    }
}

const float schottkyRadius = 300.;
vec4 schottky1 = vec4(300, 300, 0, schottkyRadius);
vec4 schottky2 = vec4(300, -300, 0, schottkyRadius);
vec4 schottky3 = vec4(-300, 300, 0, schottkyRadius);
vec4 schottky4 = vec4(-300, -300, 0, schottkyRadius);
vec4 schottky5 = vec4(0, 0, 424.26, schottkyRadius);
vec4 schottky6 = vec4(0, 0, -424.26, schottkyRadius);

vec3 sphereInvert(vec3 pos, vec4 sphere){
	vec3 diff = pos - sphere.xyz;
    float d = length(diff);
	return (diff * sphere.w * sphere.w)/(d * d) + sphere.xyz;
}

float loopNum = 0.;
vec4 baseSphere = vec4(0, 0, 0, 125);
const int MAX_KLEIN_ITARATION = 50;
int g_mat;
float distKlein(vec3 pos){
    float scalingFactor= 0.01;
    loopNum = 0.;
    float dr = 1.;
    bool loopEnd = true;
    for(int i = 0 ; i < MAX_KLEIN_ITARATION ; i++){
        loopEnd = true;
        if(distance(pos, schottky1.xyz) < schottky1.w){
            vec3 diff = (pos - schottky1.xyz);
            dr *= (schottky1.w * schottky1.w) / dot(diff, diff);
            pos = sphereInvert(pos, schottky1);
            loopEnd = false;
            loopNum++;
        }else if(distance(pos, schottky2.xyz) < schottky2.w){
            vec3 diff = (pos- schottky2.xyz);
            dr *= (schottky2.w * schottky2.w) / dot(diff, diff);
            pos = sphereInvert(pos, schottky2);
            loopEnd = false;
            loopNum++;
        }else if(distance(pos, schottky3.xyz) < schottky3.w){
            vec3 diff = (pos- schottky3.xyz);
            dr *= (schottky3.w * schottky3.w) / dot(diff, diff);
            pos = sphereInvert(pos, schottky3);
            loopEnd = false;
            loopNum++;
        }else if(distance(pos, schottky4.xyz) < schottky4.w){
            vec3 diff = (pos- schottky4.xyz);
            dr *= (schottky4.w * schottky4.w) / dot(diff, diff);
            pos = sphereInvert(pos, schottky4);
            loopEnd = false;
            loopNum++;
        }else if(distance(pos, schottky5.xyz) < schottky5.w){
            vec3 diff = (pos- schottky5.xyz);
            dr *= (schottky5.w * schottky5.w) / dot(diff, diff);
            pos = sphereInvert(pos, schottky5);
            loopEnd = false;
            loopNum++;
        }else if(distance(pos, schottky6.xyz) < schottky6.w){
            vec3 diff = (pos- schottky6.xyz);
            dr *= (schottky6.w * schottky6.w) / dot(diff, diff);
            pos = sphereInvert(pos, schottky6);
            loopEnd = false;
            loopNum++;
        }
        if(loopEnd == true) break;
    }
  
  
    vec2 d = distKyu190a(pos * 4.5 + vec3(0, 0, -140));
    g_mat = int(d.y);
    return d.x / abs(dr) * scalingFactor;
}

vec3 calcRay (const vec3 eye, const vec3 target, const vec3 up, const float fov,
              const float width, const float height, const vec2 coord){
    float imagePlane = (height * .5) / tan(fov * .5);
    vec3 v = normalize(target - eye);
    vec3 xaxis = normalize(cross(v, up));
    vec3 yaxis =  normalize(cross(v, xaxis));
    vec3 center = v * imagePlane;
    vec3 origin = center - (xaxis * (width  *.5)) - (yaxis * (height * .5));
    return normalize(origin + (xaxis * coord.x) + (yaxis * (height - coord.y)));
}

const vec4 K = vec4(1.0, .666666, .333333, 3.0);
vec3 hsv2rgb(const vec3 c){
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float distFunc(vec3 p){
    return distKlein(p * getRotationY(80.));
}

const vec2 d = vec2(0.01, 0.);
vec3 getNormal(const vec3 p){
    return normalize(vec3(distFunc(p + d.xyy) - distFunc(p - d.xyy),
                          distFunc(p + d.yxy) - distFunc(p - d.yxy),
                          distFunc(p + d.yyx) - distFunc(p - d.yyx)));
}

const int MAX_MARCHING_LOOP = 800;
vec2 march(const vec3 origin, const  vec3 ray, const float threshold,
           float t0, float t1){
    vec3 rayPos = origin + t0 * ray;
    float dist;
    float rayLength = t0;
    for(int i = 0 ; i < MAX_MARCHING_LOOP ; i++){
        if(rayLength > t1) break;
        dist = distFunc(rayPos);
        rayLength += dist;
        rayPos = origin + ray * rayLength ;
        if(dist < threshold) break;
    }
    return vec2(dist, rayLength);
}

bool intersectBoundingSphere(vec3 sphereCenter, float radius, 
                     vec3 rayOrigin, vec3 rayDir, 
                     out float t0, out float t1){
  	vec3 v = rayOrigin - sphereCenter;
  	float b = dot(rayDir, v);
  	float c = dot(v, v) - radius * radius;
  	float d = b * b - c;
    const float EPSILON = 0.0001;
  	if(d >= 0.){
    	float s = sqrt(d);
    	float tm = -b - s;
        t0 = tm;
        if(tm <= EPSILON){
            t1 = tm;
            tm = -b + s;
            t0 = tm;
        }else{
        	t1 = -b + s;
        }
    	if(EPSILON < tm){            
      		return true;
    	}
  	}
  	return false;
}

float EPSILON = 0.001;
bool intersectSphere(vec4 sphere,
                     vec3 rayOrigin, vec3 rayDir, 
                     inout float minDist,
                     inout vec3 intersection, inout vec3 normal){
  	vec3 v = rayOrigin - sphere.xyz;
  	float b = dot(rayDir, v);
  	float c = dot(v, v) - sphere.w * sphere.w;
  	float d = b * b - c;
  	if(d >= 0.){
    	float s = sqrt(d);
    	float t = -b - s;
    	if(t <= EPSILON) t = -b + s;
    	if(EPSILON < t && t < minDist){
      		intersection = (rayOrigin + t * rayDir);
      		minDist = t;
            normal = normalize(intersection - sphere.xyz);
      		return true;
    	}
  	}
  	return false;
}

const vec3 LIGHT_DIR= normalize(vec3(1, 1, 0));
const vec3 BLACK = vec3(0);
const vec3 AMBIENT_FACTOR = vec3(.1);
float transparent = 0.4;

vec3 calcColor(vec3 eye, vec3 ray){
    vec3 l = BLACK;
    float coeff = 1.;
    float t0, t1;
    bool intersect =  intersectBoundingSphere(vec3(0), 310., eye, ray, t0, t1);
    if(intersect == false) return l; 
    vec2 result = march(eye, ray, 0.01, t0, t1);
    if(result.x < 0.01){
        vec3 intersection = eye + ray * result.y;
        vec3 matColor = vec3(0);
        vec3 normal = getNormal(intersection);
        matColor = getMatKyu190a(g_mat);

        vec3 diffuse =  clamp(dot(normal, LIGHT_DIR), 0., 1.) * matColor;
    	vec3 ambient = matColor * AMBIENT_FACTOR;
        l += ambient + diffuse;
    }
    return l;
}

const float DISPLAY_GAMMA_COEFF = 1. / 2.2;
vec3 gammaCorrect(vec3 rgb) {
    return vec3((min(pow(rgb.r, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgb.g, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgb.b, DISPLAY_GAMMA_COEFF), 1.)));
}

const vec3 eye = vec3(300 , 0., 550 );
const vec3 target = vec3(0, 0, 0);
const vec3 up = vec3(1, 0, 0);
float fov = radians(60.);

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

const float SAMPLE_NUM = 2.;
out vec4 fragColor;
void main(){
	vec3 sum = vec3(0);
        mat3 r = getRotationX(mod(u_time * 20.0, 360.));
        vec3 eye = r * vec3(350. , 350., 350.);
    
    
  	for(float i = 0. ; i < SAMPLE_NUM ; i++){
          vec2 coordOffset = rand2n(gl_FragCoord.xy, i);
          vec3 ray = calcRay(eye, target, up, fov,
                             u_resolution.x, u_resolution.y,
                             gl_FragCoord.xy + coordOffset);
          
          sum += calcColor(eye, ray);
	}
	vec3 col = (sum/SAMPLE_NUM);

	fragColor = vec4(gammaCorrect(col), 1.);
}
