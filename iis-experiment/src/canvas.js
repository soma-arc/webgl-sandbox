import Complex from './complex.js';

export default class Canvas {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.lineWidth = 0.1;
        this.lambda = new Complex(4 / 5, 4 / 5);
        this.pixelRatio = 1.0; //window.devicePixelRatio;

        this.scale = 20;
        this.hw = this.canvas.width * 0.5;
        this.hh = this.canvas.height * 0.5;
        this.translate = new Complex(0, 0);

        this.boundMouseDownListener = this.mouseDownListener.bind(this);
        this.canvas.addEventListener('mousedown', this.boundMouseDownListener);

        this.boundMouseMoveListener = this.mouseMoveListener.bind(this);
        this.canvas.addEventListener('mousemove', this.boundMouseMoveListener);

        this.boundMouseUpListener = this.mouseUpListener.bind(this);
        this.canvas.addEventListener('mouseup', this.boundMouseUpListener);

        this.canvasRatio = this.canvas.width / this.canvas.height / 2;

        this.mouseState = {
            isPressing: false,
            position: new Complex(0, 0),
            prevPosition: new Complex(0, 0),
            prevCanvasCoord: new Complex(0, 0),
            prevTranslate: new Complex(0, 0),
            button: -1
        };
    }

    render() {
        this.ctx.save();
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.translate(this.hw, this.hh);
        this.ctx.scale(this.scale, -this.scale);

        this.renderSpiral(this.ctx, this.lambda);
        this.renderAxis(this.canvas, this.ctx);
        this.ctx.restore();
    }

    renderSpiral(ctx, lambda) {
        const alpha = lambda.abs();
        const theta = lambda.arg();
        ctx.beginPath();
        for (let t = -100; t < 100; t += 0.1) {
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
        ctx.arc(lambda.re, lambda.im, 0.5, 0, Math.PI * 2, false);
        ctx.fill();
    }

    renderAxis(canvas, ctx) {
        ctx.strokeStyle = 'black';

        ctx.beginPath();
        ctx.moveTo(-this.hw, 0);
        ctx.lineTo(this.hw, 0);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -this.hh);
        ctx.lineTo(0, this.hh);
        ctx.closePath();
        ctx.stroke();
    }

    calcCanvasCoord(mx, my) {
        const rect = this.canvas.getBoundingClientRect();
        return new Complex(this.canvas.width / this.scale * (((mx - rect.left - this.translate.re) * this.pixelRatio) /
                                                             this.canvas.width - 0.5),
                           this.canvas.height / this.scale * -(((my - rect.top - this.translate.im) * this.pixelRatio) /
                                                               this.canvas.height - 0.5));
    }

    mouseDownListener(event) {
        event.preventDefault();
        this.canvas.focus();
        const mouse = this.calcCanvasCoord(event.clientX, event.clientY);
        console.log(mouse);
        this.mouseState.button = event.button;
        if (Complex.distance(mouse, this.lambda) < 0.2) {
            this.prevCoord = mouse;
            this.mouseDiff = this.lambda.sub(mouse);
            console.log(this.mouseDiff);
            this.render();
        }
    }

    mouseMoveListener(event) {
        if (this.mouseState.button === Canvas.MOUSE_BUTTON_LEFT) {
            const mouse = this.calcCanvasCoord(event.clientX, event.clientY);
            this.lambda = mouse.add(this.mouseDiff);
            this.render();
        }
    }

    mouseUpListener(event) {
        this.mouseState.isPressing = false;
        this.mouseState.button = -1;
    }

    static get MOUSE_BUTTON_LEFT() {
        return 0;
    }

    static get MOUSE_BUTTON_WHEEL() {
        return 1;
    }

    static get MOUSE_BUTTON_RIGHT() {
        return 2;
    }
}
