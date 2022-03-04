import Canvas2D from './canvas2d.js';

window.addEventListener('load', () => {
    const canvas = new Canvas2D('canvas');
    canvas.init();

    const loadButton = document.getElementById('button');
    const video = document.createElement('video');

    let loaded = false;

    loadButton.addEventListener('click', () => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            const result = [];
            video.src = reader.result;
            loaded = true;
        });
        const a = document.createElement('input');
        a.type = 'file';
        a.addEventListener('change', function(event) {
            const files = event.target.files;
            if(files[0].name.includes(".mp4") === false) return;
            reader.readAsDataURL(files[0]);
        });
        a.click();
    });
    
    function renderLoop() {
        if (loaded) {
            canvas.updateVideo(video);
        }
        canvas.render();
        requestAnimationFrame(renderLoop);
    }
    //renderLoop();

    let index = 0;
    let t = 0;
    const fps = 30;
    const step = 1.0/fps;
    const duration = 40.0;
    function renderLoopSave() {
        if (t < duration) {
            canvas.updateVideo(video);
            canvas.renderWithTime(t);
            const n = index.toString().padStart(4, '0');
            canvas.saveImage(canvas.gl,
                             canvas.canvas.width,
                             canvas.canvas.height,
                             `kyu190a_${n}`);
        }
        index++;
        t += step;
        requestAnimationFrame(renderLoopSave);
    }
    let renderFirst = true;
    video.addEventListener('canplay', ()=>{
        loaded = true;
        video.play();
        if(renderFirst) {
            renderLoopSave();
            renderFirst = false;
        }
    });

    video.addEventListener('ended', () => {
        video.play();
    });
});
