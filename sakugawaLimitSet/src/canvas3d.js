import Canvas from './canvas.js';
import Vec2 from './geometry/vector2.js';
import Vec3 from './geometry/vector3.js';
import Point3 from './geometry/point3.js';
import Transform from './geometry/transform.js';
import Quaternion from './quaternion.js';
import SakugawaRecipe from './sakugawaRecipe.js'; 
import DFSOperator from './DFSOperator.js';
import { CameraOnSphere } from './camera.js';
import { GetWebGL2Context, AttachShader, LinkProgram,
         CreateStaticVbo } from './glUtils.js';
import { MobiusOnPoint } from './util.js';
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

        this.z0 = -1;
        this.thetaA = 0;
        this.thetaB = Math.PI / 2;
        this.maxLevel = 15;
        this.threshold = 0.001;

        this.calcLimitSet();
        this.render();
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

    calcLimitSet() {
        const recipe1 = new SakugawaRecipe(new Quaternion(this.z0, 0, 0, 0), this.thetaA, this.thetaB);
        this.dfs = new DFSOperator(recipe1.a, recipe1.b, this.maxLevel, this.threshold);
        console.log('search');
        this.dfs.search();
        console.log('Done');
        const vbo = CreateStaticVbo(this.gl, this.dfs.points);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
    }

    calcOrbit() {
        const origin = new Quaternion(0, 0, 0, 0);
        //MobiusOnPoint(this.dfs.a, origin);
        this.orbits = [];
    }
    
    render() {
        const gl = this.gl;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const attStride = 3;
        this.gl.vertexAttribPointer(this.vPositionAttrib, attStride, this.gl.FLOAT, false, 0, 0);

        const viewM = Transform.lookAt(new Point3(this.camera.pos.x, this.camera.pos.y, this.camera.pos.z),
                                       new Point3(this.camera.target.x, this.camera.target.y, this.camera.target.z),
                                       this.camera.up);
        const projectM = Transform.perspective(90, 0.001, 1000);
        const mvpM = projectM.mult(viewM);

        const mvpLocation = gl.getUniformLocation(this.renderProgram, 'u_mvpMatrix');
        gl.uniformMatrix4fv(mvpLocation, false, mvpM.m.elem);

        gl.drawArrays(gl.LINES, 0, this.dfs.points.length/3);
        gl.flush();
    }
}
