import Canvas2D from './canvas2d.js';

window.addEventListener('load', () => {
    const canvas = new Canvas2D('canvas');
    canvas.init();

    const loadButton = document.getElementById('button');
    loadButton.addEventListener('click', () => {
    });
    
    function renderLoop() {
        canvas.render();
        requestAnimationFrame(renderLoop);
    }
    //renderLoop();

    let index = 0;
    let t = 0;
    const fps = 30;
    const step = 1.0/fps;
    const duration = 18.0;
    function renderLoopSave() {
        if (t < duration) {
            canvas.renderWithTime(t);
            const n = index.toString();
            canvas.saveImage(canvas.gl,
                             canvas.canvas.width,
                             canvas.canvas.height,
                             `${n}`);
        }
        index++;
        t += step;
        //requestAnimationFrame(renderLoopSave);
        window.setTimeout(renderLoopSave, 100);
    }
    renderLoopSave();
});
