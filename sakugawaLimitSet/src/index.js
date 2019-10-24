import Canvas3D from './canvas3d.js';
import Vue from 'vue';
import Root from './vue/root.vue';

window.addEventListener('load', () => {
    const canvas = new Canvas3D('canvas');

    const d = { 'canvas': canvas };
    const ui = new Vue({
        el: '#ui',
        data: d,
        render: (h) => {
            return h('root', { 'props': d });
        },
        components: { 'root': Root }
    });
});
