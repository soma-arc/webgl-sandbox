import Renderer from './renderer.js';

window.addEventListener('load', () => {
    /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector('#canvas');
    const renderer = new Renderer(canvas);

    const render = () => {
        renderer.render();
        requestAnimationFrame(render);
    }

    render();
});
