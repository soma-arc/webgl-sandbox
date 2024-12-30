import * as GLUtils from './glUtils.js';
import RENDER_VERTEX from './shaders/render.vert?raw';
import RENDER_FRAGMENT from './shaders/render.frag?raw';

export default class Renderer {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {number} width
     * @param {number} height
     */
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.ctx = GLUtils.GetWebGL2Context(this.canvas);
        this.gl = GLUtils.GetWebGL2Context(canvas);
        this.textures = GLUtils.CreateRGBAFloatTexture(this.gl, width, height);

        this.vertexBuffer = GLUtils.CreateSquareVbo(this.gl);

        this.renderCanvasProgram = this.gl.createProgram();
        GLUtils.AttachShader(
            this.gl,
            RENDER_VERTEX,
            this.renderCanvasProgram,
            this.gl.VERTEX_SHADER,
        );
        GLUtils.AttachShader(
            this.gl,
            RENDER_FRAGMENT,
            this.renderCanvasProgram,
            this.gl.FRAGMENT_SHADER,
        );
        GLUtils.LinkProgram(this.gl, this.renderCanvasProgram);
        this.renderVAttrib = this.gl.getAttribLocation(
            this.renderCanvasProgram,
            'a_vertex',
        );
        this.texturesFrameBuffer = this.gl.createFramebuffer();
    }
}
