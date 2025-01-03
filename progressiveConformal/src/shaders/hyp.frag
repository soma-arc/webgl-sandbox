#version 300 es
precision mediump float;

uniform sampler2D u_prevTexture;
uniform vec2 u_resolution;
uniform vec2 u_triABC[3];
uniform vec2 u_triPQR[3];


bool insideRect(vec2 p) {
    return (-1. < p.x && p.x < 1. &&
            -1. < p.y && p.y < 1.);
}

vec2 crefl(vec2 p) {
    float normSquared = dot(p, p); // |p|^2
    return p / normSquared;       // 単位円に反射
}

vec2 srefl(vec2 p) {
    vec2 q = p;
    if (p.x > abs(p.y)) q = vec2(2.0 - p.x, p.y);   // 右側境界の反射
    if (p.x < -abs(p.y)) q = vec2(-2.0 - p.x, p.y); // 左側境界の反射
    if (p.y > abs(p.x)) q = vec2(p.x, 2.0 - p.y);   // 上側境界の反射
    if (p.y < -abs(p.x)) q = vec2(p.x, -2.0 - p.y); // 下側境界の反射
    return q;
}

vec2 circleInverse(vec2 pos, vec2 circlePos, float circleR){
    return ((pos - circlePos) * circleR * circleR)/(length(pos - circlePos) * length(pos - circlePos) ) + circlePos;
}

// circles
vec2 cp1 = vec2(1.7320516151381313, 0);
vec2 cp2 = vec2(-1.7320516151381313, 0);
vec2 cp3 = vec2(0, 1.7320516151381313);
vec2 cp4 = vec2(0, -1.7320516151381313);
vec2 corner = vec2(0.36602510819390255, 0.36602510819390255);
float cr = 1.414214551439282;

vec2 iis(vec2 p) {
    vec2 q = p;
    bool inFund = false;
    for(int i = 0; i < 100; i++) {
        inFund = true;
        if(distance(q, cp1) < cr) {
            q = circleInverse(q, cp1, cr);
            inFund = false;
        }
        if(distance(q, cp2) < cr) {
            q = circleInverse(q, cp2, cr);
            inFund = false;
        }
        if(distance(q, cp3) < cr) {
            q = circleInverse(q, cp3, cr);
            inFund = false;            
        }
        if(distance(q, cp4) < cr) {
            q = circleInverse(q, cp4, cr);
            inFund = false;
        }
        if(inFund) {
            break;
        }
    }
    return q;
}

vec2 readc(vec2 p) {
    vec2 q = p;

        // 単位円の外にある場合、円に反射
    // if (length(p) > 1.) {
    //     q = crefl(q);
    // }
    // q = iis(q);

    if(length(p) > 1.) {
        q = crefl(q);
    }
    if(distance(q, cp1) < cr) {
        q = circleInverse(q, cp1, cr);
    }
    if(distance(q, cp2) < cr) {
        q = circleInverse(q, cp2, cr);
    }
    if(distance(q, cp3) < cr) {
        q = circleInverse(q, cp3, cr);
    }
    if(distance(q, cp4) < cr) {
        q = circleInverse(q, cp4, cr);
    }
    
    vec2 quv = q;
    if(u_resolution.x > u_resolution.y) {
        quv = quv / vec2(1., u_resolution.y / u_resolution.x);
    } else {
        quv = quv / vec2(u_resolution.x / u_resolution.y, 1.);
    }
    quv /= corner;
    quv /= 2.;
    quv += vec2(0.5);
    vec2 t = texture(u_prevTexture, quv).xy;
    if(length(p) > 1.) {
        t = crefl(t);
    }

    
    // if (length(t) > 1.) {
    //     t = srefl(t);
    // }
    // t = iis(t);
    
    // q = iis(q);
    // if (length(t) > 1.) {
    //     t = crefl(t);
    // }
    
    // if (length(t) > 1.0) {
    //     t = crefl(t);
    // }
    // t = iis(t);

    // if(!insideRect(p)) {
    //     t = srefl(t);
    // }
    
    
    // // 正方形の外にある場合、正方形に反射
    // if (length(t) > 1.) {
    //     t = crefl(t);
    // }
    // if(distance(t, cp1) < cr) {
    //     t = circleInverse(t, cp1, cr);
    // }
    // if(distance(t, cp2) < cr) {
    //     t = circleInverse(t, cp2, cr);
    // }
    // if(distance(t, cp3) < cr) {
    //     t = circleInverse(t, cp3, cr);
    // }
    // if(distance(t, cp4) < cr) {
    //     t = circleInverse(t, cp4, cr);
    // }
    
    return t;
}

out vec4 outColor;
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    vec2 ratio;
    if(u_resolution.x > u_resolution.y) {
        ratio =  vec2(1., u_resolution.y / u_resolution.x);
    } else {
        ratio = vec2(u_resolution.x / u_resolution.y, 1.);
    }
    vec2 coord = (uv - vec2(0.5)) * 2. * corner;
    coord *= ratio;

    vec4 t = texture(u_prevTexture, uv);
    if(t.r == 0. && t.g == 0.) {
        outColor = vec4(coord, 0, 1);
    } else {
        vec2 pw = 2. * corner / u_resolution;
        float fact = 10.;
        
        outColor = vec4((1./8.) *
                        (
                         readc(coord + pw * vec2(1, 0))+
                         readc(coord + pw * vec2(0, 1)) +
                         readc(coord + pw * vec2(-1, 0)) +
                         readc(coord + pw * vec2(0, -1))
                         +
                         readc(coord + fact * pw * vec2(1, 0))+
                         readc(coord + fact * pw * vec2(0, 1)) +
                         readc(coord + fact * pw * vec2(-1, 0)) +
                         readc(coord + fact * pw * vec2(0, -1))
                         ), 0, 1);
    }

}
