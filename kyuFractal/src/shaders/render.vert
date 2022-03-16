#version 300 es

out vec2 v_texCoord;
in vec2 a_vertex;

void main() {
  v_texCoord = a_vertex.xy * 0.5 + 0.5;
  v_texCoord.y = 1. - v_texCoord.y;
  gl_Position = vec4(a_vertex, 0., 1.0);
}
