import { GetWebGL2Context, AttachShader, LinkProgram,
         CreateStaticVbo } from './glUtils.js';
import Transform from './geometry/transform.js';
import Point3 from './geometry/point3.js';
import Vec3 from './geometry/vector3.js';

import Complex from './2d/complex.js';
import GrandmaRecipe from './2d/grandmaRecipe.js';
import DfsComplexOperator from './2d/dfsOperator.js';

import Quaternion from './quaternion.js';
import SPK1_1 from './spk1_1.js';
import SakugawaRecipe from './sakugawaRecipe.js'; 
import DFSOperator from './DFSOperator.js';
import { ComputeMatrix, ComputeFixedPoint,
         MobiusOnPoint, DistQuaternion3D } from './util.js';

const RENDER_FRAG = require('./shaders/render.frag');
const RENDER_VERT = require('./shaders/render.vert');

window.addEventListener('load', () => {
    const a = new Quaternion(1, 2, 3, 4);
    const b = new Quaternion(5, 6, 7, 8);
    console.log(`a: ${a.toString()}`);
    console.log(`b: ${b.toString()}`);
    console.log(`a + b: ${a.add(b).toString()}`);
    console.log(`a - b: ${a.sub(b).toString()}`);
    console.log(`a * b: ${a.mult(b).toString()}`);
    console.log(`a / 2: ${a.scale(0.5).toString()}`);
    console.log(`sqrt(a): ${a.sqrt().toString()}`);
    console.log(`sqrt(b): ${b.sqrt().toString()}`);
    console.log(`abs(a): ${a.abs().toString()}`);
    console.log(`abs(b): ${b.abs().toString()}`);
    console.log();

    const am = new SPK1_1(a, b, b, a);
    const bm = new SPK1_1(b, a, b, b);
    console.log('am:\n'+ am.toString());
    console.log('bm:\n'+ bm.toString());
    console.log('am * bm:\n'+ (am.mult(bm)).toString());
    console.log('bm * am:\n'+ (bm.mult(am)).toString());
    console.log('trace(am)\n'+ am.trace().toString());
    console.log('trace(bm)\n'+ bm.trace().toString());
    console.log('inverse(am)\n'+ am.inverse().toString());
    console.log('inverse(bm)\n'+ bm.inverse().toString());
    console.log();

    const z0_1 = new Quaternion(-1, 0 ,0 ,0);
    const thetaA_1 = 0;
    const thetaB_1 = Math.PI / 2;
    const recipe1 = new SakugawaRecipe(z0_1, thetaA_1, thetaB_1);
    console.log('recipe1 a\n'+recipe1.a.toString());
    console.log('recipe1 b\n'+recipe1.b.toString());
    console.log();

    const z0_2 = new Quaternion(-2, 0 ,0 ,0);
    const thetaA_2 = Math.PI / 2;
    const thetaB_2 = 0;
    const recipe2 = new SakugawaRecipe(z0_2, thetaA_2, thetaB_2);
    console.log('recipe2 a\n'+recipe2.a.toString());
    console.log('recipe2 b\n'+recipe2.b.toString());
    console.log();

    console.log('---Fix a---');
    console.log(ComputeFixedPoint(recipe1.a));
    console.log('---done----');
    console.log('---Fix b---');
    console.log(ComputeFixedPoint(recipe1.b));
    console.log('---done---');
    console.log('---Fix a inverse---');
    console.log(ComputeFixedPoint(recipe1.a.inverse()));
    console.log('---done----');
    console.log('---Fix b inverse---');
    console.log(ComputeFixedPoint(recipe1.b.inverse()));
    console.log('---done---');
    
    const dfs = new DFSOperator(recipe1.a, recipe1.b, 15, 0.001);
    console.log('gens');
    console.log(dfs.gens[1].toString());
    console.log(dfs.gens[2].toString());
    console.log(dfs.gens[3].toString());
    console.log(dfs.gens[4].toString());
    console.log();
    console.log();
    console.log('Fixed Points');
    for(let i = 1; i <= 4; i ++){
		for(let j = 1; j <= 4; j++){
            console.log(`(${i}, ${j})`);
			console.log(dfs.fixedPoint[i][j].toString());
		}
	}
    console.log();
    dfs.search();
    console.log(dfs.points);
    
    // const recipe = new GrandmaRecipe(new Complex(2, 0.0),
    //                                  new Complex(2, 0.0),
    //                                  false);
    // const dfs = new DfsComplexOperator(recipe.gens);
    // dfs.initialize(12, 0.005);
    // dfs.search();
    // console.log(dfs.pointList);

    const canvas = document.getElementById('canvas');


    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'red';
    ctx.translate(canvas.width / 2, canvas.height/2);
    const scale = 100;
    // for(let i = 0; i < dfs.points.length/12; i++) {
    //     ctx.beginPath();
    //     ctx.moveTo(dfs.points[i * 4 + 0]*scale, dfs.points[i * 3 + 2]*scale);
    //     ctx.lineTo(dfs.points[(i + 1) * 3 + 0]*scale, dfs.points[(i + 1) * 3 + 2]*scale);
    //     ctx.lineTo(dfs.points[(i + 2) * 3 + 0]*scale, dfs.points[(i + 2) * 3 + 2]*scale);
    //     ctx.lineTo(dfs.points[(i + 3) * 3 + 0]*scale, dfs.points[(i + 3) * 3 + 2]*scale);
    //     //ctx.closePath();
    //     ctx.stroke();
    // }
    for(const points of dfs.points) {
        ctx.beginPath();
        ctx.moveTo(points[0][0]* scale, points[0][2]* scale);
        ctx.lineTo(points[1][0]* scale, points[1][2]* scale);
        ctx.lineTo(points[2][0]* scale, points[2][2]* scale);
        ctx.lineTo(points[3][0]* scale, points[3][2]* scale);
        ctx.stroke(); 
    }


    // const gl = GetWebGL2Context(canvas);

    // gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // gl.clearDepth(1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // const renderProgram = gl.createProgram();
    // AttachShader(gl, RENDER_VERT,
    //              renderProgram, gl.VERTEX_SHADER);
    // AttachShader(gl, RENDER_FRAG,
    //              renderProgram, gl.FRAGMENT_SHADER);
    // LinkProgram(gl, renderProgram);

    // const vPositionAttrib = gl.getAttribLocation(renderProgram,
    //                                              'vPosition');
    // gl.enableVertexAttribArray(vPositionAttrib);

    // const vertexPosition = [
    //     0.0, 1.0, 0.0,
    //     1.0, 0.0, 0.0,
    //     -1.0, 0.0, 0.0
    // ];
    // const vbo = CreateStaticVbo(gl, dfs.points);
    // gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    // const attStride = 3;
    // gl.vertexAttribPointer(vPositionAttrib, attStride, gl.FLOAT, false, 0, 0);

    // const viewM = Transform.lookAt(new Point3(0, 1, 0),
    //                                new Point3(0, 0, 0),
    //                                new Vec3(1, 0, 0));
    // const projectM = Transform.perspective(90, 0.001, 1000);
    // const mvpM = projectM.mult(viewM);

    // const mvpLocation = gl.getUniformLocation(renderProgram, 'u_mvpMatrix');
    // gl.uniformMatrix4fv(mvpLocation, false, mvpM.m.elem);

    // gl.drawArrays(gl.LINE_LOOP, 0, dfs.points/3);
    // gl.flush();

});
