#version 300 es
precision mediump float;

in vec2 v_texCoord;
uniform sampler2D u_prevTexture;
uniform sampler2D u_checkerTexture;
uniform sampler2D u_conformalTexture;
uniform vec2 u_resolution;
uniform vec2 u_triABC[3];
uniform vec2 u_triPQR[3];

const float DISPLAY_GAMMA_COEFF = 2.2;
vec4 degamma(vec4 rgba) {
    return vec4((min(pow(rgba.r, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgba.g, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgba.b, DISPLAY_GAMMA_COEFF), 1.)),
                rgba.a);
}

vec2 refl(vec2 x, vec2 a, vec2 b) {
    // outside
    vec2 n = vec2(a.y - b.y, b.x - a.x);
    float d = dot(x - a, n) / dot(n, n);
    return x - 2.0 * d * n;
}

// counterclockwise
bool ccw(vec2 a, vec2 b, vec2 c) {
    float det = a.x * (b.y - c.y) +
        b.x * (c.y - a.y) +
        c.x * (a.y - b.y);
    return det > 0.0;
}

bool isInsideTri(vec2 x, vec2 a, vec2 b, vec2 c) {
    return ccw(x, a, b) && ccw(b, c, x) && ccw(c, a, x);
}

bool insideRect(vec2 p) {
    return (-1. < p.x && p.x < 1. &&
            -1. < p.y && p.y < 1.);
}

vec2 corner = vec2(0.36602510819390255, 0.36602510819390255);

vec3 pattern(vec2 x) {
    vec3 colFactor = 0.8* vec3((x + corner) / corner.x, 0);
    const float size = 20.;
    return (0.2 + 0.3*vec3(mod(floor(size * x.x) + floor(size * x.y), 2.0))) + colFactor;
    //return vec3((x + corner) / corner.x, 0);
}

vec2 rectToUV(vec2 v) {
    vec2 uv =  (v + vec2(1)) / 2.;
    return vec2(uv.x, 1. -uv.y);
}

vec2 cp1 = vec2(1.7320516151381313, 0);
vec2 cp2 = vec2(-1.7320516151381313, 0);
vec2 cp3 = vec2(0, 1.7320516151381313);
vec2 cp4 = vec2(0, -1.7320516151381313);
float cr = 1.414214551439282;

out vec4 outColor;
void main() {
    vec2 coord;
    vec2 norm = gl_FragCoord.xy / u_resolution - vec2(0.5);
    if(u_resolution.x > u_resolution.y) {
        coord = norm * vec2(1., u_resolution.y / u_resolution.x);
    } else {
        coord = norm * vec2(u_resolution.x / u_resolution.y, 1.);
    }
    coord *= 2.;

    if(length(coord) < 1.
       // &&
       // distance(cp1, coord) > cr && distance(cp2, coord) > cr &&
       // distance(cp3, coord) > cr && distance(cp4, coord) > cr
       ){
        // vec2 uv = coord / 5. + vec2(0.5);
        float colFactor = 1.;
        if(distance(cp1, coord) > cr && distance(cp2, coord) > cr &&
           distance(cp3, coord) > cr && distance(cp4, coord) > cr){
            colFactor = 0.4;
        }
        vec2 t = texture(u_conformalTexture, rectToUV(coord/ corner) ).xy;

        // vec3 col = pattern(t.xy);
        vec3 col = degamma(texture(u_checkerTexture, rectToUV(t / corner))).xyz;
        
        // outColor = vec4(col, 1);
        outColor = vec4(col * colFactor, 1.);
    } else {
        outColor = vec4(0, 0, 0, 1);
    }
}
