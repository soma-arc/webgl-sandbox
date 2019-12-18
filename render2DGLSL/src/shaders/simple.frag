#version 300 es

precision mediump float;

uniform sampler2D u_accTexture;
uniform float u_textureWeight;
uniform float u_numSamples;
uniform vec2 u_resolution;
uniform int u_maxIterations;

out vec4 outColor;

vec4 computeColor() {
    return vec4(1, 0, 0, 1);
}

void main() {
    vec4 texCol = texture(u_accTexture, gl_FragCoord.xy / u_resolution);
    
	outColor = vec4(mix(computeColor(), texCol, u_textureWeight));
}
