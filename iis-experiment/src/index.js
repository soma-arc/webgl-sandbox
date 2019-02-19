import Complex from './complex.js';

window.addEventListener('load', () => {
    console.log('hello');
    const spCanvas = document.getElementById('spiralCanvas');
    const ctx = spCanvas.getContext('2d');

    renderAxis(spCanvas, ctx);

    //const lambda = new Complex(4/5 * Math.cos(Math.PI / 6), 4/5 * Math.sin(Math.PI / 6));
    const lambda = new Complex(4/5, 4/5);
    renderSpiral(ctx, lambda);
    
    spCanvas.addEventListener('mousedown', (event) => {
        
    });
});

function renderSpiral(ctx, lambda) {
    const alpha = lambda.abs();
    const theta = lambda.arg();
    ctx.beginPath();
    for(let t = -100; t < 100; t += 0.1) {
        const a = Math.pow(alpha, t);
        const tTheta = t * theta;
        const x = a * Math.cos(tTheta);
        const y = a * Math.sin(tTheta);
        ctx.strokeStyle = 'blue';
        ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(lambda.re, lambda.im, 1, 0, Math.PI*2, false);
    ctx.fill();
}

function renderAxis(canvas, ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const hw = canvas.width * 0.5;
    const hh = canvas.height * 0.5;
    const scale = 3;
    
    ctx.translate(hw, hh);
    ctx.scale(scale, -scale);
    
    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    ctx.lineTo(hw, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -hh);
    ctx.lineTo(0, hh);
    ctx.closePath();
    ctx.stroke();
}
