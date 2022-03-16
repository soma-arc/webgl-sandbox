import { GetWebGL2Context, CreateSquareVbo, AttachShader,
         LinkProgram, CreateRGBATextures, CreateStaticVbo } from './glUtils.js';
import Point3 from './geometry/point3.js';
import Vec3 from './geometry/vector3.js';
import Transform from './geometry/transform.js';
import Canvas from './canvas.js';
import Shader from './shader.js';

const RENDER_FRAG = require('./shaders/render.frag');
const RENDER_VERT = require('./shaders/render.vert');

const DEPTH_FRAG = require('./shaders/depth.frag');
const DEPTH_VERT = require('./shaders/depth.vert');

export default class Canvas3D extends Canvas {
    constructor(canvasId) {
        super(canvasId);
        this.quadVAO = -1;
        this.quadVBO = -1;
        this.cubeVAO = -1;
        this.cubeVBO = -1;
        this.planeVAO = -1;
        this.planeVBO = -1;

        this.lightPos = new Point3(-2.0, 4.0, -1.0);
        this.cameraPos = new Point3(10, 10, 0);
        this.cameraTarget = new Point3(0, 0, 0);
    }

    init() {
        this.canvas = document.getElementById(this.canvasId);
        this.canvasRatio = this.canvas.width / this.canvas.height / 2;
        this.gl = GetWebGL2Context(this.canvas);
        const gl = this.gl;
        gl.enable(gl.DEPTH_TEST);
        this.renderShader = new Shader(gl, RENDER_VERT, RENDER_FRAG);
        this.depthShader = new Shader(gl, DEPTH_VERT, DEPTH_FRAG);

        const depthMapFBO = gl.createFramebuffer();
        const depthMap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depthMap);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT,
                      this.canvas.width, this.canvas.height,
                      0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindFramebuffer(gl.FRAMEBUFFER, depthMapFBO);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                                gl.TEXTURE_2D, depthMap, 0);
        gl.drawBuffers([gl.NONE]);
        gl.readBuffer(gl.NONE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    render() {
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.renderShader.use();

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const projection = Transform.perspective(60, 0.1, 1000);
        const view = Transform.lookAt(this.cameraPos, this.cameraTarget,
                                      new Vec3(0, 1, 0));
        this.renderShader.uniformMatrix4fv('projection', projection.m.elem);
        this.renderShader.uniformMatrix4fv('view', view.m.elem);
        this.renderShader.uniform3f('lightPos', this.lightPos.x, this.lightPos.y, this.lightPos.z);
        this.renderShader.uniform3f('viewPos', this.cameraPos.x, this.cameraPos.y, this.cameraPos.z);
        this.renderScene(this.gl);
        
    }

    renderScene(gl) {
        // floor
        let model = Transform.IDENTITY;
        this.renderShader.uniformMatrix4fv('model', model.m.elem);
        this.renderPlane(gl);

        //cubes
        model = Transform.IDENTITY;
        model = model.mult(Transform.translate(0.0, 1.5, 0.0));
        model = model.mult(Transform.scale(0.5, 0.5, 0.5));
        this.renderShader.uniformMatrix4fv('model', model.m.elem);
        this.renderCube(gl);
        
        model = Transform.IDENTITY;
        model = model.mult(Transform.translate(2.0, 0.0, 1.0));
        model = model.mult(Transform.scale(0.5, 0.5, 0.5));
        this.renderShader.uniformMatrix4fv('model', model.m.elem);
        this.renderCube(gl);

        model = Transform.IDENTITY;
        model = model.mult(Transform.translate(-1.0, 0.0, 2.0));
        model = model.mult(Transform.rotate(60.0, new Vec3(1.0, 0.0, 1.0).normalize()));
        model = model.mult(Transform.scale(0.25, 0.25, 0.25));
        this.renderShader.uniformMatrix4fv('model', model.m.elem);
        this.renderCube(gl);
    }

    renderCube(gl) {
        // initialize (if necessary)
        if (this.cubeVAO == -1)
        {
            const vertices = [
                // back ace
                    -1.0, -1.0, -1.0,  0.0,  0.0, -1.0, 0.0, 0.0, // bottom-left
                1.0,  1.0, -1.0,  0.0,  0.0, -1.0, 1.0, 1.0, // top-right
                1.0, -1.0, -1.0,  0.0,  0.0, -1.0, 1.0, 0.0, // bottom-right         
                1.0,  1.0, -1.0,  0.0,  0.0, -1.0, 1.0, 1.0, // top-right
                -1.0, -1.0, -1.0,  0.0,  0.0, -1.0, 0.0, 0.0, // bottom-left
                -1.0,  1.0, -1.0,  0.0,  0.0, -1.0, 0.0, 1.0, // top-left
                // ront ace
                -1.0, -1.0,  1.0,  0.0,  0.0,  1.0, 0.0, 0.0, // bottom-left
                1.0, -1.0,  1.0,  0.0,  0.0,  1.0, 1.0, 0.0, // bottom-right
                1.0,  1.0,  1.0,  0.0,  0.0,  1.0, 1.0, 1.0, // top-right
                1.0,  1.0,  1.0,  0.0,  0.0,  1.0, 1.0, 1.0, // top-right
                -1.0,  1.0,  1.0,  0.0,  0.0,  1.0, 0.0, 1.0, // top-left
                -1.0, -1.0,  1.0,  0.0,  0.0,  1.0, 0.0, 0.0, // bottom-left
                // left ace
                -1.0,  1.0,  1.0, -1.0,  0.0,  0.0, 1.0, 0.0, // top-right
                -1.0,  1.0, -1.0, -1.0,  0.0,  0.0, 1.0, 1.0, // top-left
                -1.0, -1.0, -1.0, -1.0,  0.0,  0.0, 0.0, 1.0, // bottom-left
                -1.0, -1.0, -1.0, -1.0,  0.0,  0.0, 0.0, 1.0, // bottom-left
                -1.0, -1.0,  1.0, -1.0,  0.0,  0.0, 0.0, 0.0, // bottom-right
                -1.0,  1.0,  1.0, -1.0,  0.0,  0.0, 1.0, 0.0, // top-right
                // right ace
                1.0,  1.0,  1.0,  1.0,  0.0,  0.0, 1.0, 0.0, // top-left
                1.0, -1.0, -1.0,  1.0,  0.0,  0.0, 0.0, 1.0, // bottom-right
                1.0,  1.0, -1.0,  1.0,  0.0,  0.0, 1.0, 1.0, // top-right         
                1.0, -1.0, -1.0,  1.0,  0.0,  0.0, 0.0, 1.0, // bottom-right
                1.0,  1.0,  1.0,  1.0,  0.0,  0.0, 1.0, 0.0, // top-left
                1.0, -1.0,  1.0,  1.0,  0.0,  0.0, 0.0, 0.0, // bottom-left     
                // bottom ace
                -1.0, -1.0, -1.0,  0.0, -1.0,  0.0, 0.0, 1.0, // top-right
                1.0, -1.0, -1.0,  0.0, -1.0,  0.0, 1.0, 1.0, // top-left
                1.0, -1.0,  1.0,  0.0, -1.0,  0.0, 1.0, 0.0, // bottom-left
                1.0, -1.0,  1.0,  0.0, -1.0,  0.0, 1.0, 0.0, // bottom-left
                -1.0, -1.0,  1.0,  0.0, -1.0,  0.0, 0.0, 0.0, // bottom-right
                -1.0, -1.0, -1.0,  0.0, -1.0,  0.0, 0.0, 1.0, // top-right
                // top ace
                -1.0,  1.0, -1.0,  0.0,  1.0,  0.0, 0.0, 1.0, // top-left
                1.0,  1.0 , 1.0,  0.0,  1.0,  0.0, 1.0, 0.0, // bottom-right
                1.0,  1.0, -1.0,  0.0,  1.0,  0.0, 1.0, 1.0, // top-right     
                1.0,  1.0,  1.0,  0.0,  1.0,  0.0, 1.0, 0.0, // bottom-right
                -1.0,  1.0, -1.0,  0.0,  1.0,  0.0, 0.0, 1.0, // top-left
                -1.0,  1.0,  1.0,  0.0,  1.0,  0.0, 0.0, 0.0  // bottom-left        
            ];
            this.cubeVAO = gl.createVertexArray();
            this.cubeVBO = gl.createBuffer();
            // fill buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeVBO);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            // link vertex attributes
            gl.bindVertexArray(this.cubeVAO);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3,gl.FLOAT, gl.FALSE, 8 * 4, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, gl.FALSE, 8 * 4, 3 * 4);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindVertexArray(null);
        }
        // render Cube
        gl.bindVertexArray(this.cubeVAO);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        gl.bindVertexArray(null);
    }

    renderQuad(gl) {
        if (this.quadVAO === -1) {
            const quadVertices = [
                // positions        // texture Coords
                -1.0,  1.0, 0.0, 0.0, 1.0,
                -1.0, -1.0, 0.0, 0.0, 0.0,
                1.0,  1.0, 0.0, 1.0, 1.0,
                1.0, -1.0, 0.0, 1.0, 0.0,
            ];
            // setup plane VAO
            this.quadVAO = gl.createVertexArray();
            this.quadVBO = gl.createBuffer();
            gl.bindVertexArray(this.quadVAO);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVertices), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 5 * 4, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 2, gl.FLOAT, gl.FALSE, 5 * 4, 3 * 4);
            gl.bindVertexArray(null);
        }
        gl.bindVertexArray(this.quadVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);
    }

    renderPlane(gl) {
        if (this.planeVAO === -1) {
            const planeVertices = [
                // positions            // normals         // texcoords
                25.0, -0.5,  25.0,  0.0, 1.0, 0.0,  25.0,  0.0,
                -25.0, -0.5,  25.0,  0.0, 1.0, 0.0,   0.0,  0.0,
                -25.0, -0.5, -25.0,  0.0, 1.0, 0.0,   0.0, 25.0,

                25.0, -0.5,  25.0,  0.0, 1.0, 0.0,  25.0,  0.0,
                -25.0, -0.5, -25.0,  0.0, 1.0, 0.0,   0.0, 25.0,
                25.0, -0.5, -25.0,  0.0, 1.0, 0.0,  25.0, 25.0
            ];
            // plane VAO
            this.planeVAO = gl.createVertexArray();
            this.planeVBO = gl.createBuffer();
            gl.bindVertexArray(this.planeVAO);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.planeVBO);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planeVertices), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 8 * 4, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, gl.FALSE, 8 * 4, 3 * 4);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, gl.FALSE, 8 * 4, 6 * 4);
            gl.bindVertexArray(null);
        }
        gl.bindVertexArray(this.planeVAO);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);
    }
}
