#version 300 es
precision mediump float;


in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;
in vec4 FragPosLightSpace;

uniform sampler2D diffuseTexture;
uniform sampler2D shadowMap;

uniform vec3 lightPos;
uniform vec3 viewPos;

// from Syntopia http://blog.hvidtfeldts.net/index.php/2015/01/path-tracing-3d-fractals/
vec2 Rand2n(vec2 co, float sampleIndex) {
    vec2 seed = co * (sampleIndex + 1.0);
	seed+=vec2(-1,1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
                fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}

const float GAMMA = 2.2;
vec4 degamma(vec4 rgba) {
    return vec4((min(pow(rgba.r, GAMMA), 1.)),
                (min(pow(rgba.g, GAMMA), 1.)),
                (min(pow(rgba.b, GAMMA), 1.)),
                rgba.a);
}

const float DISPLAY_GAMMA_COEFF = 1. / 2.2;
vec4 gammaCorrect(vec4 rgba) {
    return vec4((min(pow(rgba.r, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgba.g, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgba.b, DISPLAY_GAMMA_COEFF), 1.)),
                rgba.a);
}

const float PI = 3.14159265;
out vec4 outColor;
void main() {
  vec3 sum = vec3(0);
  float numSamples = 10.;

  for(float i = 0.; i < numSamples; i++) {
    sum += vec3(1, 0, 0);
  }

  vec3 color = vec3(1);
  vec3 normal = normalize(Normal);
  vec3 lightColor = vec3(0.3);
  vec3 ambient = 0.3 * lightColor;
  
  outColor = gammaCorrect(vec4(sum / numSamples, 1.0));
}
