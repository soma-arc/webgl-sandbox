import Rete from "rete";
import ConnectionPlugin from 'rete-connection-plugin';
import VueRenderPlugin from 'rete-vue-render-plugin';
import ContextMenuPlugin from 'rete-context-menu-plugin';
import AreaPlugin from 'rete-area-plugin';
import CommentPlugin from 'rete-comment-plugin';
import HistoryPlugin from 'rete-history-plugin';
import Vue from 'vue/dist/vue.esm'
import TaskPlugin from 'rete-task-plugin';

//------

var numSocket = new Rete.Socket('Number value');
const msgSocket = new Rete.Socket('String message');

var VueNumControl = Vue.component('num', {
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
})

var VueMsgControl = Vue.component('string', {
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
})

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

window.addEventListener('load', async () => {
    var container = document.querySelector('#rete');
    var components = [new NumComponent(), new AddComponent(),
                      new MsgComponent(), new AddStrComponent()];
    
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

    var n1 = await components[0].createNode({num: 2});
    var n2 = await components[0].createNode({num: 0});
    var add = await components[1].createNode();
    var msg = await components[2].createNode({msg: "hoge"});
    var addMsg = await components[3].createNode();
    
    
    n1.position = [80, 200];
    n2.position = [80, 400];
    add.position = [500, 240];
    msg.position = [500, 300];
 

    editor.addNode(n1);
    editor.addNode(n2);
    editor.addNode(add);
    editor.addNode(msg);
    editor.addNode(addMsg);

    editor.connect(n1.outputs.get('num'), add.inputs.get('num1'));
    editor.connect(n2.outputs.get('num'), add.inputs.get('num2'));


    editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
      console.log('process');
        await engine.abort();
        await engine.process(editor.toJSON());
    });

    editor.view.resize();
    AreaPlugin.zoomAt(editor);
    editor.trigger('process');
});



