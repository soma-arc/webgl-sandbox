function drawPolygon(x, y, r, vertexNum) {
    push();
    translate(x, y);
    beginShape();
    for (let i = 0; i < vertexNum; i++) {
        vertex(r*cos(radians(360*i/vertexNum)), r*sin(radians(360*i/vertexNum)));
    }
    endShape(CLOSE);
    pop();
}

function setup() {
    createCanvas(1024, 512);
    background(100);
}

function draw() {
    translate(width/ 2, height/ 2);
    let r = 50; // 六角形の半径
    let hexWidth = 1.5 * r; // 横方向の間隔
    let hexHeight = sqrt(3) * r; // 縦方向の間隔

    let centers = []; // 六角形の中心を保存する配列

    let numX = 20;
    let numY = 8;
    let startIndX = -numX/2;
    let startIndY = -3;
    // 六角形を描画し、中心座標を計算
    for (let i = startIndY; i < startIndY + numY; i++) {
        for (let j = startIndX; j < startIndX + numX; j++) {
            let x = j * hexWidth;
            let y = i * hexHeight + (j % 2 === 0 ? 0 : hexHeight / 2); // 奇数列をずらす
            drawPolygon(x, y, r, 6);

            //circle(x, y, 10);
            // vertical lines
            line(x, -height, x, height);
        }
        
    }
    for (let i = startIndY; i < startIndY + numY; i++) {
        line(width, width * (hexHeight/2) / 75 + i * hexHeight, -width, -width * (hexHeight/2) / 75 + i * hexHeight);
        line(width, -width * (hexHeight/2) / 75 + i * hexHeight, -width, width * (hexHeight/2) / 75 + i * hexHeight);
    }


}
