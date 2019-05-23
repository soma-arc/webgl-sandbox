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
    bool selected;
};

struct HalfPlane {
    vec2 p;
    vec4 normal; //[x, y, normal ring radius, point radius]
    bool selected;
};

// from Syntopia http://blog.hvidtfeldts.net/index.php/2015/01/path-tracing-3d-fractals/
vec2 rand2n(const vec2 co, const float sampleIndex) {
    vec2 seed = co * (sampleIndex + 1.0);
    seed+=vec2(-1,1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
                fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}

const float MAX_SAMPLES = 20.;
void main() {
    vec3 sum = vec3(0, 1, 0);
    float ratio = u_resolution.x / u_resolution.y / 2.0;
    for(float i = 0.; i < MAX_SAMPLES; i++){
        vec2 position = ((gl_FragCoord.xy + rand2n(gl_FragCoord.xy, i)) / u_resolution.yy ) - vec2(ratio, 0.5);
        position = position * u_geometry.z;
        position += u_geometry.xy;

    }
    vec3 texCol = textureLod(u_accTexture, gl_FragCoord.xy / u_resolution, 0.0).rgb;
    outColor = vec4(sum / MAX_SAMPLES, 1);
}
