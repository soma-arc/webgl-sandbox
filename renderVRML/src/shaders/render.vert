#version 300 es
precision mediump float;

uniform mat4 u_mvpMatrix;
in vec3 vPosition;
in vec3 vNormal;
//in vec4 color;
out vec4 oColor;
out vec3 oNormal;

void main() {
    oColor = vec4(1);
    oNormal = vNormal;
    gl_Position = u_mvpMatrix * vec4(vPosition, 1.0);
}
