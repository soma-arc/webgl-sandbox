import Rete from "rete";
import ConnectionPlugin from 'rete-connection-plugin';
import VueRenderPlugin from 'rete-vue-render-plugin';
import ContextMenuPlugin from 'rete-context-menu-plugin'
import AreaPlugin from 'rete-area-plugin';
import CommentPlugin from 'rete-comment-plugin';
import HistoryPlugin from 'rete-history-plugin';
//import ConnectionMasteryPlugin from 'rete-connection-mastery-plugin';

const numSocket = new Rete.Socket('Number value');

const VueNumControl = {
    props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
    template: '<input type="number" :readonly="readonly" :value="value" @input="change($event)" @dblclick.stop="" @pointermove.stop=""/>',
    data: function() {
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
    mounted: function() {
        this.value = this.getData(this.ikey);
    }
}

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

class NumComponent extends Rete.Component {

    constructor(){
        super("Number");
    }

    builder(node) {
        const out1 = new Rete.Output('num', "Number", numSocket);

        return node.addControl(new NumControl(this.editor, 'num')).addOutput(out1);
    }

    worker(node, inputs, outputs) {
        outputs['num'] = node.data.num;
    }
}

class AddComponent extends Rete.Component {
    constructor(){
        super("Add");
    }

    builder(node) {
        const inp1 = new Rete.Input('num1',"Number", numSocket);
        const inp2 = new Rete.Input('num2', "Number2", numSocket);
        const out = new Rete.Output('num', "Number", numSocket);

        inp1.addControl(new NumControl(this.editor, 'num1'))
        inp2.addControl(new NumControl(this.editor, 'num2'))

        return node
            .addInput(inp1)
            .addInput(inp2)
            .addControl(new NumControl(this.editor, 'preview', true))
            .addOutput(out);
    }

    worker(node, inputs, outputs) {
        const n1 = inputs['num1'].length?inputs['num1'][0]:node.data.num1;
        const n2 = inputs['num2'].length?inputs['num2'][0]:node.data.num2;
        const sum = n1 + n2;
        
        this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(sum);
        outputs['num'] = sum;
    }
}

// class ComplexComponent extends Rete.Component {
//     constructor() {
//         super('Complex');
//     }

//     builder(node) {
//         const out = new Rete.Output('num', 'Complex', complexSocket);

//         node.addOutput(out);
//     }

//     worker(node, inputs, outputs) {
//         outputs['num'] = node.data.num;
//     }
// }

window.addEventListener('load', async () => {
    const container = document.querySelector('#rete');
    container.style.height = 512 + 'px';
    container.style.width = 512 + 'px';
    const editor = new Rete.NodeEditor('demo@0.1.0', container);

    editor.use(ConnectionPlugin);
    editor.use(VueRenderPlugin);
    let readyMenu = [10, 12, 14];
    let dontHide = ['click'];
    editor.use(ContextMenuPlugin);
    editor.use(AreaPlugin);
    editor.use(CommentPlugin);
    editor.use(HistoryPlugin);
//    editor.use(ConnectionMasteryPlugin.default);

    const numComponent = new NumComponent();
    const addComponent = new AddComponent();

    const engine = new Rete.Engine('demo@0.1.0');

    editor.register(numComponent);
    engine.register(numComponent);
    editor.register(addComponent);
    engine.register(addComponent);

    const n1 = await numComponent.createNode({num: 2});
    n1.position = [80, 200];
    const n2 = await numComponent.createNode({num: 0});
    n2.position = [80, 400];
    const add = await addComponent.createNode();
    add.position = [500, 240];

    editor.addNode(n1);
    editor.addNode(n2);
    editor.addNode(add);

    editor.connect(n1.outputs.get('num'), add.inputs.get('num1'));
    editor.connect(n2.outputs.get('num'), add.inputs.get('num2'));

    editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
        await engine.abort();
        await engine.process(editor.toJSON());
    });

    console.log(editor.toJSON());
    editor.view.resize();
    editor.trigger('process');
});
