import Vue from 'vue';
import CanvasHandler from './canvasHandler.js';
import Root from './vue/root.vue';

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
});
