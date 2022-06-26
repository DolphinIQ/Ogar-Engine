# 🐱 OGAR Engine 🐱

**O** ptimized

**G** raphics

**A** dvanced

**R** endering

## Deferred Rendering Engine

**OGAR Engine** is a transformation of [Three.js](https://threejs.org) into a deferred engine. Goal of this project is to give people the option and/or starting point of a deferred shading pipeline, with the familiarity of Three.js friendly API. It is recommended for you to be familiar and comfortable with Three.js API before using Ogar Engine.

**Ogar** 😼 is pronounced as: [google translate pronunciation](https://translate.google.com/?hl=pl&sl=pl&tl=en&text=ogar&op=translate)

⚠️ Under development! Engine not ready for use yet! ⚠️

## View the current examples:
1. [Basic Scene](https://dolphiniq.github.io/Ogar-Engine/examples/basicScene)
2. [Phong Material](https://dolphiniq.github.io/Ogar-Engine/examples/phongMaterial)
3. [Specular Mapping Earth](https://dolphiniq.github.io/Ogar-Engine/examples/specularMapping)
3. [Combining Deferred and Forward Rendering/Transparency](https://dolphiniq.github.io/Ogar-Engine/examples/forwardTransparency)
4. [Thousands of Point Lights](https://dolphiniq.github.io/Ogar-Engine/examples/manyPointLights) (performance benchmarking example)
5. [Loader/Exporter](https://dolphiniq.github.io/Ogar-Engine/examples/loaderExporter)

## How to run the examples locally:
1. Fork the repository
2. Open 2 consoles in the root of the project
3. Run these 2 scripts at the same time:

a) will continuously build the src/Main.js into `dist/` and `examples/dist/`
```
npm run build
```
b) will run a simple http server inside the `examples/` folder. Assumes you have `http-server` package installed globally
```
npm run start
```
4. Navigate to 'http://localhost:8080/' and select an example to run

## 📖 API and Usage so far:
( For a full working example see `examples/basicScene.html` or `examples/phongMaterial.html` )
```js
import { OGAR } from './dist/OGAR.module.js';

const engineOptions = {
    debugger: true
};
const rendererOptions = {
    precision: 'highp',
    stencil: false
};
// Creates a full-screen canvas accessible as engine.canvas
const engine = new OGAR.Engine( document.body, engineOptions, rendererOptions );

const scene = new OGAR.Scene();
const camera = new OGAR.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.5, 1000 );

const geometry = new OGAR.BoxBufferGeometry( 1, 1, 1 );
const material = new OGAR.DeferredMeshPhongMaterial({ // Use a deferred material
    shininess: 25,
    map: diffuseTexture,
    normalMap: normalTexture
});
const mesh = new OGAR.Mesh( geometry, material );

const light = new OGAR.PointLight( 0xffffff, 10, 25, 2 ); // Make sure to add the 'distance' parameter
light.position.set( 3, 5, 2 );
scene.add( mesh, light );

function animate() { // Inside your animation loop
    ...
    engine.render( scene, camera );
}
```
Please note that since this project is a fusion of Three.js and deferred rendering, a lot of API might be mixed together. That is why I decided to keep it all under one `OGAR` namespace to avoid confusion. OGAR relies on a fixed Three.js version (which is planned to keep being updated) and thus alongside it's calsses, it also encapsulates Three.js API whithin it's namespace. You can freely use Three.js API in OGAR, just make sure to use the correct namespace. For example:
```js
const geometry = new OGAR.BoxGeometry();
// ^ is the same in OGAR as:
const geometry = new THREE.BoxGeometry();
// ^ this in Three.js
```
If you see an API not documented in https://threejs.org/docs, it is likely a new Ogar API. For example: `OGAR.DeferredMeshPhongMaterial` or `OGAR.Engine`. A list of new Ogar API and differences from Three.js API will be made once the engine reaches a stable version.

### 🕋 Export and Import binary .ogar files:
(No practical usage yet)
```js
const ogarExporter = new OGAR.OGARExporter();
const ogarLoader = new OGAR.OGARLoader();

const mesh = new OGAR.Mesh( someGeometry, someMaterial );

// Export and save mesh into 'cube.ogar' 3d model
ogarExporter.exportMesh( mesh, 'cube' );

// Load 'cube.ogar' 3d model
ogarLoader.load('cube.ogar')
    .then( ( asset ) => {
        const loadedModel = new OGAR.Mesh( asset.geometry, someMaterial );
        scene.add( loadedModel );
    });
```

### 📝 TO DO List:
- Spotlights
- Skinning
- Shadow Mapping
- Post Processing

__________________________________
###### 2022 FIRST EVER OGAR ENGINE
