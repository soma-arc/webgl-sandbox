import { CreateRGBATextures } from './glUtils.js';

const TextureData = {};
const DEFAULT_IMAGE_URLS = { 'tile': require('./img/tile_a.jpg'),
                             'tile1': require('./img/tile_a_ss.jpg'),
                             'tile_a': require('./img/tile_b_ss.jpg')};

export default class TextureHandler {
    static init() {
        const promises = [];
        for (const imgName of Object.keys(DEFAULT_IMAGE_URLS)) {
            const imgUrl = DEFAULT_IMAGE_URLS[imgName];
            const img = new Image();
            const p = new Promise(function(resolve, reject) {
                img.addEventListener('load', () => {
                    resolve();
                });
            });
            promises.push(p);
            img.src = imgUrl;
            TextureData[imgName] = { 'imageData': img,
                                     'index': 0 };
        }
        return promises;
    }

    static getTextureIndex(name) {
        return TextureData[name].index;
    }

    static get textureCatFishRun() {
        return TextureData['tile'];
    }

    static createTextures(gl, textureIndex) {
        const textures = [];
        for (const img of Object.values(TextureData)) {
            const width = img.imageData.width;
            const height = img.imageData.height;
            const tex = CreateRGBATextures(gl, width, height, 1)[0];
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                          width, height, 0, gl.RGBA,
                          gl.UNSIGNED_BYTE, img.imageData);
            gl.bindTexture(gl.TEXTURE_2D, null);
            textures.push(tex);
            img.index = textureIndex;
            textureIndex++;
        }
        return textures;
    }

    static setUniformLocation(gl, uniLocation, program, index) {
        // let i = 0;
        // for (const img of Object.values(TextureData)) {
        //     uniLocation.push(gl.getUniformLocation(program,
        //                                            `u_imageTexture`));
        //     i++;
        // }
        uniLocation.push(gl.getUniformLocation(program,
                                               `u_imageTexture`));
        uniLocation.push(gl.getUniformLocation(program,
                                               `u_imageTexture2`));
        uniLocation.push(gl.getUniformLocation(program,
                                               `u_imageTexture3`));
    }
}
