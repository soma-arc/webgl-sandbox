#version 300 es

precision mediump float;

uniform sampler2D u_accTexture;
uniform float u_textureWeight;
uniform float u_numSamples;
uniform vec2 u_resolution;
uniform int u_maxIterations;

out vec4 outColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    outColor = vec4(1, 0, 0, 0);
}
