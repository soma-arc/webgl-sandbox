import { AttachShader,
         LinkProgram, } from './glUtils.js';

export default class Shader {
    constructor(gl, vert, frag) {
        this.gl = gl;
        this.vert = vert;
        this.frag = frag;

        this.program = gl.createProgram();
        AttachShader(this.gl, vert,
                     this.program, this.gl.VERTEX_SHADER);
        AttachShader(this.gl, frag,
                     this.program, this.gl.FRAGMENT_SHADER);
        LinkProgram(this.gl, this.program);

        this.uniLocations = {};
    }

    use() {
        this.gl.useProgram(this.program);
    }

    uniform1f(name, x) {
        this.gl.uniform3f(this.gl.getUniformLocation(this.program, name),
                          false, x);
    }
    
    uniform2f(name, x, y) {
        this.gl.uniform3f(this.gl.getUniformLocation(this.program, name),
                          false, x, y);
    }
    
    uniform3f(name, x, y, z) {
        this.gl.uniform3f(this.gl.getUniformLocation(this.program, name),
                          false, x, y, z);
    }

    uniform4f(name, x, y, z, w) {
        this.gl.uniform3f(this.gl.getUniformLocation(this.program, name),
                          false, x, y, z, w);
    }

    uniformMatrix4fv(name, elem) {
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, name),
                                 false, elem);
    }
}
