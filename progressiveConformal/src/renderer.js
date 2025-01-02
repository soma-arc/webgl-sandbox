import * as GLUtils from './glUtils.js';
import RENDER_VERTEX from './shaders/render.vert?raw';
import RENDER_FRAGMENT from './shaders/render.frag?raw';
import RENDER_TEX from './shaders/tris.frag?raw';
import CHECKER_IMG_URL from './texture/checker.png';
import CONFORMAL_FRAG from './shaders/computeConformal.frag?raw';

export default class Renderer {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = GLUtils.GetWebGL2Context(this.canvas);
        this.gl = GLUtils.GetWebGL2Context(canvas);
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.vertexBuffer = GLUtils.CreateSquareVbo(this.gl);

        this.renderCanvasProgram = Renderer.createProgram(
            this.gl,
            RENDER_FRAGMENT,
            RENDER_VERTEX,
        );
        this.renderVAttrib = this.gl.getAttribLocation(
            this.renderCanvasProgram,
            'a_vertex',
        );
        this.gl.enableVertexAttribArray(this.renderVAttrib);

        this.renderTexProgram = Renderer.createProgram(
            this.gl,
            RENDER_TEX,
            RENDER_VERTEX,
        );

        this.texturesFrameBuffer = this.gl.createFramebuffer();
        this.conformalFrameBuffer = this.gl.createFramebuffer();

        this.renderTextures = GLUtils.CreateRGBAFloatTextures(
            this.gl,
            this.canvas.width,
            this.canvas.height,
            2,
        );

        this.gl.getExtension("EXT_color_buffer_float");
        this.gl.getExtension("OES_texture_float_linear");

        this.conformalProgram = Renderer.createProgram(
            this.gl,
            CONFORMAL_FRAG,
            RENDER_VERTEX,
        );
        this.conformalMapTextures = GLUtils.CreateRGBAFloatTextures(
            this.gl,
            this.canvas.width,
            this.canvas.height,
            2,
        );
        const initialData = new Uint8Array(this.canvas.width * this.canvas.height * 4);
        for (const t of this.conformalMapTextures) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, t);
            this.gl.texImage2D(
                this.gl.TEXTURE_2D,
                0,
                this.gl.RGBA32F,
                this.canvas.width,
                this.canvas.height,
                0,
                this.gl.RGBA,
                this.gl.FLOAT,
                initialData,
            );
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        }

        this.checkerTexture = GLUtils.CreateRGBAFloatTextures(this.gl, 1, 1, 1)[0];
        const img = new Image();
        img.src = CHECKER_IMG_URL;
        img.addEventListener('load', () => {
            console.log('laoded');
            this.checkerTexture = GLUtils.CreateRGBAUnsignedByteImageTexture(
                this.gl,
                img.width,
                img.height,
                img,
            );
        });

        this.pA = [-1, -1];
        this.pB = [2, -1];
        this.pC = [0, 1];
        this.pP = [-2, -1];
        this.pQ = [-1, 0];
        this.pR = [-2, 1];
        this.confoRepeat = 0;
    }

    /**
     * @param {WebGL2RenderingContext} gl
     * @param {string} fragment
     * @param {string} vertex
     */
    static createProgram(gl, fragment, vertex) {
        const program = gl.createProgram();
        GLUtils.AttachShader(gl, fragment, program, gl.FRAGMENT_SHADER);
        GLUtils.AttachShader(gl, vertex, program, gl.VERTEX_SHADER);
        GLUtils.LinkProgram(gl, program);
        return program;
    }


    /**
     * @param {Array<WebGLTexture>} textures
     * @param {WebGLProgram} program
     */
    setUniformValues(textures, program) {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textures[0]);
        this.gl.uniform1i(
            this.gl.getUniformLocation(program, 'u_prevTexture'),
            0,
        );

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.checkerTexture);
        this.gl.uniform1i(
            this.gl.getUniformLocation(
                program,
                'u_checkerTexture',
            ),
            1,
        );

        this.gl.uniform2f(
            this.gl.getUniformLocation(program, 'u_resolution'),
            this.canvas.width,
            this.canvas.height,
        );

        this.gl.uniform2fv(
            this.gl.getUniformLocation(program, 'u_triABC[0]'),
            this.pA,
        );
        this.gl.uniform2fv(
            this.gl.getUniformLocation(program, 'u_triABC[1]'),
            this.pB,
        );
        this.gl.uniform2fv(
            this.gl.getUniformLocation(program, 'u_triABC[2]'),
            this.pC,
        );
        this.gl.uniform2fv(
            this.gl.getUniformLocation(program, 'u_triPQR[0]'),
            this.pP,
        );
        this.gl.uniform2fv(
            this.gl.getUniformLocation(program, 'u_triPQR[1]'),
            this.pQ,
        );
        this.gl.uniform2fv(
            this.gl.getUniformLocation(program, 'u_triPQR[2]'),
            this.pR,
        );
    }

    /**
     * @param {Array<WebGLTexture>} textures
     * @param {number} width
     * @param {number} height
     */
    computeConformal(textures, width, height) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.conformalFrameBuffer);
        this.gl.viewport(0, 0, width, height);
        this.gl.useProgram(this.conformalProgram);
        this.setUniformValues(textures, this.conformalProgram);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(
            this.renderVAttrib,
            2,
            this.gl.FLOAT,
            false,
            0,
            0,
        );
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            textures[1],
            0,
        );

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        textures.reverse();
    }

    /**
     * @param {Array<WebGLTexture>} textures
     * @param {number} width
     * @param {number} height
     */
    renderToTexture(textures, width, height) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.texturesFrameBuffer);
        this.gl.viewport(0, 0, width, height);
        this.gl.useProgram(this.renderTexProgram);
        this.setUniformValues(textures, this.renderTexProgram);

        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.conformalMapTextures[0]);
        this.gl.uniform1i(
            this.gl.getUniformLocation(this.renderTexProgram, 'u_conformalTexture'),
            2,
        );

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(
            this.renderVAttrib,
            2,
            this.gl.FLOAT,
            false,
            0,
            0,
        );
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            textures[1],
            0,
        );

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        textures.reverse();
    }

    /**
     * @param {Array<WebGLTexture>} textures
     */
    renderToCanvas(textures) {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.useProgram(this.renderCanvasProgram);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textures[0]);
        const tex = this.gl.getUniformLocation(
            this.renderCanvasProgram,
            'u_texture',
        );
        this.gl.uniform1i(tex, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(
            this.renderVAttrib,
            2,
            this.gl.FLOAT,
            false,
            0,
            0,
        );
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.flush();
    }

    render() {
        if(this.confoRepeat < 100) {
            this.computeConformal(
                        this.conformalMapTextures,
                        this.canvas.width,
                        this.canvas.height,
            );
            this.confoRepeat++;
        }

        this.renderToTexture(
            this.renderTextures,
            this.canvas.width,
            this.canvas.height,
        );
        this.renderToCanvas(this.renderTextures);
    }
}
