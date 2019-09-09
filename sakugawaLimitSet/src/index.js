import { GetWebGL2Context, AttachShader, LinkProgram,
         CreateStaticVbo } from './glUtils.js';
import Transform from './geometry/transform.js';
import Point3 from './geometry/point3.js';
import Vec3 from './geometry/vector3.js';
const RENDER_FRAG = require('./shaders/render.frag');
const RENDER_VERT = require('./shaders/render.vert');

window.addEventListener('load', () => {
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
    const vbo = CreateStaticVbo(gl, vertexPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    const attStride = 3;
    gl.vertexAttribPointer(vPositionAttrib, attStride, gl.FLOAT, false, 0, 0);

    const viewM = Transform.lookAt(new Point3(0, 1, 3),
                                   new Point3(0, 0, 0),
                                   new Vec3(0, 1, 0));
    const projectM = Transform.perspective(90, 0.001, 100);
    const mvpM = projectM.mult(viewM);

    const mvpLocation = gl.getUniformLocation(renderProgram, 'u_mvpMatrix');
    gl.uniformMatrix4fv(mvpLocation, false, mvpM.m.elem);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.flush();

});
