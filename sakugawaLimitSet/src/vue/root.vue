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
  </div>
</template>

<script>
  export default {
      props: ['canvas'],
      methods: {
          changeParam: function(event) {
              this.canvas.calcLimitSet();
              this.canvas.render();
          }
      }
  }
</script>
