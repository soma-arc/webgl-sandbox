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
        cross: function(a, b) {
            return [a[1] * b[2] - a[2] * b[1],
                    a[2] * b[0] - a[0] * b[2],
                    a[0] * b[1] - a[1] * b[0]];
        },
        normalize: function(v) {
            const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
            return [v[0]/l, v[1]/l, v[2]/l];
        },
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

                const normals = [];
                for(let i = 0; i < indexes.length; i += 3) {
                    const v1 = [vertexes[indexes[i] * 3],
                                vertexes[indexes[i] * 3 + 1],
                                vertexes[indexes[i] * 3 + 2]];
                    const v2 = [vertexes[indexes[i + 1] * 3],
                                vertexes[indexes[i + 1] * 3 + 1],
                                vertexes[indexes[i + 1] * 3 + 2]];
                    const v3 = [vertexes[indexes[i + 2] * 3],
                                vertexes[indexes[i + 2] * 3 + 1],
                                vertexes[indexes[i + 2] * 3 + 2]];
                    const e1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]]
                    const e2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]]
                    const normal = this.normalize(this.cross(e1, e2));
                    normals.push(normal[0]);
                    normals.push(normal[1]);
                    normals.push(normal[2]);
                }
                console.log(normals);
                
                this.canvasHandler.setVertexesAndIndexes(vertexes, indexes, normals);
            }
            reader.addEventListener('load', fileLoad.bind(this));
            reader.readAsText(file);
        }
    }
}
</script>
