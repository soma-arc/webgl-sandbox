import Vue from 'vue';
import CanvasHandler from './canvasHandler.js';
import Root from './vue/root.vue';
import Circle from './circle.js';
import Complex from './complex.js';
import TextureHandler from './textureHandler.js';

window.addEventListener('load', () => {
    const texLoad = TextureHandler.init();
    Promise.all(texLoad).then(function() {
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

        const c1o = new Complex(0, 0);
        const c2o = new Complex(-0.2, -0.4);
        const c3o = new Complex(0.2, -0.4);
        const co = Circle.fromPoints(c1o, c2o, c3o);
        console.log(`${co.center.re}, ${co.center.im}, ${co.r} `);
        // const x = 5.0;
        // const c1r = new Complex(3 / 4 * x, Math.sqrt(3) / 4 * x);
        // const c2r = new Complex((4 - Math.sqrt(3)) / 4 * x, x / 4);
        // const c3r = new Complex(x / 2, Math.sqrt(3) / 6 * x + x * (2.0 * Math.sqrt(3.0) - 3.0) / 6.0);
        const c1r = new Complex(1, 0);
        const c2r = new Complex(0.2, -0.4);
        const c3r = new Complex(0, -1);
        const cr = Circle.fromPoints(c1r, c2r, c3r);
        console.log(`${cr.center.re}, ${cr.center.im}, ${cr.r} `);

        // const c1l = new Complex(1 / 4 * x, Math.sqrt(3) / 4 * x);
        // const c2l = new Complex(Math.sqrt(3) / 4 * x, x / 4);
        // const c3l = new Complex(x / 2, Math.sqrt(3) / 6 * x + x * (2.0 * Math.sqrt(3.0) - 3.0) / 6.0);
        const c1l = new Complex(-1, 0);
        const c2l = new Complex(-0.2, -0.4);
        const c3l = new Complex(0, -1);
        const cl = Circle.fromPoints(c1l, c2l, c3l);
        console.log(`${cl.center.re}, ${cl.center.im}, ${cl.r} `);

        const P = new Complex(1, 0);
        const Q = new Complex(-1, 0);
        const R = new Complex(-1.0 / 3.0, -(2 * Math.sqrt(2)) / 3.0);
        const S = new Complex(1.0 / 3.0, (-2 * Math.sqrt(2)) / 3.0);
        const cb = Circle.computeHyperbolicLine(Q, R);
        const cA = Circle.computeHyperbolicLine(R, S);
        const cB = Circle.computeHyperbolicLine(S, P);

        console.log(`${cb.center.re}, ${cb.center.im}, ${cb.r} `);
        console.log(`${cA.center.re}, ${cA.center.im}, ${cA.r} `);
        console.log(`${cB.center.re}, ${cB.center.im}, ${cB.r} `);
    });
});
