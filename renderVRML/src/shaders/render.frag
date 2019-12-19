#version 300 es
precision mediump float;

in vec4 oColor;
in vec3 oNormal;
out vec4 outColor;
void main() {
    outColor = vec4(oNormal, 1.0);
    //outColor = vec4(1.0);
}
