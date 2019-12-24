import Circle from './circle.js';
import Complex from './complex.js';

window.addEventListener('load', () => {

    const triangleEdgeLength = 5.0;
    const cCenter = new Circle(triangleEdgeLength * 0.5, Math.sqrt(3.) * triangleEdgeLength / 6.0,
                               triangleEdgeLength * (2.0 * Math.sqrt(3.0) - 3.)/6.0);
    cCenter.genId = 0;
    const cRight = new Circle(triangleEdgeLength, 0, triangleEdgeLength * 0.5);
    cRight.genId = 1;
    const cLeft = new Circle(0, 0, triangleEdgeLength * 0.5);
    cLeft.genId = 2;
    const cTop = new Circle(triangleEdgeLength * 0.5, Math.sqrt(3.) * 0.5 * triangleEdgeLength, triangleEdgeLength * 0.5);
    cLeft.genId = 3;

    
    const x = 5.0;
    const c1r = new Complex(3 / 4 * x, Math.sqrt(3) / 4 * x);
    const c2r = new Complex((4 - Math.sqrt(3)) / 4 * x, x / 4);
    const c3r = new Complex(x / 2, Math.sqrt(3) / 6 * x + x * (2.0 * Math.sqrt(3.0) - 3.0) / 6.0);
    const originCr = Circle.fromPoints(c1r, c2r, c3r);
    //console.log(`${originCr.center.re}, ${originCr.center.im}, ${originCr.r} `);

    const c1l = new Complex(1 / 4 * x, Math.sqrt(3) / 4 * x);
    const c2l = new Complex(Math.sqrt(3) / 4 * x, x / 4);
    const c3l = new Complex(x / 2, Math.sqrt(3) / 6 * x + x * (2.0 * Math.sqrt(3.0) - 3.0) / 6.0);
    const originCl = Circle.fromPoints(c1l, c2l, c3l);
    //console.log(`${originCl.center.re}, ${originCl.center.im}, ${originCl.r} `);

    const c1 = cLeft.invertOnCircle(originCr);
    c1.prevGen = cLeft.genId;
    const c2 = cRight.invertOnCircle(originCl);
    c2.prevGen = cRight.genId;

    const circlesList = [[c1, c2]];
    const genCircles = [cCenter, cRight, cLeft, cTop];
    const maxLevel = 12;
    
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

    console.log(circlesList);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2 - cCenter.re, canvas.height / 2 - cCenter.im);
    ctx.scale(200, 200);
    for(const list of circlesList) {
        for(const c of list) {
            ctx.beginPath () ;
            ctx.arc( c.center.re, c.center.im, c.r, 0, 2. * Math.PI) ;
            ctx.fillStyle = "rgba(255,0,0,0.8)" ;
            ctx.closePath();
            ctx.fill() ;
        }
    }
    console.log('Done');
});
