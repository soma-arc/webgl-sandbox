import Canvas2D from './canvas2d.js';

export default class CanvasHandler {
    constructor() {
        this.canvas2d = new Canvas2D('canvas');
    }

    init() {
        this.canvas2d.init();
        this.canvas2d.render();
    }

    render() {
        if (this.canvas2d.isProductRendering) {
            this.canvas2d.renderProduct();
        }
    }
}
