import Rete from "rete";
import ConnectionPlugin from 'rete-connection-plugin';
import VueRenderPlugin from 'rete-vue-render-plugin';
import ContextMenuPlugin from 'rete-context-menu-plugin'
import AreaPlugin from 'rete-area-plugin';
import CommentPlugin from 'rete-comment-plugin';
import HistoryPlugin from 'rete-history-plugin';
import Complex from './complex.js';
//import ConnectionMasteryPlugin from 'rete-connection-mastery-plugin';

class Socket {
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }
}

class NumberControl {
    constructor() {
        this.input = document.createElement( 'input' );
        this.input.defaultValue = 0;
        this.input.type = "number";
        this.input.style.position = 'absolute';
	    this.input.style.border = 'none';
	    this.input.style.background = '#aaa';
	    this.input.style.color = '#444';

        document.body.appendChild(this.input);
    }

    updatePositions(x, y, width) {
        this.input.style.left = x +'px';
	    this.input.style.top = y +'px';
	    this.input.style.width = width +'px';
    }

    getValue() {
        return this.input.value;
    }
}

class Node {
    constructor(canvas, x, y, numInputs, numOutputs) {
        this.canvas = canvas;
        this.posX = x;
        this.posY = y;
        this.numInputs = numInputs;
        this.numOutputs = numOutputs;

        this.width = 150;
        this.height = 100 + numInputs * 50;

        this.title = "";
    }

    draw(ctx) {
        ctx.fillStyle = "rgb(200, 0, 0)";
        ctx.fillRect(this.posX, this.posY,
                     this.width, this.height);

        ctx.beginPath();
        ctx.fillStyle = "rgb(0, 200, 0)";
        ctx.arc(this.posX + this.width, this.posY + 50, 10, 0, 2 * Math.PI, true);
        ctx.fill();

        for(let i = 0; i < this.numInputs; i++) {
            ctx.beginPath();
            ctx.fillStyle = "rgb(0, 200, 0)";
            ctx.arc(this.posX, this.posY + 100 + i * 50, 10, 0, 2 * Math.PI, true);
            ctx.fill();
        }
        
        ctx.fillStyle = "rgb(0, 0, 0)";
        ctx.font = "20px 'TimesNewRoman'";
        ctx.fillText(this.title, this.posX + 10, this.posY + 20, this.posX + this.width);
    }

    isSelected(x, y) {
        if(this.posX < x && x < this.posX + this.width &&
           this.posY < y && y < this.posY + this.height) {
            return true;
        }

        return false;
    }

    getValue() {
        return undefined;
    }
}

class NumberNode extends Node {
    constructor(canvas, x, y) {
        super(canvas, x, y, 1, 1);

        this.numberControl = new NumberControl();
        this.updateControl();

        this.title = "Real Number";
    }

    updateControl() {
        this.numberControl.updatePositions(this.posX + 25, this.posY + 100, this.width - 50);
    }

    getValue() {
        return this.numberControl.getValue();
    }
}

class ComplexNode extends Node {
    constructor(canvas, x, y) {
        super(canvas, x, y, 2, 1);

        this.numberControl1 = new NumberControl();
        this.numberControl2 = new NumberControl();
        this.updateControl();

        this.title = "Complex"
    }

    updateControl() {
        this.numberControl1.updatePositions(this.posX + 25, this.posY + 100, this.width - 50);
        this.numberControl2.updatePositions(this.posX + 25, this.posY + 150, this.width - 50);
    }

    getValue() {
        return new Complex(this.numberControl1.getValue(),
                           this.numberControl2.getValue());
    }
}

class QuaternionNode extends Node {
     constructor(canvas, x, y) {
        super(canvas, x, y, 4, 1);

        this.numberControl1 = new NumberControl();
        this.numberControl2 = new NumberControl();
        this.numberControl3 = new NumberControl();
        this.numberControl4 = new NumberControl();
        this.updateControl();

        this.title = "Quaternion"
    }

    updateControl() {
        this.numberControl1.updatePositions(this.posX + 25, this.posY + 100, this.width - 50);
        this.numberControl2.updatePositions(this.posX + 25, this.posY + 150, this.width - 50);
        this.numberControl3.updatePositions(this.posX + 25, this.posY + 200, this.width - 50);
        this.numberControl4.updatePositions(this.posX + 25, this.posY + 250, this.width - 50);
    }    
}

function draw(nodes, ctx) {
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, 512, 512);
    for(const node of nodes) {
        node.draw(ctx);
    }
}

window.addEventListener('load', async () => {

    const container = document.getElementById('canvas');
    container.height = 512;
    container.width = 512;
    const ctx = container.getContext('2d');

    const n = new NumberNode(container, 0, 0);
    const c = new ComplexNode(container, 100, 0);
    const q = new QuaternionNode(container, 150, 0);

    const nodes = [n, c, q];
    
    draw(nodes, ctx);

    let selected = false;
    let diffX = 0;
    let diffY = 0;
    let selectedNode = undefined;

    container.addEventListener('mousedown', (event) => {
        const rect = event.target.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;

        for(const node of nodes) {
            selected = node.isSelected(canvasX, canvasY)
            diffX = canvasX - node.posX;
            diffY = canvasY - node.posY;
            if(selected) {
                selectedNode = node;
                return;
            }
        }
    });

    container.addEventListener('mousemove', (event) => {
        if(selectedNode != undefined) {
            const rect = event.target.getBoundingClientRect();
            const canvasX = event.clientX - rect.left;
            const canvasY = event.clientY - rect.top;
            
            selectedNode.posX = canvasX - diffX;
            selectedNode.posY = canvasY - diffY;
            selectedNode.updateControl();
            draw(nodes, ctx);
        }
    });

    container.addEventListener('mouseup', (event) => {
        selected = false;
        selectedNode = undefined;
    });
});
