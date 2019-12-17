import Canvas2D from './canvas2d.js';

export default class CanvasHandler {
    constructor() {
    }

    init() {
        this.canvas2d = new Canvas2D('canvas');
    }
}
