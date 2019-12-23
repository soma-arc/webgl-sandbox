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

vec4 computeColor(vec2 p) {
    p *= 2.8;
    p.y += -.18;
    p.x += -0.8;
    vec2 c = p;
    float di =  1.0;
    vec2 z  = vec2(0.0);
    float m2 = 0.0;
    vec2 dz = vec2(0.0);

    vec2 pointRed = vec2(-1.25, 0);
    if(distance(p, pointRed) < 0.01) {
        return vec4(1, 0, 0, 1);
    }
    vec2 pointBlue = vec2(-0.05, 0.72);
    if(distance(p, pointBlue) < 0.01) {
        return vec4(0, 0, 1, 1);
    }
    vec2 pointGreen = vec2(0.25, -.4);
    if(distance(p, pointGreen) < 0.01) {
        return vec4(0, 1, 0, 1);
    }
    vec2 pointYellow = vec2(0.37, 0.2);
    if(distance(p, pointYellow) < 0.01) {
        return vec4(1, 1, 0, 1);
    }
    vec2 pointLightBlue = vec2(-0.5, 0.57);
    if(distance(p, pointLightBlue) < 0.01) {
        return vec4(0, 1, 1, 1);
    }
    vec2 pointPink = vec2(-1.15, .25);
    if(distance(p, pointPink) < 0.01) {
        return vec4(1, 0, 1, 1);
    }
    vec2 pointGray = vec2(-.16, -.8);
    if(distance(p, pointGray) < 0.01) {
        return vec4(0.5, 0.5, 0.5, 1);
    }
    
    for( int i=0; i<300; i++ )
    {
        if( m2>1024.0 ) { di=0.0; break; }

		// Z' -> 2·Z·Z' + 1
        dz = 2.0*vec2(z.x*dz.x-z.y*dz.y, z.x*dz.y + z.y*dz.x) + vec2(1.0,0.0);
			
        // Z -> Z² + c			
        z = vec2( z.x*z.x - z.y*z.y, 2.0*z.x*z.y ) + c;
			
        m2 = dot(z,z);
    }

    // distance	
	// d(c) = |Z|·log|Z|/|Z'|
	float d = 0.5*sqrt(dot(z,z)/dot(dz,dz))*log(dot(z,z));
    if( di>0.5 ) d=0.0;
	
    // do some soft coloring based on distance
	d = clamp( pow(4.0*d,0.04), 0.0, 1.0 );

    if(d >= 0.8) {
        return vec4( d, d, d, 0.0 );
    }
    
    return vec4( d, d, d, 1.0 );
}

void main() {
    float ratio = u_resolution.x / u_resolution.y / 2.0;
    vec3 col;
    
    vec2 position = ( (gl_FragCoord.xy + Rand2n(gl_FragCoord.xy, u_numSamples)) / u_resolution.yy ) - vec2(ratio, 0.5);

    vec4 texCol = texture(u_accTexture, gl_FragCoord.xy / u_resolution);
	outColor = vec4(mix(computeColor(position), texCol, u_textureWeight));

}
