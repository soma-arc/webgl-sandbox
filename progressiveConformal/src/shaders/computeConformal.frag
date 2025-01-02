#version 300 es
precision mediump float;

uniform sampler2D u_prevTexture;
uniform vec2 u_resolution;
uniform vec2 u_triABC[3];
uniform vec2 u_triPQR[3];

vec2 refl(vec2 x, vec2 a, vec2 b) {
    // outside
    vec2 n = vec2(a.y - b.y, b.x - a.x);
    float d = dot(x - a, n) / dot(n, n);
    return x - 2.0 * d * n;
}

bool isOutside(vec2 x, vec2 a, vec2 b) {
    vec2 n = vec2(a.y - b.y, b.x - a.x);
    return dot(x - a, n) > 0.;
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



// vec2 triRefl(vec2 x, vec2 a, vec2 b, vec2 c) {
//     if(isOutside(x, a, b)) {
//         x = refl(x, a, b);
//     }
//     if(isOutside(x, b, c)) {
//         x = refl(x, b, c);
//     }
//     if(isOutside(x, c, a)) {
//         x = refl(x, c, a);
//     }
// }

mat3 computeProjection(vec2 A, vec2 B, vec2 C, vec2 P, vec2 Q, vec2 R) {
    mat3 src = mat3(vec3(A, 1), vec3(B, 1), vec3(C, 1));
    mat3 dst = mat3(vec3(P, 1), vec3(Q, 1), vec3(R, 1));
    return dst * inverse(src);
}

vec2 applyProjection(mat3 transform, vec2 point) {
    vec3 projected = transform * vec3(point, 1);
    return vec2((projected / projected.z).xy);
}

vec3 pattern(vec2 x) {
    return vec3(max(max(.2, sin(x.x * 2. * 3.14 * 10.)),
                    max(.2, sin(x.y * 2. * 3.14 * 10.))));
}

vec2 readc(vec2 p) {
    vec2 A = u_triABC[0];
    vec2 B = u_triABC[1];
    vec2 C = u_triABC[2];
    vec2 P = u_triPQR[0];
    vec2 Q = u_triPQR[1];
    vec2 R = u_triPQR[2];
            
    vec2 q = p;
    if(!ccw(p, A, B)) q = refl(p, A, B); //outside side AB
    if(!ccw(p, B, C)) q = refl(p, B, C); //outside side BC
    if(!ccw(p, C, A)) q = refl(p, C, A); //outside side CA
    vec2 quv = q / 5.;
    if(u_resolution.x > u_resolution.y) {
        quv = quv / vec2(1., u_resolution.y / u_resolution.x);
    } else {
        quv = quv / vec2(u_resolution.x / u_resolution.y, 1.);
    }
    quv += vec2(0.5);
    vec2 t = texture(u_prevTexture, quv).xy;
    if(!ccw(p, A, B)) t = refl(t, P, Q); //outside side AB
    if(!ccw(p, B, C)) t = refl(t, Q, R); //outside side BC
    if(!ccw(p, C, A)) t = refl(t, R, P); //outside side CA
    return t;
}

out vec4 outColor;
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    mat3 proj = computeProjection(u_triABC[0], u_triABC[1], u_triABC[2],
                                  u_triPQR[0], u_triPQR[1], u_triPQR[2]);
    vec2 ratio;
    if(u_resolution.x > u_resolution.y) {
        ratio =  vec2(1., u_resolution.y / u_resolution.x);
    } else {
        ratio = vec2(u_resolution.x / u_resolution.y, 1.);
    }
    vec2 coord = uv - vec2(0.5);
    coord *= ratio;
    coord *= 5.;
    const float pi = 3.141;
    vec4 t = texture(u_prevTexture, uv);
    if(t.r == 0. && t.g == 0.) {
        // outColor = vec4(vec3(max(max(.2,sin(gl_FragCoord.x)),
        //                          max(.2,sin(gl_FragCoord.y)))), 1);
        outColor = vec4(applyProjection(proj, coord), 0, 1);
    } else {
        vec2 pw = 20. * ratio / u_resolution;
        //coord = texture(u_prevTexture, uv).xy;
        vec2 quv = coord * 0.1;
        if(u_resolution.x > u_resolution.y) {
            quv = quv / vec2(1., u_resolution.y / u_resolution.x);
        } else {
            quv = quv / vec2(u_resolution.x / u_resolution.y, 1.);
        }
        quv += vec2(0.5);
        // coord = quv - vec2(0.5);
        // if(u_resolution.x > u_resolution.y) {
        //     coord = coord * vec2(1., u_resolution.y / u_resolution.x);
        // } else {
        //     coord = coord * vec2(u_resolution.x / u_resolution.y, 1.);
        // }
        // coord *= 10.;
        //outColor = texture(u_prevTexture, quv);

        // outColor = vec4((1./4.) *
        //                 (readc(coord + pw * vec2(1, 0))+
        //                  readc(coord + pw * vec2(0, 1)) +
        //                  readc(coord + pw * vec2(-1, 0)) +
        //                  readc(coord + pw * vec2(0, -1))), 0, 1);

                outColor = vec4((1./8.) *
                        (readc(coord + pw * vec2(1, 0))+
                         readc(coord + pw * vec2(0, 1)) +
                         readc(coord + pw * vec2(-1, 0)) +
                         readc(coord + pw * vec2(0, -1)) +

                         readc(coord + 2. * pw * vec2(1, 0))+
                         readc(coord + 2. * pw * vec2(0, 1)) +
                         readc(coord + 2. * pw * vec2(-1, 0)) +
                         readc(coord + 2. * pw * vec2(0, -1))), 0, 1);
    }
    

    // if(isInsideTri(coord, a, b, c)) {
    //     outColor = vec4(1, 0, 0, 1);
    // } else if(isInsideTri(coord, p, q, r)) {
    //     outColor = vec4(0, 1, 0, 1);
    // } else {
    //     outColor = vec4(coord, 0, 1);
    // }
    //vec4 t = texture(u_checkerTexture, v_texCoord);

}
