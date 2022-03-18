# 🐱 OGAR Engine 🐱

**O** ptimized

**G** raphics

**A** dvanced

**R** endering

## Deferred Rendering Engine

**OGAR Engine** is a transformation of [Three.js](https://threejs.org) into a deferred engine. Goal of this project is to give people the option and/or starting point of a deferred shading pipeline, with the familiarity of Three.js friendly API.

**Ogar** 😼 is pronounced as: (https://translate.google.com/?hl=pl&sl=pl&tl=en&text=ogar&op=translate)

⚠️ Under development! Engine not ready for use yet! ⚠️

## View the current examples:
[Basic Scene](https://dolphiniq.github.io/Ogar-Engine/examples/basicScene)
[Phong Material](https://dolphiniq.github.io/Ogar-Engine/examples/phongMaterial)
[Loader/Exporter](https://dolphiniq.github.io/Ogar-Engine/examples/loaderExporter)

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
( For a full working example see `examples/basicScene.html` )
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
const material = new OGAR.GBufferMaterial({ // The only Phong-based supported material for now
    shininess: 25,
    map: diffuseTexture,
    normalMap: normalTexture
});
const mesh = new OGAR.Mesh( geometry, material );
scene.add( mesh );

function animate() { // Inside your animation loop
    ...
    engine.render( scene, camera );
}
```

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

###### 2022 FIRST EVER OGAR ENGINE
