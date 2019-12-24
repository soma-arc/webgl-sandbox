import Circle from './circle.js';
import Complex from './complex.js';

window.addEventListener('load', () => {
    const x = 5.0; // triangleEdgeLength
    const outer = Circle.fromPoints(new Complex(x/4, Math.sqrt(3)/4 * x),
                                    new Complex(3 / 4 * x, Math.sqrt(3)/4 * x),
                                    new Complex(x * 0.5, 0));
    
    const cCenter = new Circle(x * 0.5, Math.sqrt(3.) * x / 6.0,
                               x * (2.0 * Math.sqrt(3.0) - 3.)/6.0);
    cCenter.genId = 0;
    const cRight = new Circle(x, 0, x * 0.5);
    cRight.genId = 1;
    const cLeft = new Circle(0, 0, x * 0.5);
    cLeft.genId = 2;
    const cTop = new Circle(x * 0.5, Math.sqrt(3.) * 0.5 * x, x * 0.5);
    cLeft.genId = 3;

    const c1r = new Complex(3 / 4 * x, Math.sqrt(3) / 4 * x);
    const c2r = new Complex((4 - Math.sqrt(3)) / 4 * x, x / 4);
    const c3r = new Complex(x / 2, Math.sqrt(3) / 6 * x + x * (2.0 * Math.sqrt(3.0) - 3.0) / 6.0);
    const originCr = Circle.fromPoints(c1r, c2r, c3r);

    const c1l = new Complex(1 / 4 * x, Math.sqrt(3) / 4 * x);
    const c2l = new Complex(Math.sqrt(3) / 4 * x, x / 4);
    const c3l = new Complex(x / 2, Math.sqrt(3) / 6 * x + x * (2.0 * Math.sqrt(3.0) - 3.0) / 6.0);
    const originCl = Circle.fromPoints(c1l, c2l, c3l);

    const c1 = cLeft.invertOnCircle(originCr);
    c1.prevGen = cLeft.genId;
    const c2 = cRight.invertOnCircle(originCl);
    c2.prevGen = cRight.genId;

    const circlesList = [[c1, c2]];
    const genCircles = [cCenter, cRight, cLeft, cTop];

    const maxLevel = 5;
    for(let level = 0; level < maxLevel; level++) {
        circlesList.push([]);
        for(const c of circlesList[level]) {
            for(const gen of genCircles) {
                if (c.prevGen === gen.genId) continue;
                const nc = gen.invertOnCircle(c);
                nc.prevGen = gen.genId;
                circlesList[level + 1].push(nc);
            }
        }
    }
    circlesList.push([originCr, originCl]);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2 - cCenter.re, canvas.height / 2 - cCenter.im);
    ctx.scale(800, 800);

    // -----
    // for(const list of circlesList) {
    //     for(const c of list) {
    //         ctx.beginPath () ;
    //         setCircle(ctx, c);
    //         ctx.fillStyle = "rgb(255,0,0)" ;
    //         ctx.closePath();
    //         ctx.fill() ;
    //     }
    // }

    // ctx.beginPath();
    // setCircle(ctx, outer);
    // ctx.lineWidth = 0.005;
    // ctx.strokeStyle = "rgb(255,0,0)";
    // ctx.closePath();
    // ctx.stroke();
    // ------

    // -----
    for(const list of circlesList) {
        for(const c of list) {
            ctx.beginPath () ;
            setCircle(ctx, c);
            ctx.fillStyle = "rgb(0,0,255)" ;
            ctx.closePath();
            ctx.fill();
        }
    }
    
    for(const c of circlesList[circlesList.length-2]) {
        ctx.beginPath() ;
        setCircle(ctx, c);
        ctx.fillStyle = "rgb(255,0,0)" ;
        ctx.closePath();
        ctx.fill() ;
    }


    for(const c of [originCr, originCl]) {
        ctx.beginPath();
        setCircle(ctx, c);
        ctx.lineWidth = 0.005;
        ctx.fillStyle = "rgb(0, 0, 255)";
        ctx.closePath();
        ctx.fill();
    }

    for(const c of genCircles) {
        ctx.beginPath();
        setCircle(ctx, c);
        ctx.lineWidth = 0.005;
        ctx.strokeStyle = "rgb(0,255,0)";
        ctx.closePath();
        ctx.stroke();
    }
    
    console.log('Done');
});

function setCircle(ctx, c) {
    ctx.arc( c.center.re-0.15, c.center.im + 0.8, c.r, 0, 2. * Math.PI);
}

