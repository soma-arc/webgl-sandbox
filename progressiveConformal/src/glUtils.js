/**
 * Get a context of WebGL 2.0
 * @param {HTMLCanvasElement} canvas
 * @returns {WebGL2RenderingContext}
 */
export function GetWebGL2Context(canvas) {
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log(
            'WebGL 2.0 is not supported on this device or browser! Please use another browser or device.',
        );
        alert(
            'WebGL 2.0 is not supported on this device or browser! Please use another browser or device.',
        );
        return;
    }
    return gl;
}

/**
 *
 * @param {WebGL2RenderingContext} gl
 * @param {Array.<Number>} data
 * @returns {WebGLBuffer}
 */
export function CreateStaticVbo(gl, data) {
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
}

/**
 *
 * @param {WebGL2RenderingContext} gl
 * @returns {WebGLBuffer}
 */
export function CreateSquareVbo(gl) {
    return CreateStaticVbo(gl, SQUARE);
}

/**
 *
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 */
export function LinkProgram(gl, program) {
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS) === false) {
        const info = gl.getProgramInfoLog(program);
        console.log(`Link Program Error\n${info}`);
    }
    gl.useProgram(program);
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {String} shaderStr
 * @param {WebGLProgram} program
 * @param {GLenum} shaderType
 */
export function AttachShader(gl, shaderStr, program, shaderType) {
    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderStr);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === false) {
        console.log(`Shader Compilation Error\n${gl.getShaderInfoLog(shader)}`);
    }
    gl.attachShader(program, shader);
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {Number} width
 * @param {Number} height
 * @param {GLenum} internalFormat
 * @param {GLenum} format
 * @param {GLenum} type
 * @returns {WebGLTexture}
 */
export function CreateTexture(gl, width, height, internalFormat, format, type) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        internalFormat,
        width,
        height,
        0,
        format,
        type,
        null,
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {Number} width
 * @param {Number} height
 * @param {GLenum} type
 * @returns {WebGLTexture}
 */
export function CreateRGBTexture(gl, width, height, type) {
    return CreateTexture(gl, width, height, gl.RGB, gl.RGB, type);
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {Number} width
 * @param {Number} height
 * @returns {WebGLTexture}
 */
export function CreateRGBUnsignedByteTexture(gl, width, height) {
    return CreateRGBTexture(gl, width, height, gl.UNSIGNED_BYTE);
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {Number} width
 * @param {Number} height
 * @returns {WebGLTexture}
 */
export function CreateRGBFloatTexture(gl, width, height) {
    return CreateRGBTexture(gl, width, height, gl.FLOAT);
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {Number} width
 * @param {Number} height
 * @param {Number} num
 * @returns {Array.<WebGLTexture>}
 */
export function CreateRGBUnsignedByteTextures(gl, width, height, num) {
    const textures = [];
    for (let i = 0; i < num; i++) {
        textures.push(CreateRGBUnsignedByteTexture(gl, width, height));
    }
    return textures;
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {Number} width
 * @param {Number} height
 * @returns {WebGLTexture}
 */
export function CreateRGBAUnsignedByteTexture(gl, width, height) {
    return CreateTexture(gl, width, height, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE);
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {Number} width
 * @param {Number} height
 * @param {HTMLImageElement} image
 * @returns {WebGLTexture}
 */
export function CreateRGBAUnsignedByteImageTexture(gl, width, height, image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {Number} width
 * @param {Number} height
 * @param {Number} num
 * @returns {Array.<WebGLTexture>}
 */
export function CreateRGBAUnsignedByteTextures(gl, width, height, num) {
    const textures = [];
    for (let i = 0; i < num; i++) {
        textures.push(CreateRGBAUnsignedByteTexture(gl, width, height));
    }
    return textures;
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {Number} width
 * @param {Number} height
 * @returns {WebGLTexture}
 */
export function CreateRGBAFloatTexture(gl, width, height) {
    return CreateTexture(gl, width, height, gl.RGBA32F, gl.RGBA, gl.FLOAT);
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {Number} width
 * @param {Number} height
 * @param {Number} num
 * @returns {Array.<WebGLTexture>}
 */
export function CreateRGBAFloatTextures(gl, width, height, num) {
    const textures = [];
    for (let i = 0; i < num; i++) {
        textures.push(CreateRGBAFloatTexture(gl, width, height));
    }
    return textures;
}

/**
 * @returns {Array.<Number>}
 */
export const SQUARE = [-1, -1, -1, 1, 1, -1, 1, 1];
