import Canvas2D from './canvas2d.js';

window.addEventListener('load', () => {
    const canvas = new Canvas2D('canvas');
    canvas.init();

    const loadButton = document.getElementById('button');
    const video = document.createElement('video');
    //const video = document.getElementById('video');
    video.addEventListener('canplay', ()=>{
        video.play();
    });
    video.addEventListener('ended', () => {
	video.play();
    });
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
    renderLoop();
});

function loadVideo() {

}
