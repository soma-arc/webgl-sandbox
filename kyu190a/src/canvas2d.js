import { GetWebGL2Context, CreateSquareVbo, AttachShader,
         LinkProgram, CreateRGBATextures, CreateStaticVbo } from './glUtils.js';
import Canvas from './canvas.js';

const RENDER_FRAG = require('./shaders/render.frag');
const RENDER_VERT = require('./shaders/render.vert');

export default class Canvas2D extends Canvas {
    constructor(canvasId) {
        super(canvasId);
    }

    init() {
        this.canvas = document.getElementById(this.canvasId);
        this.canvasRatio = this.canvas.width / this.canvas.height / 2;
        this.gl = GetWebGL2Context(this.canvas);
        this.vertexBuffer = CreateSquareVbo(this.gl);

        this.renderProgram = this.gl.createProgram();
        AttachShader(this.gl, RENDER_VERT,
                     this.renderProgram, this.gl.VERTEX_SHADER);
        AttachShader(this.gl, RENDER_FRAG,
                     this.renderProgram, this.gl.FRAGMENT_SHADER);
        LinkProgram(this.gl, this.renderProgram);
        this.renderVAttrib = this.gl.getAttribLocation(this.renderProgram,
                                                       'a_vertex');
        this.gl.enableVertexAttribArray(this.renderVAttrib);
        this.getUniformLocations();
        this.videoTexture = CreateRGBATextures(this.gl, this.canvas.width,
                                               this.canvas.height, 1)[0];
        this.videoResolution = [0, 0];
        this.startTime = new Date().getTime();
    }

    createVideoTexture(video) {
        this.videoTexture = CreateRGBATextures(this.gl,
                                               video.videoWidth,
                                               video.videoHeight, 1)[0];
        this.videoResolution = [video.videoWidth, video.videoHeight];
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA,
                           this.gl.UNSIGNED_BYTE, video);
    }

    updateVideo(video) {
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA,
                           this.gl.UNSIGNED_BYTE, video);
        this.videoResolution = [video.videoWidth, video.videoHeight];
    }

    getUniformLocations() {
        this.uniLocations = [];
        this.uniLocations.push(this.gl.getUniformLocation(this.renderProgram,
                                                          'u_texture'));
        this.uniLocations.push(this.gl.getUniformLocation(this.renderProgram,
                                                          'u_resolution'));
        this.uniLocations.push(this.gl.getUniformLocation(this.renderProgram,
                                                          'u_textureResolution'));
        this.uniLocations.push(this.gl.getUniformLocation(this.renderProgram,
                                                          'u_time'));
    }

    setUniformValues() {
        let i = 0;
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.videoTexture);
        this.gl.uniform1i(this.uniLocations[i++], 0);
        this.gl.uniform2f(this.uniLocations[i++], this.canvas.width, this.canvas.height);
        this.gl.uniform2f(this.uniLocations[i++], this.videoResolution[0], this.videoResolution[1]);
        this.gl.uniform1f(this.uniLocations[i++], (new Date().getTime() - this.startTime)/1000 );
    }

    setUniformValuesWithTime(t) {
        let i = 0;
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.videoTexture);
        this.gl.uniform1i(this.uniLocations[i++], 0);
        this.gl.uniform2f(this.uniLocations[i++], this.canvas.width, this.canvas.height);
        this.gl.uniform2f(this.uniLocations[i++], this.videoResolution[0], this.videoResolution[1]);
        this.gl.uniform1f(this.uniLocations[i++], t);
    }

    render() {
        this.setUniformValues();
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.useProgram(this.renderProgram);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(this.renderVAttrib, 2,
                                    this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.flush();
    }

    renderWithTime(t) {
        this.setUniformValuesWithTime(t);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.useProgram(this.renderProgram);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(this.renderVAttrib, 2,
                                    this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.flush();
    }
}
