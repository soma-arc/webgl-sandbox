import Rete from "rete";
import ConnectionPlugin from 'rete-connection-plugin';
import VueRenderPlugin from 'rete-vue-render-plugin';

const numSocket = new Rete.Socket('Number value');

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
  constructor() {
    super('Number');
  }

  builder(node) {
    let out = new Rete.Output('num', 'Number', numSocket);

    node.addOutput(out);
  }

  worker(node, inputs, outputs) {
    outputs['num'] = node.data.num;
  }
}

window.addEventListener('load', async () => {
    const container = document.getElementById('rete');
    container.height = 512;
    container.width = 512;
    const editor = new Rete.NodeEditor('demo@0.1.0', container);

    editor.use(ConnectionPlugin)
    editor.use(VueRenderPlugin)

    const numComponent = new NumComponent();
    editor.register(numComponent);

    const engine = new Rete.Engine('demo@0.1.0');
    engine.register(numComponent);

    const n1 = await numComponent.createNode({num: 2});
    n1.position = [80, 200];
    const n2 = await numComponent.createNode({num: 0});
    n2.position = [80, 400];

    editor.addNode(n1);
    editor.addNode(n2);

    editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
        await engine.abort();
        await engine.process(editor.toJSON());
    });

    console.log(editor.toJSON());
    editor.view.resize();
    editor.trigger('process');
});
