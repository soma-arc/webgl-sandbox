import {SimpleDropzone} from 'simple-dropzone';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

window.addEventListener('load', () => {
    console.log('hello');

    const dropEl = document.getElementById('dropdiv');
    dropEl.style = 'background:gray;';
    const inputEl = document.createElement('input');
    inputEl.type = 'file';
    inputEl.setAttribute('multiple', true);

    const canvas = document.getElementById('canvas');
    const renderer = new THREE.WebGL1Renderer({
        canvas: canvas
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.width, canvas.height);

    // シーンを作成
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(90, canvas.width / canvas.height, 0.1, 10000);
    camera.position.set(3, 1, 1);
    const controls = new OrbitControls(camera, renderer.domElement);

    // ライトの作成
    const light = new THREE.DirectionalLight(0xefefef, 2);
    light.position.set(1, 5, 5).normalize();
    scene.add(light);
    const amblight = new THREE.AmbientLight(0xFFFFFF, 1.0);
    scene.add(amblight);

    const axes = new THREE.AxesHelper(1);
    scene.add(axes);
    
    const tick = () => {
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    };
    tick();


    const dropCtrl = new SimpleDropzone(dropEl, inputEl);
    dropCtrl.on('drop', ({files}) => {
        console.log(files);
        for(const key of files.keys()) {
            const extension = key.split('.').at(-1);
            if(extension === 'json') {
                console.log(files.get(key));
                const reader = new FileReader();
                reader.onload = function (event) {
                    const data = JSON.parse(event.target.result);
                    console.log(data);
                    const box = new THREE.Box3();
                    box.setFromCenterAndSize(new THREE.Vector3(data['center'][0], data['center'][1], data['center'][2]),
                                             new THREE.Vector3(data['size'][0], data['size'][1], data['size'][2]));

                    const helper = new THREE.Box3Helper(box, 0xffff00);
                    scene.add(helper);
                };
                reader.readAsText(new Blob([files.get(key)]));
            } else if(extension === 'glb') {
                const blob = new Blob([files.get(key)]);
                const url = URL.createObjectURL(blob);
                const loader = new GLTFLoader();
                loader.load(url, (gltf) => {
                    const pivot = new THREE.Group();
                    //gltf.scene.rotateX(Math.PI / 2.);

                    const box = new THREE.Box3().setFromObject(gltf.scene);
                    const helper = new THREE.Box3Helper( box, 0x0000ff );
                    scene.add(helper);

                    const center = new THREE.Vector3();
                    box.getCenter(center);
                    // console.log(center);

                    // pivot.position.set(center);
                    
                    // console.log(gltf.scene);
                    // for(const object of gltf.scene.children) {
                    //     console.log(object);
                    //     pivot.add(object);
                    // }

                    const m = new THREE.Matrix4();
                    m.makeTranslation(center.multiplyScalar(-1));

                    const r = new THREE.Matrix4();
                    r.makeRotationY(Math.PI / 2);

                    const m2 = new THREE.Matrix4();
                    m2.makeTranslation(center.multiplyScalar(-1));
                    
                    // pivot.rotation.x = Math.PI / 2;
                    //gltf.scene.rotation.x = Math.PI / 2;
                    gltf.scene.applyMatrix4(m);
                    gltf.scene.applyMatrix4(r);
                    gltf.scene.applyMatrix4(m2);
                    
                    const box2 = new THREE.Box3().setFromObject(gltf.scene);
                    const helper2 = new THREE.Box3Helper( box2, 0x0000ff );
                    scene.add(helper2);
                    
                    scene.add(gltf.scene);
                    //console.log(bbox);
                    //const center = new THREE.Vector3();
                    //bbox.getCenter(center);
                });
            }
        }
    });
});
