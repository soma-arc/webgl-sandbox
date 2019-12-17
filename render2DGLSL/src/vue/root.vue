<template>
<div id="root">
  <canvas id="content" width="512px" height="512px"></canvas><br>
  <input v-model.number="productRenderWidth"
         style="width: 80px;" type="number" min="0"> :
  <input v-model.number="productRenderHeight"
         style="width: 80px;" type="number" min="0">w:h<br>
  <input v-model.number="productRenderMaxSamples"
         style="width: 80px;" type="number" min="0">Samples<br>
  <button @click="startRender">Render</button><br>
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
        startRender: function() {
        }
    }
}
</script>

<style>
</style>
