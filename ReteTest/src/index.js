import Rete from "rete";
import ConnectionPlugin from 'rete-connection-plugin';
import VueRenderPlugin from 'rete-vue-render-plugin';
import ContextMenuPlugin from 'rete-context-menu-plugin';
import AreaPlugin from 'rete-area-plugin';
import CommentPlugin from 'rete-comment-plugin';
import HistoryPlugin from 'rete-history-plugin';
import Vue from 'vue/dist/vue.esm'
import TaskPlugin from 'rete-task-plugin';
import Complex from './complex.js';
import {GetWebGL2Context} from './glUtils.js';
import Canvas2d from './canvas2d.js';
//------

const numSocket = new Rete.Socket('Number value');
const msgSocket = new Rete.Socket('String message');
const complexSocket = new Rete.Socket('Complex number');
const shapeSocket = new Rete.Socket('Shape');
const reflectorsSocket = new Rete.Socket('reflections');
const seedSocket = new Rete.Socket('seed');

const VueNumControl = Vue.component('num', {
  props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
  template: '<input type="number" :readonly="readonly" :value="value" @input="change($event)" @dblclick.stop="" @pointermove.stop=""/>',
  data() {
    return {
      value: 0,
    }
  },
  methods: {
    change(e){
      this.value = +e.target.value;
      this.update();
    },
    update() {
      if (this.ikey)
        this.putData(this.ikey, this.value)
      this.emitter.trigger('process');
    }
  },
  mounted() {
    this.value = this.getData(this.ikey);
  }
});

const VueMsgControl = Vue.component('string', {
    props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
    template: '<input type="text" :readonly="readonly"  :value="value" @input="change($event)"/>',
    data() {
        return {
            value: "",
        }
    },
    methods: {
        change(e){
            this.value = e.target.value;
            this.update();
        },
        update() {
            if (this.ikey)
                this.putData(this.ikey, this.value)
            this.emitter.trigger('process');
        }
    },
    mounted() {
        this.value = this.getData(this.ikey);
    }
});

const VueComplexControl = Vue.component('string', {
    props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
    template: '<input type="number" :readonly="readonly" :value="real" @input="changeReal($event)"/>'+
        '<input type="number" :readonly="readonly" :value="image" @input="changeImage($event)"/>',
    data() {
        return {
            real: 0,
            image: 0
        }
    },
    methods: {
        changeReal(e){
            this.real = e.target.value;
            this.update();
        },
        changeImage(e){
            this.image = e.target.value;
            this.update();
        },
        update() {
            if (this.ikey)
                this.putData(this.ikey, this.value)
            this.emitter.trigger('process');
        }
    },
    mounted() {
        this.value = this.getData(this.ikey);
    }
});

class NumControl extends Rete.Control {

  constructor(emitter, key, readonly) {
    super(key);
    this.component = VueNumControl;
    this.props = { emitter, ikey: key, readonly };
  }

  setValue(val) {
    this.vueContext.value = val;
  }
}

class MsgControl extends Rete.Control {

  constructor(emitter, key, readonly) {
    super(key);
    this.component = VueMsgControl;
    this.props = { emitter, ikey: key, readonly };
  }

  setValue(val) {
    this.vueContext.value = val;
  }
}

class MsgComponent extends Rete.Component {

    constructor(){
        super("String");
    }

    builder(node) {
        const out1 = new Rete.Output('msg', 'String', msgSocket);
        return node.addControl(new MsgControl(this.editor, 'msg')).addOutput(out1);
    }

    worker(node, inputs, outputs) {
        outputs['msg'] = node.data.msg;
    }
}

class NumComponent extends Rete.Component {

    constructor(){
        super("Number");
    }

    builder(node) {
        var out1 = new Rete.Output('num', "Number", numSocket);

        return node.addControl(new NumControl(this.editor, 'num')).addOutput(out1);
    }

    worker(node, inputs, outputs) {
        outputs['num'] = node.data.num;
    }
}

class ComplexComponent extends Rete.Component {
    constructor() {
        super("Complex");
    }

    builder(node) {
        const inp1 = new Rete.Input('real',"Real", numSocket);
        const inp2 = new Rete.Input('image', "Image", numSocket);
        const out = new Rete.Output('complex', "Complex", complexSocket);

        inp1.addControl(new NumControl(this.editor, 'real'))
        inp2.addControl(new NumControl(this.editor, 'image'))

        return node
            .addInput(inp1)
            .addInput(inp2)
            .addControl(new NumControl(this.editor, 'preview', true))
            .addControl(new NumControl(this.editor, 'preview2', true))
            .addOutput(out);
    }

    worker(node, inputs, outputs) {
        const n1 = inputs['real'].length?inputs['real'][0]:node.data.real;
        const n2 = inputs['image'].length?inputs['image'][0]:node.data.image;
        const c = new Complex(n1, n2);
        
        this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(n1);
        this.editor.nodes.find(n => n.id == node.id).controls.get('preview2').setValue(n2);
        outputs['complex'] = c;
    }
}

class AddComponent extends Rete.Component {
    constructor(){
        super("Add");
    }

    builder(node) {
        var inp1 = new Rete.Input('num1',"Number", numSocket);
        var inp2 = new Rete.Input('num2', "Number2", numSocket);
        var out = new Rete.Output('num', "Number", numSocket);

        inp1.addControl(new NumControl(this.editor, 'num1'))
        inp2.addControl(new NumControl(this.editor, 'num2'))

        return node
            .addInput(inp1)
            .addInput(inp2)
            .addControl(new NumControl(this.editor, 'preview', true))
            .addOutput(out);
    }

    worker(node, inputs, outputs) {
        var n1 = inputs['num1'].length?inputs['num1'][0]:node.data.num1;
        var n2 = inputs['num2'].length?inputs['num2'][0]:node.data.num2;
        var sum = n1 + n2;
        
        this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(sum);
        outputs['num'] = sum;
    }
}

class AddStrComponent extends Rete.Component {
    constructor(){
        super("Add String");
    }

    builder(node) {
        var inp1 = new Rete.Input('msg1',"String", msgSocket);
        var inp2 = new Rete.Input('msg2', "String2", msgSocket);
        var out = new Rete.Output('msg', "String", msgSocket);

        inp1.addControl(new MsgControl(this.editor, 'msg1'))
        inp2.addControl(new MsgControl(this.editor, 'msg2'))

        return node
            .addInput(inp1)
            .addInput(inp2)
            .addControl(new MsgControl(this.editor, 'previewStr', true))
            .addOutput(out);
    }

    worker(node, inputs, outputs) {
        var n1 = inputs['msg1'].length?inputs['msg1'][0]:node.data.msg1;
        var n2 = inputs['msg2'].length?inputs['msg2'][0]:node.data.msg2;
        if(n2 === undefined) n2 = "";
        if(n1 === undefined) n1 = "";
        var sum = n1 + n2;
        
        this.editor.nodes.find(n => n.id == node.id).controls.get('previewStr').setValue(sum);
        outputs['msg'] = sum;
    }
}

class Circle {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
    }
}

class CircleComponent extends Rete.Component {
    constructor() {
        super("Circle");
    }

    builder(node) {
        const inp1 = new Rete.Input('centerX',"X", numSocket);
        const inp2 = new Rete.Input('centerY', "Y", numSocket);
        const inp3 = new Rete.Input('radius', "R", numSocket);
        const out = new Rete.Output('shape', "Shape", shapeSocket);

        inp1.addControl(new NumControl(this.editor, 'centerX'));
        inp2.addControl(new NumControl(this.editor, 'centerY'));
        inp3.addControl(new NumControl(this.editor, 'radius'));
        return node
            .addInput(inp1)
            .addInput(inp2)
            .addInput(inp3)
            .addOutput(out);
    }

    worker(node, inputs, outputs) {
        const n1 = inputs['centerX'].length?inputs['centerX'][0]:node.data.centerX;
        const n2 = inputs['centerY'].length?inputs['centerY'][0]:node.data.centerY;
        const n3 = inputs['radius'].length?inputs['radius'][0]:node.data.centerY;
        
        //this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(n1);
        //this.editor.nodes.find(n => n.id == node.id).controls.get('preview2').setValue(n2);
        outputs['shape'] = new Circle(n1, n2, n3);
    }
}

class HalfPlane {
    constructor(x, y, normalX, normalY) {
        this.x = x;
        this.y = y;
        this.normalX = normalX;
        this.normalY = normalY;
    }
}

class HalfPlaneComponent extends Rete.Component {
    constructor() {
        super('HalfPlane');
    }

    builder(node) {
        const inp1 = new Rete.Input('originX', "X", numSocket);
        const inp2 = new Rete.Input('originY', "Y", numSocket);
        const inp3 = new Rete.Input('normalX', "NormalX", numSocket);
        const inp4 = new Rete.Input('normalY', "NormalY", numSocket);
        const out = new Rete.Output('shape', "Shape", shapeSocket);

        inp1.addControl(new NumControl(this.editor, 'originX'));
        inp2.addControl(new NumControl(this.editor, 'originY'));
        inp3.addControl(new NumControl(this.editor, 'normalX'));
        inp4.addControl(new NumControl(this.editor, 'normalY'));
        return node
            .addInput(inp1)
            .addInput(inp2)
            .addInput(inp3)
            .addInput(inp4)
            .addOutput(out);
    }

    worker(node, inputs, outputs) {
        const n1 = inputs['originX'].length?inputs['originX'][0]:node.data.centerX;
        const n2 = inputs['originY'].length?inputs['originY'][0]:node.data.centerY;
        const n3 = inputs['normalX'].length?inputs['normalX'][0]:node.data.normalX;
        const n4 = inputs['normalY'].length?inputs['normalY'][0]:node.data.normalY;
        
        //this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(n1);
        //this.editor.nodes.find(n => n.id == node.id).controls.get('preview2').setValue(n2);
        outputs['shape'] = new HalfPlane(n1, n2, n3, n4);
    }
}

class RenderComponent extends Rete.Component {
    constructor() {
        super('Render');
    }

    builder(node) {
        const inp1 = new Rete.Input('shape1', "Shape1", shapeSocket);
        const inp2 = new Rete.Input('shape2', "Shape2", shapeSocket);
        const inp3 = new Rete.Input('shape3', "Shape3", shapeSocket);
        const inp4 = new Rete.Input('shape4', "Shape4", shapeSocket);

        return node
            .addInput(inp1)
            .addInput(inp2)
            .addInput(inp3)
            .addInput(inp4)
    }

    worker(node, inputs, outputs) {
        const n1 = inputs['shape1'].length?inputs['shape1'][0]:node.data.shape1;
        const n2 = inputs['shape2'].length?inputs['shape2'][0]:node.data.shape2;
        const n3 = inputs['shape3'].length?inputs['shape3'][0]:node.data.shape3;
        const n4 = inputs['shape4'].length?inputs['shape4'][0]:node.data.shape4;
        
        //this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(n1);
        //this.editor.nodes.find(n => n.id == node.id).controls.get('preview2').setValue(n2);
        //outputs['shape'] = new HalfPlane(n1, n2, n3, n4);
    }
}

class ReflectionRenderComponent extends Rete.Component {
    constructor() {
        super('ReflectionRender');
    }

    builder(node) {
        const inp1 = new Rete.Input('reflectors', "Reflectors", reflectorsSocket);
        const inp2 = new Rete.Input('seed', "Seed", seedSocket);
        
        return node
            .addInput(inp1)
            .addInput(inp2)
    }

    worker(node, inputs, outputs) {
        const n1 = inputs['reflectors'].length?inputs['reflectors'][0]:node.data.reflectors;
        const n2 = inputs['seed'].length?inputs['seed'][0]:node.data.seed;
    }
}

class ReflectorsComponent extends Rete.Component {
    constructor() {
        super('Reflectors');
    }

    builder(node) {
        const inp1 = new Rete.Input('reflector1', "Reflector1", shapeSocket);
        const inp2 = new Rete.Input('reflector2', "Reflector2", shapeSocket);
        const inp3 = new Rete.Input('reflector3', "Reflector3", shapeSocket);
        const inp4 = new Rete.Input('reflector4', "Reflector4", shapeSocket);
        const out = new Rete.Output('reflectors', "Reflectors", reflectorsSocket);
        
        return node
            .addInput(inp1)
            .addInput(inp2)
            .addInput(inp3)
            .addInput(inp4)
            .addOutput(out);
    }

    worker(node, inputs, outputs) {
        const n1 = inputs['reflector1'].length?inputs['reflector1'][0]:node.data.reflector1;
        const n2 = inputs['reflector2'].length?inputs['reflector2'][0]:node.data.reflector2;
        const n3 = inputs['reflector3'].length?inputs['reflector3'][0]:node.data.reflector3;
        const n4 = inputs['reflector4'].length?inputs['reflector4'][0]:node.data.reflector4;
        
        outputs['reflectors'] = [n1, n2, n3, n4];
    }
}

window.addEventListener('load', async () => {
    var container = document.querySelector('#rete');
    var components = [new NumComponent(), new AddComponent(),
                      new MsgComponent(), new AddStrComponent(),
                      new ComplexComponent(), new CircleComponent(),
                      new HalfPlaneComponent(), new RenderComponent(),
                      new ReflectorsComponent(), new ReflectionRenderComponent()];
    
    var editor = new Rete.NodeEditor('demo@0.1.0', container);
    editor.use(ConnectionPlugin);
    editor.use(VueRenderPlugin);    
    let readyMenu = [10, 12, 14];
    let dontHide = ['click'];
    editor.use(ContextMenuPlugin);
    editor.use(AreaPlugin);
    editor.use(CommentPlugin);
    editor.use(HistoryPlugin);
//    editor.use(ConnectionMasteryPlugin);

    var engine = new Rete.Engine('demo@0.1.0');
    
    components.map(c => {
        editor.register(c);
        engine.register(c);
    });

    const n1 = await components[0].createNode({num: 2});
    const n2 = await components[0].createNode({num: 0});
    const add = await components[1].createNode();
    const renderComponent = await components[7].createNode();
    console.log(n1);
    n1.position = [80, 200];
    n2.position = [80, 400];
    add.position = [500, 240];
 

    editor.addNode(n1);
    editor.addNode(n2);
    editor.addNode(add);
    editor.addNode(renderComponent);

    editor.connect(n1.outputs.get('num'), add.inputs.get('num1'));
    editor.connect(n2.outputs.get('num'), add.inputs.get('num2'));


    editor.on('nodecreated noderemoved connectionremoved', async () => {
        console.log('process');
        await engine.abort();
        await engine.process(editor.toJSON());
    });

    editor.view.resize();
    AreaPlugin.zoomAt(editor);
    editor.trigger('process');

    const canvas2d = new Canvas2d('constructionPanel');
    const fragmentShaderData = {numCircles: 0,
                                numHalfPlanes: 0};
    
    editor.on('process connectioncreated', async () => {
        await engine.abort();
        await engine.process(editor.toJSON());

        const data = editor.toJSON();
        console.log('log');
        console.log(data);
        fragmentShaderData['numCircles'] = 0;
        fragmentShaderData['numHalfPlanes'] = 0;
        for(let i in data.nodes) {
            const nodeName = data.nodes[i].name
            console.log(nodeName);
            if(nodeName === 'Circle'){
                console.log('circle');
                console.log(data.nodes[i]);
                console.log(data.nodes[i].data);
                console.log(data.nodes[i].outputs.shape.connections)
                fragmentShaderData['circle'+ fragmentShaderData['numCircles']] = data.nodes[i].data
                fragmentShaderData['numCircles']++;
            } else if (nodeName === 'HalfPlane') {
                console.log('HalfPlane');
                console.log(data.nodes[i]);
                console.log(data.nodes[i].data);
                console.log(data.nodes[i].outputs.shape.connections)
                fragmentShaderData['halfPlane'+ fragmentShaderData['numHalfPlanes']] = data.nodes[i].data
                fragmentShaderData['numHalfPlanes']++;
            } else if(nodeName === 'Render' || nodeName === 'ReflectionRender') {
                console.log('Render log');
                console.log(data.nodes[i]);
            }
        }
        canvas2d.compileRenderShader(fragmentShaderData);
        canvas2d.render();
    });
    
    canvas2d.render();
});
