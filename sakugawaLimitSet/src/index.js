import { GetWebGL2Context, AttachShader, LinkProgram,
         CreateStaticVbo } from './glUtils.js';
import Transform from './geometry/transform.js';
import Point3 from './geometry/point3.js';
import Vec3 from './geometry/vector3.js';

import Complex from './2d/complex.js';
import GrandmaRecipe from './2d/grandmaRecipe.js';
import DfsOperator from './2d/dfsOperator.js';

const RENDER_FRAG = require('./shaders/render.frag');
const RENDER_VERT = require('./shaders/render.vert');

window.addEventListener('load', () => {
    const recipe = new GrandmaRecipe(new Complex(2, 0.0),
                                     new Complex(2, 0.0),
                                     false);
    const dfs = new DfsOperator(recipe.gens);
    dfs.initialize(12, 0.005);
    dfs.search();
    console.log(dfs.pointList);

    const canvas = document.getElementById('canvas');
    const gl = GetWebGL2Context(canvas);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const renderProgram = gl.createProgram();
    AttachShader(gl, RENDER_VERT,
                 renderProgram, gl.VERTEX_SHADER);
    AttachShader(gl, RENDER_FRAG,
                 renderProgram, gl.FRAGMENT_SHADER);
    LinkProgram(gl, renderProgram);

    const vPositionAttrib = gl.getAttribLocation(renderProgram,
                                                 'vPosition');
    gl.enableVertexAttribArray(vPositionAttrib);

    const vertexPosition = [
        0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0
    ];
    const vbo = CreateStaticVbo(gl, dfs.pointList);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    const attStride = 3;
    gl.vertexAttribPointer(vPositionAttrib, attStride, gl.FLOAT, false, 0, 0);

    const viewM = Transform.lookAt(new Point3(0, 0, 2),
                                   new Point3(0, 0, 0),
                                   new Vec3(0, 1, 0));
    const projectM = Transform.perspective(90, 0.001, 1000);
    const mvpM = projectM.mult(viewM);

    const mvpLocation = gl.getUniformLocation(renderProgram, 'u_mvpMatrix');
    gl.uniformMatrix4fv(mvpLocation, false, mvpM.m.elem);

    gl.drawArrays(gl.LINE_LOOP, 0, dfs.pointList.length/3);
    gl.flush();

});
