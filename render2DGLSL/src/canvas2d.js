import Canvas from './canvas.js';
import { GetWebGL2Context, CreateSquareVbo, AttachShader,
         LinkProgram, CreateRGBATextures, CreateRGBAImageTexture2D,
         CreateFloatTextures } from './glUtils';
import TextureHandler from './textureHandler.js';

const RENDER_VERTEX = require('./shaders/render.vert');
const RENDER_FRAGMENT = require('./shaders/render.frag');
const RENDER_FLIPPED_VERTEX = require('./shaders/renderFlipped.vert');

const SIMPLE_FRAG = require('./shaders/simple.frag');
const HYPERBOLIC_FRAG = require('./shaders/hyperbolicTessellation.frag');
const KLEIN_FRAG = require('./shaders/kleinTessellation.frag');
const MANDEL_FRAG = require('./shaders/mandelbrot.frag');
const MANDEL_ZOOM_FRAG = require('./shaders/mandelbrotZoom.frag');
const JULIA1_FRAG = require('./shaders/juliaBlue.frag');
const AHARA_ARAKI_FRAG = require('./shaders/aharaAraki.frag');
const APOLLONIUS_FRAG = require('./shaders/apollonius.frag');
const CIRCLE_FRAG = require('./shaders/circle.frag')
const TRANSPARENT_FRAG = require('./shaders/transparent.frag');
const APOLLONIAN_DEFORMATION_FRAG = require('./shaders/apollonianDeformation.frag');
const CIRCLE_TILES_FRAG = require('./shaders/circleTiles.frag');
const TANGENT_CIRCLES_FRAG = require('./shaders/tangentCircles.frag');
const ROSARY_FRAG = require('./shaders/rosary.frag');
const INV_MASKIT_FRAG = require('./shaders/invMaskit.frag');

export default class Canvas2D extends Canvas {
    constructor(canvasId) {
        super(canvasId);
        this.pixelRatio = 1;

        this.numSamples = 0;

        this.isProductRendering = false;

        this.productRenderMaxSamples = 1;
    }

    init() {
        this.canvas = document.getElementById(this.canvasId);
        //this.resizeCanvas();

        //        this.spheirahedra.addUpdateListener(this.render.bind(this));
        //        this.pixelRatio = 1.0; //window.devicePixelRatio;
        this.addEventListeners();

        this.gl = GetWebGL2Context(this.canvas);
        this.vertexBuffer = CreateSquareVbo(this.gl);

        this.renderCanvasProgram = this.gl.createProgram();
        AttachShader(this.gl, RENDER_VERTEX,
                     this.renderCanvasProgram, this.gl.VERTEX_SHADER);
        AttachShader(this.gl, RENDER_FRAGMENT,
                     this.renderCanvasProgram, this.gl.FRAGMENT_SHADER);
        LinkProgram(this.gl, this.renderCanvasProgram);
        this.renderVAttrib = this.gl.getAttribLocation(this.renderCanvasProgram,
                                                       'a_vertex');
        this.texturesFrameBuffer = this.gl.createFramebuffer();
        this.initRenderTextures();

        this.productRenderProgram = this.gl.createProgram();
        AttachShader(this.gl, RENDER_FLIPPED_VERTEX,
                     this.productRenderProgram, this.gl.VERTEX_SHADER);
        AttachShader(this.gl, RENDER_FRAGMENT,
                     this.productRenderProgram, this.gl.FRAGMENT_SHADER);
        LinkProgram(this.gl, this.productRenderProgram);
        this.productRenderVAttrib = this.gl.getAttribLocation(this.productRenderProgram,
                                                              'a_vertex');
        this.productRenderTextures = [];
        this.isProductRendering = false;
        this.productRenderResolution = [0, 0];
        this.productRenderFramebuffer = this.gl.createFramebuffer();

        // const img = new Image();
        // img.src = BRDF_LUT;
        // img.addEventListener('load', () => {
        //     this.brdfLUT = CreateRGBAImageTexture2D(this.gl, 256, 256, img);
        // });
        this.compileRenderProgram();
    }

    compileRenderProgram() {
        this.renderProgram = this.gl.createProgram();
        AttachShader(this.gl, RENDER_FLIPPED_VERTEX,
                     this.renderProgram, this.gl.VERTEX_SHADER);
        //AttachShader(this.gl, HYPERBOLIC_FRAG,
        //             this.renderProgram, this.gl.FRAGMENT_SHADER);
        //AttachShader(this.gl, MANDEL_FRAG,
        //              this.renderProgram, this.gl.FRAGMENT_SHADER);
        //AttachShader(this.gl, KLEIN_FRAG,
          //           this.renderProgram, this.gl.FRAGMENT_SHADER);
        //AttachShader(this.gl, MANDEL_ZOOM_FRAG,
         //           this.renderProgram, this.gl.FRAGMENT_SHADER);
        //AttachShader(this.gl, JULIA1_FRAG,
        //this.renderProgram, this.gl.FRAGMENT_SHADER);
        // AttachShader(this.gl, AHARA_ARAKI_FRAG,
        //              this.renderProgram, this.gl.FRAGMENT_SHADER);
        //AttachShader(this.gl, APOLLONIUS_FRAG,
        //             this.renderProgram, this.gl.FRAGMENT_SHADER);
        //AttachShader(this.gl, CIRCLE_FRAG,
        //             this.renderProgram, this.gl.FRAGMENT_SHADER);
        //AttachShader(this.gl, TRANSPARENT_FRAG,
        //             this.renderProgram, this.gl.FRAGMENT_SHADER);
        // AttachShader(this.gl, APOLLONIAN_DEFORMATION_FRAG,
        //              this.renderProgram, this.gl.FRAGMENT_SHADER);
        //AttachShader(this.gl, CIRCLE_TILES_FRAG,
        //this.renderProgram, this.gl.FRAGMENT_SHADER);
        //AttachShader(this.gl, TANGENT_CIRCLES_FRAG,
        //             this.renderProgram, this.gl.FRAGMENT_SHADER);
        //AttachShader(this.gl, ROSARY_FRAG,
        //this.renderProgram, this.gl.FRAGMENT_SHADER);
        AttachShader(this.gl, INV_MASKIT_FRAG,
                     this.renderProgram, this.gl.FRAGMENT_SHADER);
        LinkProgram(this.gl, this.renderProgram);
        this.renderVAttrib = this.gl.getAttribLocation(this.renderProgram,
                                                       'a_vertex');
        this.getRenderUniformLocations(this.renderProgram);
    }

    initRenderTextures() {
        this.renderTextures = CreateFloatTextures(this.gl, this.canvas.width,
                                                  this.canvas.height, 2);
    }

    initProductRenderTextures(width, height) {
        this.productRenderTextures = CreateFloatTextures(this.gl,
                                                         width, height, 2);
        this.productRenderResultTexture = CreateRGBATextures(this.gl, width, height, 1)[0];
    }

    getRenderUniformLocations(program) {
        this.uniLocations = [];
        const textureIndex = 0;
        this.imageTextures = TextureHandler.createTextures(this.gl, textureIndex);
        TextureHandler.setUniformLocation(this.gl, this.uniLocations, this.renderProgram);
        this.uniLocations.push(this.gl.getUniformLocation(program,
                                                          'u_accTexture'));
        //this.uniLocations.push(this.gl.getUniformLocation(program,
        //                                                  'u_brdfLUT'));
        this.uniLocations.push(this.gl.getUniformLocation(program,
                                                          'u_textureWeight'));
        this.uniLocations.push(this.gl.getUniformLocation(program,
                                                          'u_numSamples'));
        this.uniLocations.push(this.gl.getUniformLocation(program,
                                                          'u_resolution'));
    }

    setRenderUniformValues(width, height, texture) {
        let i = 0;
        let textureIndex = 0;
        for (const tex of this.imageTextures) {
            this.gl.activeTexture(this.gl.TEXTURE0 + textureIndex);
            this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
            this.gl.uniform1i(this.uniLocations[i++], textureIndex);
            textureIndex++;
        }
        this.gl.activeTexture(this.gl.TEXTURE0 + textureIndex);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.uniform1i(this.uniLocations[i++], textureIndex);
        // this.gl.activeTexture(this.gl.TEXTURE1);
        // this.gl.bindTexture(this.gl.TEXTURE_2D, this.brdfLUT);
        // this.gl.uniform1i(this.uniLocations[i++], 1);
        this.gl.uniform1f(this.uniLocations[i++], this.numSamples / (this.numSamples + 1));
        this.gl.uniform1f(this.uniLocations[i++], this.numSamples)
        this.gl.uniform2f(this.uniLocations[i++], width, height);
    }

    renderToTexture(textures, width, height) {
        this.gl.getExtension('EXT_color_buffer_float');
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.texturesFrameBuffer);
        this.gl.viewport(0, 0, width, height);
        this.gl.useProgram(this.renderProgram);
        this.setRenderUniformValues(width, height, textures[0]);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
                                     this.gl.TEXTURE_2D, textures[1], 0);
        this.gl.enableVertexAttribArray(this.renderCanvasVAttrib);
        this.gl.vertexAttribPointer(this.renderCanvasVAttrib, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        textures.reverse();
    }

    renderTexturesToCanvas(textures) {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.useProgram(this.renderCanvasProgram);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textures[0]);
        const tex = this.gl.getUniformLocation(this.renderCanvasProgram, 'u_texture');
        this.gl.uniform1i(tex, textures[0]);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(this.renderVAttrib, 2,
                                    this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.flush();
    }

    render() {
        this.renderToTexture(this.renderTextures,
                             this.canvas.width, this.canvas.height);
        this.renderTexturesToCanvas(this.renderTextures);
    }

    renderFlippedTex(textures, width, height) {
        console.log(width);
        this.gl.viewport(0, 0, width, height);
        this.gl.useProgram(this.productRenderProgram);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textures[0]);
        const tex = this.gl.getUniformLocation(this.productRenderProgram, 'u_texture');
        this.gl.uniform1i(tex, textures[0]);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(this.renderVAttrib, 2,
                                    this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.gl.flush();
    }

    renderProduct() {
        this.renderToTexture(this.productRenderTextures,
                             this.productRenderResolution[0],
                             this.productRenderResolution[1]);
        this.numSamples++;

        if (this.numSamples === this.productRenderMaxSamples) {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.productRenderFramebuffer);
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,
                                         this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D,
                                         this.productRenderResultTexture, 0);
            this.renderFlippedTex(this.productRenderTextures,
                                  this.productRenderResolution[0],
                                  this.productRenderResolution[1]);
            this.saveImage(this.gl,
                           this.productRenderResolution[0],
                           this.productRenderResolution[1],
                           this.productRenderFilename);
            this.isProductRendering = false;
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        }

        this.renderTexturesToCanvas(this.productRenderTextures);
    }

    startProductRendering(width, height, maxSamples, filename) {
        this.isProductRendering = true;
        this.initProductRenderTextures(width, height);
        this.numSamples = 0;
        this.productRenderMaxSamples = maxSamples;
        this.productRenderResolution = [width, height];
        this.productRenderFilename = filename;
    }

}
