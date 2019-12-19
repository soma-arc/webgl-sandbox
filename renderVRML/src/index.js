import Vue from 'vue';
import Root from './vue/root.vue';
import CanvasHandler from './canvasHandler.js';

window.addEventListener('load', () => { 
    const canvasHandler = new CanvasHandler();
    
    const d = { 'canvasHandler': canvasHandler };
    const ui = new Vue({
        el: '#app',
        data: d,
        render: (h) => {
            return h('root', { 'props': d });
        },
        components: { 'root': Root }
    });

    canvasHandler.init();

    function renderLoop() {
        //canvasHandler.render();
        requestAnimationFrame(renderLoop);
    }

    renderLoop();
});
