import Canvas from './canvas.js';
import Vec2 from './geometry/vector2.js';
import Vec3 from './geometry/vector3.js';
import Point3 from './geometry/point3.js';
import Transform from './geometry/transform.js';
import { CameraOnSphere } from './camera.js';
import { GetWebGL2Context, AttachShader, LinkProgram,
         CreateStaticVbo, CreateStaticIbo } from './glUtils.js';
const RENDER_FRAG = require('./shaders/render.frag');
const RENDER_VERT = require('./shaders/render.vert');

export default class Canvas3D extends Canvas {
    constructor(canvasId) {
        super(canvasId);

        this.camera = new CameraOnSphere(new Vec3(0, 0, 0), Math.PI / 3,
                                         2, new Vec3(0, 1, 0));
        this.cameraDistScale = 1.25;

        this.mouseState = {
            isPressing: false,
            prevPosition: new Vec2(0, 0),
            button: -1
        };

        this.gl = GetWebGL2Context(this.canvas);

        this.renderProgram = this.gl.createProgram();
        AttachShader(this.gl, RENDER_VERT,
                     this.renderProgram, this.gl.VERTEX_SHADER);
        AttachShader(this.gl, RENDER_FRAG,
                     this.renderProgram, this.gl.FRAGMENT_SHADER);
        LinkProgram(this.gl, this.renderProgram);

        this.vPositionAttrib = this.gl.getAttribLocation(this.renderProgram,
                                                         'vPosition');
        this.gl.enableVertexAttribArray(this.vPositionAttrib);

        this.addEventListeners();

        this.vertexes = [];
        this.indexes = [];
    }

    /**
     * Calculate screen coordinates from mouse position
     * [0, 0]x[width, height]
     * @param {number} mx
     * @param {number} my
     * @returns {Vec2}
     */
    calcCanvasCoord(mx, my) {
        const rect = this.canvas.getBoundingClientRect();
        return new Vec2((mx - rect.left) * this.pixelRatio,
                        (my - rect.top) * this.pixelRatio);
    }

    mouseWheelListener(event) {
        event.preventDefault();
        if (event.deltaY < 0) {
            this.camera.cameraDistance /= this.cameraDistScale;
        } else {
            this.camera.cameraDistance *= this.cameraDistScale;
        }
        this.camera.update();
        this.render();
    }
    
    mouseDownListener(event) {
        event.preventDefault();
        this.canvas.focus();
        this.mouseState.isPressing = true;
        const mouse = this.calcCanvasCoord(event.clientX, event.clientY);
        this.mouseState.prevPosition = mouse;
        this.mouseState.button = event.button;
        if (event.button === Canvas.MOUSE_BUTTON_LEFT) {
            this.camera.prevThetaPhi = new Vec2(this.camera.theta, this.camera.phi);
        } else if (event.button === Canvas.MOUSE_BUTTON_RIGHT) {
            this.camera.prevTarget = this.camera.target;
        }
    }

    mouseDblClickListener(event) {
    }

    mouseUpListener(event) {
        this.mouseState.isPressing = false;
    }

    mouseMoveListener(event) {
        event.preventDefault();
        if (!this.mouseState.isPressing) return;
        const mouse = this.calcCanvasCoord(event.clientX, event.clientY);
        if (this.mouseState.button === Canvas.MOUSE_BUTTON_LEFT) {
            const prevThetaPhi = this.camera.prevThetaPhi;
            this.camera.theta = prevThetaPhi.x + (this.mouseState.prevPosition.x - mouse.x) * 0.01;
            this.camera.phi = prevThetaPhi.y - (this.mouseState.prevPosition.y - mouse.y) * 0.01;
            this.camera.update();
            this.render();
        } else if (this.mouseState.button === Canvas.MOUSE_BUTTON_RIGHT) {
            const d = mouse.sub(this.mouseState.prevPosition);
            const [xVec, yVec] = this.camera.getFocalXYVector(this.canvas.width,
                                                              this.canvas.height);
            this.camera.target = this.camera.prevTarget.add(xVec.scale(-d.x).add(yVec.scale(-d.y)));
            this.camera.update();
            this.render();
        }
    }

    setData(vertexes, indexes) {
        this.vertexes = vertexes;
        this.indexes = indexes;
        this.vbo = CreateStaticVbo(this.gl, vertexes);
        this.ibo = CreateStaticIbo(this.gl, indexes);
    }

    keydownListener(event) {
        if (event.key === 'ArrowRight') {
            this.orbitStartX += 0.05;
        } else if (event.key === 'ArrowLeft') {
            this.orbitStartX -= 0.05;
        } else if (event.key === 'ArrowUp') {
            this.orbitStartY += 0.05;
        } else if (event.key === 'ArrowDown') {
            this.orbitStartY -= 0.05;
        } else if (event.key === 'w') {
            this.orbitStartHeight += 0.05;
        } else if (event.key === 's') {
            this.orbitStartHeight -= 0.05;
        }
        this.calcOrbit();
        this.render();
    }

    render() {
        const gl = this.gl;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);

        const attStride = 3;
        gl.vertexAttribPointer(this.vPositionAttrib, attStride, this.gl.FLOAT, false, 0, 0);

        const viewM = Transform.lookAt(new Point3(this.camera.pos.x, this.camera.pos.y, this.camera.pos.z),
                                       new Point3(this.camera.target.x, this.camera.target.y, this.camera.target.z),
                                       this.camera.up);
        const projectM = Transform.perspective(90, 0.001, 1000);
        const mvpM = projectM.mult(viewM);

        const mvpLocation = gl.getUniformLocation(this.renderProgram, 'u_mvpMatrix');
        gl.uniformMatrix4fv(mvpLocation, false, mvpM.m.elem);
        gl.drawElements(gl.TRIANGLES, this.indexes.length, gl.UNSIGNED_SHORT, 0);

        gl.flush();
    }
}
