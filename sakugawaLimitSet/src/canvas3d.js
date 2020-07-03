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
        this.vColorAttrib = this.gl.getAttribLocation(this.renderProgram, 'vColor');
        this.gl.enableVertexAttribArray(this.vColorAttrib);
        
        this.z0 = -1;
        this.thetaA = 0.3;
        this.thetaB = Math.PI / 2;// + 0.1;
        this.maxLevel = 20;
        this.threshold = 0.001;

        this.orbitStartX = 0;
        this.orbitStartY = 0;
        this.orbitStartHeight = 0;
        this.orbitGenIndex = 3;
        
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
        }//  else if (this.mouseState.button === Canvas.MOUSE_BUTTON_RIGHT) {
        //     const d = mouse.sub(this.mouseState.prevPosition);
        //     const [xVec, yVec] = this.camera.getFocalXYVector(this.canvas.width,
        //                                                       this.canvas.height);
        //     this.camera.target = this.camera.prevTarget.add(xVec.scale(-d.x).add(yVec.scale(-d.y)));
        //     this.camera.update();
        //     this.render();
        // }
    }

    calcLimitSet() {
        const recipe1 = new SakugawaRecipe(new Quaternion(this.z0, 0, 0, 0), this.thetaA, this.thetaB);
        this.dfs = new DFSOperator(recipe1.a, recipe1.b, this.maxLevel, this.threshold);
        console.log('search');
        this.dfs.search();
        console.log('Done');
        
        this.calcOrbit();
        this.pointsVbo = CreateStaticVbo(this.gl, this.dfs.points);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pointsVbo);

        this.colorsVbo = CreateStaticVbo(this.gl, this.dfs.colors);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorsVbo);
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

    resetOrbit() {
        this.orbits = [];
        this.orbitsVbo = CreateStaticVbo(this.gl, this.orbits);
        this.orbitStartX = 0;
        this.orbitStartHeight = 0;
        this.orbitStartY = 0;
        this.render();
        this.canvas.focus();
    }
    
    calcOrbit() {
        const origin1 = new Quaternion(this.orbitStartX, this.orbitStartHeight, this.orbitStartY, 0);
        const gen = this.dfs.gens[this.orbitGenIndex];
        const origin2 = MobiusOnPoint(gen, origin1);
        const origin3 = MobiusOnPoint(gen, origin2);
        const origin4 = MobiusOnPoint(gen, origin3);
        const origin5 = MobiusOnPoint(gen, origin4);
        const origin6 = MobiusOnPoint(gen, origin5);
        const origin7 = MobiusOnPoint(gen, origin6);
        this.orbits = [origin1.re, origin1.i, origin1.j, 
                       origin2.re, origin2.i, origin2.j, 
                       origin3.re, origin3.i, origin3.j, 
                       origin4.re, origin4.i, origin4.j,
                       origin5.re, origin5.i, origin5.j, 
                       origin6.re, origin6.i, origin6.j,
                       origin7.re, origin7.i, origin7.j];
        this.orbitsVbo = CreateStaticVbo(this.gl, this.orbits);
    }
    
    render() {
        const gl = this.gl;

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pointsVbo);
        const attStride = 3;
        gl.vertexAttribPointer(this.vPositionAttrib, attStride, this.gl.FLOAT, false, 0, 0);

        const viewM = Transform.lookAt(new Point3(this.camera.pos.x, this.camera.pos.y, this.camera.pos.z),
                                       new Point3(this.camera.target.x, this.camera.target.y, this.camera.target.z),
                                       this.camera.up);
        const projectM = Transform.perspective(90, 0.001, 1000);
        const mvpM = projectM.mult(viewM);

        const mvpLocation = gl.getUniformLocation(this.renderProgram, 'u_mvpMatrix');
        gl.uniformMatrix4fv(mvpLocation, false, mvpM.m.elem);

        gl.drawArrays(gl.LINES, 0, this.dfs.points.length/3);
        //gl.flush();

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.orbitsVbo);
        gl.uniformMatrix4fv(mvpLocation, false, mvpM.m.elem);
        gl.vertexAttribPointer(this.vPositionAttrib, attStride, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorsVbo);
        gl.vertexAttribPointer(this.vColorAttrib, attStride, this.gl.FLOAT, false, 0, 0);
        
        gl.drawArrays(gl.LINE_STRIP, 0, this.orbits.length/3);
        gl.flush();
    }
}
