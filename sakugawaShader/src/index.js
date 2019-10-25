import { GetWebGL2Context, CreateSquareVbo, CreateRGBATextures, CreateRGBTextures,
         AttachShader, LinkProgram } from './glUtils.js';

const RENDER_FRAGMENT = require('./shaders/render.frag');
const RENDER_VERTEX = require('./shaders/render.vert');

window.addEventListener('load', () => {
    new Canvas();
});


class Canvas {
    constructor() {
        this.canvasId = 'canvas';
        this.canvas = document.getElementById(this.canvasId);
        this.gl = GetWebGL2Context(this.canvas);

        this.vertexBuffer = CreateSquareVbo(this.gl);

        this.renderCanvasProgram = this.gl.createProgram();
        AttachShader(this.gl, RENDER_VERTEX,
                     this.renderCanvasProgram, this.gl.VERTEX_SHADER);
        AttachShader(this.gl, RENDER_FRAGMENT,
                     this.renderCanvasProgram, this.gl.FRAGMENT_SHADER);
        LinkProgram(this.gl, this.renderCanvasProgram);
        this.renderCanvasVAttrib = this.gl.getAttribLocation(this.renderCanvasProgram,
                                                             'a_vertex');
        this.gl.enableVertexAttribArray(this.renderCanvasVAttrib);

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.useProgram(this.renderCanvasProgram);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(this.renderCanvasVAttrib, 2,
                                    this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.flush();
    }
}
