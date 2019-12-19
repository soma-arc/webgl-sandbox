<template>
<div>
  <canvas id="canvas" width="512px" height="512px"></canvas><br>
  <input type="file" @change="getFile" />
</div>
</template>

<script>
export default {
    props: ['canvasHandler'],
    methods: {
        getFile: function(event) {
            const target = event.target;
            const file = target.files[0];
            const reader = new FileReader(file);
            function fileLoad() {
                const vertexes = [];
                const [vertexesStr, indexesStr] = reader.result.split(']} coordIndex [');
                const vertexesLines = vertexesStr.split('\n');
                vertexesLines.pop();
                let n = 0;
                for (const line of vertexesLines) {
                    if(n <= 1) {
                        n++;
                        continue;
                    }
                    const result = line.replace(/,/g, '');
                    const vertStr = result.split(' ');
                    vertexes.push(parseFloat(vertStr[0]))
                    vertexes.push(parseFloat(vertStr[1]))
                    vertexes.push(parseFloat(vertStr[2]))
                }
                console.log(vertexes);

                const indexes = [];
                const indexesLines = indexesStr.split('\n');
                indexesLines.pop();
                indexesLines.pop();
                indexesLines.shift();
                for(const line of indexesLines) {
                    const num = line.split(',');
                    indexes.push(parseInt(num[0]));
                    indexes.push(parseInt(num[1]));
                    indexes.push(parseInt(num[2]));
                }
                console.log(indexes);

                this.canvasHandler.setVertexesAndIndexes(vertexes, indexes);
            }
            reader.addEventListener('load', fileLoad.bind(this));
            reader.readAsText(file);
        }
    }
}
</script>
