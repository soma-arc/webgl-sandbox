#version 300 es

precision mediump float;

uniform sampler2D u_accTexture;
uniform float u_textureWeight;
uniform float u_numSamples;
uniform vec2 u_resolution;
uniform int u_maxIterations;

const float PI = 3.14159265359;

out vec4 outColor;

float atan2(in float y, in float x){
    return x == 0.0 ? sign(y)*PI/2. : atan(y, x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec4 col;
    float scale = 5.5;
    float maxiter = 256.;
    float bailout = exp(PI);
    float zx =  scale*(2.* gl_FragCoord.x / u_resolution.y-u_resolution.x/u_resolution.y);
    float zy =  scale*(2.* gl_FragCoord.y / u_resolution.y-1.);
    float uvx = 0.3;//2. * mouseX / u_esolution_y - u_resolution_x/u_resolution_y;
    float uvy = 0.4;//2. * mouseY / u_esolution_y - 1.;
    // if (mouseX==0 && mouseY==0) {
    //     uvx = 0.25f;
    //     uvy = 0f;
    // }
    bool bailed = false;
    for (float i = 0.; i<maxiter; i++) {
        float newZx = zx * zx - zy * zy + uvx;
        float newZy = 2. * zx * zy + uvy;
        zx = newZx;
        zy = newZy;
        if (sqrt(zx*zx+zy*zy)>bailout) {
            if(i >= 1.0) {
                bailed = true;
            }
            break;
        }
    }
    if (bailed==false) {
        col = vec4(0, 0, 0, 0);
    } else {
        float theta = mod((mod((atan2(zy, zx) + 2. * PI ), (2. * PI)) / 2. / PI * 360.), 360.);
        float R = mod(((0.5f*log(zx*zx+zy*zy) -  PI) / PI * 360.), 360.);
        col = vec4(hsv2rgb(vec3(theta/360., 1., 1.)), 1.);
    }
    
    vec4 texCol = texture(u_accTexture, gl_FragCoord.xy / u_resolution);
	outColor = vec4(mix(col, texCol, u_textureWeight));
}
