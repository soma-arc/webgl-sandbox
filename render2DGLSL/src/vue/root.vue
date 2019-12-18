<template>
<div id="root">
  <canvas id="canvas" width="512px" height="512px"></canvas><br>
  <input v-model.number="productRenderWidth"
         style="width: 80px;" type="number" min="0"> :
  <input v-model.number="productRenderHeight"
         style="width: 80px;" type="number" min="0">w:h<br>
  <input v-model.number="productRenderMaxSamples"
         style="width: 80px;" type="number" min="0">Samples<br>
  <button @click="startRendering">Render</button><br>
</div>
</template>

<script>
export default {
    props: ['canvasHandler'],
    data: function() {
        return {
            productRenderWidth: 1024,
            productRenderHeight: 1024,
            productRenderMaxSamples: 1,
        }
    },
    methods: {
        startRendering: function() {
            this.canvasHandler.canvas2d.startProductRendering(this.productRenderWidth,
                                                              this.productRenderHeight,
                                                              this.productRenderMaxSamples,
                                                              'image.png');
        }
    }
}
</script>

<style>
</style>
