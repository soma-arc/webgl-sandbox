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
    constructor(parentNode, n, inout, x, y) {
        this.parentNode = parentNode;
        this.index = n;
        this.inout = inout;
        this.posX = x;
        this.posY = y;

        this.socketRadius = 10;
    }

    setPosition(x, y) {
        this.posX = x;
        this.posY = y;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = "rgb(0, 200, 0)";
        ctx.arc(this.posX, this.posY, this.socketRadius,
                0, 2 * Math.PI, true);
        ctx.fill();
    }

    isSelected(x, y) {
        const dx = this.posX - x;
        const dy = this.posY - y;
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

    setPosition(x, y, width) {
        this.input.style.left = x +'px';
	    this.input.style.top = y +'px';
	    this.input.style.width = width +'px';
    }

    getValue() {
        return this.input.value;
    }
}

class Node {
    constructor(canvas, x, y, numInputs, numOutputs, title) {
        this.canvas = canvas;
        this.posX = x;
        this.posY = y;
        this.numInputs = numInputs;
        this.numOutputs = numOutputs;
        this.title = title;

        this.inputSockets = [];
        this.outputSockets = [];

        this.width = 150;
        this.height = 100 + numInputs * 50;
        
        for(let i = 0; i < this.numInputs; i++) {
            this.inputSockets.push(new Socket(this, i, Socket.SOCKET_INPUT,
                                              this.posX, this.posY + 100 + i * 50));
        }
        for(let i = 0; i < this.numOutputs; i++) {
            this.outputSockets.push(new Socket(this, i, Socket.SOCKET_OUTPUT,
                                               this.posX + this.width, this.posY + 50 + i * 50));
        }

    }

    draw(ctx) {
        ctx.fillStyle = "rgb(200, 0, 0)";
        ctx.fillRect(this.posX, this.posY,
                     this.width, this.height);

        for(let socket of this.inputSockets) {
            socket.draw(ctx);
        }

        for(let socket of this.outputSockets) {
            socket.draw(ctx);
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
        for(let socket of this.inputSockets) {
            if(socket.isSelected(x, y)) {
                return socket;
            }
        }
        for(let socket of this.outputSockets) {
            if(socket.isSelected(x, y)) {
                return socket;
            }
        }

        return undefined;
    }

    updateControl() {}

    getValue() {
        return undefined;
    }

    setPosition(x, y) {
        this.posX = x;
        this.posY = y;
        this.updateControl();

        let i = 0;
        for(let socket of this.inputSockets) {
            socket.setPosition(this.posX, this.posY + 100 + i * 50);
            i++;
        }
        i = 0;
        for(let socket of this.outputSockets) {
            socket.setPosition(this.posX + this.width, this.posY + 50 + i * 50);
            i++;
        }
    }
}

class NumberNode extends Node {
    constructor(canvas, x, y) {
        super(canvas, x, y, 1, 1, "Real Number");

        this.numberControl = new NumberControl();
        this.updateControl();
    }

    updateControl() {
        this.numberControl.setPosition(this.posX + 25, this.posY + 100, this.width - 50);
    }

    getValue() {
        return this.numberControl.getValue();
    }
}

class ComplexNode extends Node {
    constructor(canvas, x, y) {
        super(canvas, x, y, 2, 1, "Complex");

        this.numberControl1 = new NumberControl();
        this.numberControl2 = new NumberControl();
        this.updateControl();

    }

    updateControl() {
        this.numberControl1.setPosition(this.posX + 25, this.posY + 100, this.width - 50);
        this.numberControl2.setPosition(this.posX + 25, this.posY + 150, this.width - 50);
    }

    getValue() {
        return new Complex(this.numberControl1.getValue(),
                           this.numberControl2.getValue());
    }
}

class QuaternionNode extends Node {
     constructor(canvas, x, y) {
         super(canvas, x, y, 4, 1, "Quaternion");

        this.numberControl1 = new NumberControl();
        this.numberControl2 = new NumberControl();
        this.numberControl3 = new NumberControl();
        this.numberControl4 = new NumberControl();
        this.updateControl();
    }

    updateControl() {
        this.numberControl1.setPosition(this.posX + 25, this.posY + 100, this.width - 50);
        this.numberControl2.setPosition(this.posX + 25, this.posY + 150, this.width - 50);
        this.numberControl3.setPosition(this.posX + 25, this.posY + 200, this.width - 50);
        this.numberControl4.setPosition(this.posX + 25, this.posY + 250, this.width - 50);
    }
}

const MOUSE_STATE_NONE = 0;
const MOUSE_STATE_CLICK_SOCKET = 1;
const MOUSE_STATE_DRAG_BODY = 2;
const connectedNodes = [];

let mouseState = {state: MOUSE_STATE_NONE,
                  selectedNode: undefined,
                  selectedSocket: undefined,
                  diffX: 0,
                  diffY: 0};

function draw(nodes, ctx, x, y) {
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, 512, 512);
    
    if (mouseState.state === MOUSE_STATE_CLICK_SOCKET &&
        mouseState.selectedSocket != undefined) {
        ctx.fillStyle = "rgb(0, 0, 0)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(mouseState.selectedSocket.posX, mouseState.selectedSocket.posY);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    // for(const pair of connectedNodes) {
    //     ctx.lineWidth = 5;
    //     ctx.beginPath();
    //     ctx.moveTo(pair[0][3], pair[0][4]);
    //     ctx.lineTo(pair[1][3], pair[1][4]);
    //     ctx.stroke();
    // }

    for(const node of nodes) {
        node.draw(ctx);
    }
}

const connections = [];

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

        for(const node of nodes) {
            const socket = node.selectSocket(canvasX, canvasY)
            if (socket != undefined &&
                mouseState.state === MOUSE_STATE_CLICK_SOCKET ) {
                mouseState.state = MOUSE_STATE_NONE;
                console.log('connect');
            } else if(socket != undefined) {
                mouseState.state = MOUSE_STATE_CLICK_SOCKET;
                mouseState.selectedSocket = socket;
                break;
            } else if (socket === undefined &&
                       mouseState.state === MOUSE_STATE_CLICK_SOCKET) {
                mouseState.selectedSocket = undefined;
                mouseState.state = MOUSE_STATE_NONE;
            }  else if (node.isSelected(canvasX, canvasY)) {
                mouseState.diffX = canvasX - node.posX;
                mouseState.diffY = canvasY - node.posY;
                mouseState.selectedNode = node;
                mouseState.state = MOUSE_STATE_DRAG_BODY;
                break;
            }
        }
        draw(nodes, ctx, canvasX, canvasY);
    });

    container.addEventListener('mousemove', (event) => {
        const rect = event.target.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        if(mouseState.selectedNode != undefined) {
            mouseState.selectedNode.setPosition(canvasX - mouseState.diffX,
                                                canvasY - mouseState.diffY);
            draw(nodes, ctx, 0, 0);
        } else if (mouseState.selectedSocket != undefined) {
            draw(nodes, ctx, canvasX, canvasY);
        }
    });

    container.addEventListener('mouseup', (event) => {
        mouseState.selectedNode = undefined;
    });

    container.addEventListener('mouseleave', (event) => {
        mouseState.selectedNode = undefined;
    });
});
