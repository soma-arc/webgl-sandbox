#version 300 es
precision mediump float;

in vec2 v_texCoord;
uniform sampler2D u_prevTexture;
uniform sampler2D u_checkerTexture;
uniform sampler2D u_conformalTexture;
uniform vec2 u_resolution;
uniform vec2 u_triABC[3];
uniform vec2 u_triPQR[3];

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

vec3 pattern(vec2 x) {
    return vec3(max(max(.2,sin(x.x * 50.)),
                    max(.2,sin(x.y * 50.))));
}

out vec4 outColor;
void main() {
    vec2 coord;
    vec2 norm = gl_FragCoord.xy / u_resolution - vec2(0.5);
    if(u_resolution.x > u_resolution.y) {
        coord = norm * vec2(1., u_resolution.y / u_resolution.x);
    } else {
        coord = norm * vec2(u_resolution.x / u_resolution.y, 1.);
    }
    coord *= 5.;

    if(isInsideTri(coord, u_triABC[0], u_triABC[1], u_triABC[2])) {

        vec2 tex = texture(u_conformalTexture, gl_FragCoord.xy/u_resolution).xy;
        
        outColor = vec4(pattern(tex), 1);
    } else if(isInsideTri(coord, u_triPQR[0], u_triPQR[1], u_triPQR[2])) {
        outColor = vec4(pattern(coord), 1); //vec4(0, 1, 0, 1);
    } else {
        outColor = vec4(0, 0, 0, 1);
    }
    //outColor = vec4(pattern(coord), 1);
    //vec4 t = texture(u_checkerTexture, v_texCoord);

}
