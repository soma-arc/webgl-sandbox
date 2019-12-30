#version 300 es

precision mediump float;

uniform sampler2D u_accTexture;
uniform float u_textureWeight;
uniform float u_numSamples;
uniform vec2 u_resolution;
uniform int u_maxIterations;
out vec4 outColor;

// from Syntopia http://blog.hvidtfeldts.net/index.php/2015/01/path-tracing-3d-fractals/
vec2 Rand2n(vec2 co, float sampleIndex) {
    vec2 seed = co * (sampleIndex + 1.0);
	seed+=vec2(-1,1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
                fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}


vec3 hsv(float h, float s, float v){
    vec4 t = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(vec3(h) + t.xyz) * 6.0 - vec3(t.w));
    return v * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0, 1.0), s);
}


vec4 computeColor(vec2 p) {
    p *= 3.2;
    p.y += -.18;
    p.x += -0.;
    float m2 = 0.0;
    vec2 dz = vec2(0.0);

    int j = 0;
    vec2 c = vec2(0.2316, 0.5313);
    //vec2 c = vec2(-0.2008, 0.672);

    vec2 z = p;
    float smoothColor = exp(-length(z));
    int maxIter = 660;
    for(int i = 0; i < maxIter; i++){
        j++;
        if(length(z) > 2.0){
            break;
            return vec4(1, 1, 1, 0);
        }
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        smoothColor += exp(-length(z));
    }
    smoothColor = smoothColor / float(maxIter);
    // float h = abs(mod(float(j), 360.0) / 360.0);;
    // vec3 rgb = hsv(h, 1.0, h);
    // return vec4(rgb, 1.0);
    float l = log(length(z))/(pow(2., float(j)));
    float h = abs(mod(float(j), 360.0) / 360.0);
    vec3 rgb = hsv(0., h, h);
    float alpha = 1.0;
    float w = (20./float(j));
    if (w > .5) alpha = 0.0;
    return vec4(vec3(smoothColor),1.- w);
    float d = 0.;
    return vec4( d, d, d, 1.0 );
}

void main() {
    float ratio = u_resolution.x / u_resolution.y / 2.0;
    vec3 col;
    
    vec2 position = ( (gl_FragCoord.xy + Rand2n(gl_FragCoord.xy, u_numSamples)) / u_resolution.yy ) - vec2(ratio, 0.5);

    vec4 texCol = texture(u_accTexture, gl_FragCoord.xy / u_resolution);
	outColor = vec4(mix(computeColor(position), texCol, u_textureWeight));

}
