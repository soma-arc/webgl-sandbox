import Canvas3D from './canvas3d.js';

export default class CanvasHandler {
    constructor() {
        this.canvas3d = {};
    }

    init() {
        this.canvas3d = new Canvas3D('canvas');
        this.canvas3d.render();
    }

    render() {
        this.canvas3d.render();
    }

    setVertexesAndIndexes(vertexes, indexes, normals) {
        this.canvas3d.setData(vertexes, indexes, normals);
        this.canvas3d.render();
    }
}
