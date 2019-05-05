import Rete from "rete";
import ConnectionPlugin from 'rete-connection-plugin';
import VueRenderPlugin from 'rete-vue-render-plugin';
import ContextMenuPlugin from 'rete-context-menu-plugin';
import AreaPlugin from 'rete-area-plugin';
import CommentPlugin from 'rete-comment-plugin';
import HistoryPlugin from 'rete-history-plugin';
import Complex from './complex.js';
//import ConnectionMasteryPlugin from 'rete-connection-mastery-plugin';

class Socket {
    constructor(parentNode, n, inout) {
        this.parentNode = parentNode;
        this.index = n;
        this.inout = inout;
        
        this.updatePositions();
        
        this.socketRadius = 10;
    }

    updatePositions() {
        //this.posX = x;
        //this.posY = y;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = "rgb(0, 200, 0)";
        ctx.arc(this.posX, this.posY, this.socketRadius,
                0, 2 * Math.PI, true);
        ctx.fill();
    }

    isSelected(x, y) {
        const dx = posX - x;
        const dy = posY - y;
        if(Math.sqrt(dx * dx + dy * dy) < this.socketRadius) {
            return true;
        }
        return false;
    }

    static get SOCKET_INPUT() {
        return 0;
    }

    static get SOCKET_OUTPUT() {
        return 1;
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

        this.socketRadius = 10;
    }

    draw(ctx) {
        ctx.fillStyle = "rgb(200, 0, 0)";
        ctx.fillRect(this.posX, this.posY,
                     this.width, this.height);

        ctx.beginPath();
        ctx.fillStyle = "rgb(0, 200, 0)";
        ctx.arc(this.posX + this.width, this.posY + 50, this.socketRadius,
                0, 2 * Math.PI, true);
        ctx.fill();

        for(let i = 0; i < this.numInputs; i++) {
            ctx.beginPath();
            ctx.fillStyle = "rgb(0, 200, 0)";
            ctx.arc(this.posX, this.posY + 100 + i * 50, this.socketRadius,
                    0, 2 * Math.PI, true);
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

    selectSocket(x, y) {
        // output
        const dx = this.posX + this.width - x;
        const dy = this.posY + 50 - y;        
        if(Math.sqrt(dx * dx + dy * dy) < this.socketRadius) {
            return [true, 0, Node.SELECT_OUTPUT,
                    this.posX + this.width,
                    this.posY + 50];
        }

        // input
        for(let i = 0; i < this.numInputs; i++) {
            const dx = this.posX - x;
            const dy = this.posY + 100 + i * 50 - y;
            if(Math.sqrt(dx * dx + dy * dy) < this.socketRadius) {
                return [true, i, Node.SELECT_INPUT,
                        this.posX,
                        this.posY + 100 + i * 50];
            }
        }

        return [false, -1, -1];
    }

    getValue() {
        return undefined;
    }

    static get SELECT_INPUT() {
        return 0;
    }

    static get SELECT_OUTPUT() {
        return 1;
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

let selected = false;
let diffX = 0;
let diffY = 0;
let selectedNode = undefined;
const MOUSE_STATE_NONE = 0;
const MOUSE_STATE_CLICK_SOCKET = 1;
let mouseState = MOUSE_STATE_NONE;
let selectedSocket = undefined;
const connectedNodes = [];

function draw(nodes, ctx, x, y) {
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, 512, 512);

    if(mouseState === MOUSE_STATE_CLICK_SOCKET &&
       selectedSocket != undefined) {
        if (selectedSocket[2] === Node.SELECT_INPUT) {
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(selectedSocket[3], selectedSocket[4]);
            ctx.lineTo(x, y);
            ctx.stroke();
        } else if (selectedSocket[2] === Node.SELECT_OUTPUT) {
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(selectedSocket[3], selectedSocket[4]);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }

    for(const pair of connectedNodes) {
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(pair[0][3], pair[0][4]);
        ctx.lineTo(pair[1][3], pair[1][4]);
        ctx.stroke();
    }
    
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
    
    draw(nodes, ctx, 0, 0);
    
    container.addEventListener('mousedown', (event) => {
        const rect = event.target.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        selectedNode = undefined;
        
        for(const node of nodes) {
            const socket = node.selectSocket(canvasX, canvasY);

            if(selectedSocket != undefined &&
               socket[0] != false) {
                console.log('connect');
                mouseState = MOUSE_STATE_NONE;
                connectedNodes.push([socket, selectedSocket]);
                break;
            }
            
            if (socket[0] === true) {
                console.log('click');
                selectedSocket = socket;
                mouseState = MOUSE_STATE_CLICK_SOCKET;
                //selectedNode = node;
                return;
            }
            selected = node.isSelected(canvasX, canvasY)
            diffX = canvasX - node.posX;
            diffY = canvasY - node.posY;
            if(selected) {
                selectedNode = node;
                return;
            }
        }
        selectedSocket = undefined;
        draw(nodes, ctx, 0, 0);
    });

    container.addEventListener('mousemove', (event) => {
        const rect = event.target.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        if(selectedNode != undefined) {
            selectedNode.posX = canvasX - diffX;
            selectedNode.posY = canvasY - diffY;
            selectedNode.updateControl();
            draw(nodes, ctx, 0, 0);
        }

        if(selectedSocket != undefined) {
            draw(nodes, ctx, canvasX, canvasY);
        }
    });

    container.addEventListener('mouseup', (event) => {
        selected = false;
        selectedNode = undefined;
    });

    container.addEventListener('mouseleave', (event) => {
        selected = false;
        selectedNode = undefined;
    });
});

