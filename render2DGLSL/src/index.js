import Vue from 'vue';
import CanvasHandler from './canvasHandler.js';
import Root from './vue/root.vue';
import Circle from './circle.js';
import Complex from './complex.js';

window.addEventListener('load', () => {
    const canvasHandler = new CanvasHandler();

    const d = { 'canvasHandler': canvasHandler };

    /* eslint-disable no-unused-vars */
    const app = new Vue({
        el: '#app',
        data: d,
        render: (h) => {
            return h('root', { 'props': d });
        },
        components: { 'root': Root }
    });

    canvasHandler.init();
    canvasHandler.render();

    function renderLoop() {
        canvasHandler.render();
        requestAnimationFrame(renderLoop);
    }

    renderLoop();

    const x = 5.0;
    const c1r = new Complex(3 / 4 * x, Math.sqrt(3) / 4 * x);
    const c2r = new Complex((4 - Math.sqrt(3)) / 4 * x, x / 4);
    const c3r = new Complex(x / 2, Math.sqrt(3) / 6 * x + x * (2.0 * Math.sqrt(3.0) - 3.0) / 6.0);
    const cr = Circle.fromPoints(c1r, c2r, c3r);
    console.log(`${cr.center.re}, ${cr.center.im}, ${cr.r} `);

    const c1l = new Complex(1 / 4 * x, Math.sqrt(3) / 4 * x);
    const c2l = new Complex(Math.sqrt(3) / 4 * x, x / 4);
    const c3l = new Complex(x / 2, Math.sqrt(3) / 6 * x + x * (2.0 * Math.sqrt(3.0) - 3.0) / 6.0);
    const cl = Circle.fromPoints(c1l, c2l, c3l);
    console.log(`${cl.center.re}, ${cl.center.im}, ${cl.r} `);
});
