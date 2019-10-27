<template>
<div>
  <input type="number" v-model.number="canvas.z0" step="0.01"
         style="width: 80px;" @input="changeParam"></input>Z0<br>
  <input type="number" v-model.number="canvas.thetaA" step="0.01"
         style="width: 80px;" @input="changeParam"></input>ThetaA<br>
  <input type="number" v-model.number="canvas.thetaB" step="0.01"
         style="width: 80px;" @input="changeParam"></input>ThetaB<br>
  <input type="number" v-model.number="canvas.maxLevel" step="1"
         style="width: 80px;" @input="changeParam"></input>MaxLevel<br>
  <input type="number" v-model.number="canvas.threshold" step="0.01"
         style="width: 80px;" @input="changeParam"></input>Threshold<br>
  current Generator {{ this.canvas.orbitGenIndex }}<br>
  <button @click="resetOrbit">Reset</button>
  <button @click="applyGen_a">a</button>
  <button @click="applyGen_b">b</button>
  <button @click="applyGen_A">A</button>
  <button @click="applyGen_B">B</button>
</div>
</template>

<script>
export default {
    props: ['canvas'],
    methods: {
        resetOrbit: function() {
            this.canvas.resetOrbit();
        },
        changeParam: function(event) {
            this.canvas.calcLimitSet();
            this.canvas.render();
        },
        applyGen_a: function(event) {
            this.canvas.orbitGenIndex = 1;
            this.resetOrbit();
        },
        applyGen_b: function(event) {
            this.canvas.orbitGenIndex = 2;
            this.resetOrbit();
        },
        applyGen_A: function(event) {
            this.canvas.orbitGenIndex = 3;
            this.resetOrbit();
        },
        applyGen_B: function(event) {
            this.canvas.orbitGenIndex = 4;
            this.resetOrbit();
        }
    }
}
</script>
