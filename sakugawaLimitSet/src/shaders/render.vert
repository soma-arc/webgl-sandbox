#version 300 es
precision mediump float;

uniform mat4 u_mvpMatrix;
in vec3 vPosition;
in vec3 vColor;
out vec4 outColor;

void main() {
    outColor = vec4(vColor, 1);

  gl_Position = u_mvpMatrix * vec4(vPosition, 1.0);
}
