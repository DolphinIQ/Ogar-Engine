# 🐱 OGAR Engine 🐱

**O** ptimized

**G** raphics

**A** dvanced

**R** endering

## [ECS](https://en.wikipedia.org/wiki/Entity_component_system) Deferred Rendering Engine

**Ogar** 😼 is pronounced as: https://translate.google.com/?hl=pl&sl=pl&tl=en&text=ogar&op=translate

⚠️ Under development! Engine not ready for use yet! ⚠️

## How to run the examples:
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
```js
import * as OGAR from './dist/OGAR.module.js';

// Creates a full-screen canvas accessible as engine.canvas
const engine = new OGAR.Engine();
engine.init( document.body );

const scene = new OGAR.THREE.Scene();
const camera = new OGAR.THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.5, 1000 );

const geometry = new OGAR.THREE.BoxBufferGeometry( 1, 1, 1 );
const material = new OGAR.gBufferMaterial({ // The only supported material for now
    ['uCameraNear']: { value: camera.near }, // Required
    ['uCameraFar']: { value: camera.far }, // Required
    ['tDiffuse']: { value: diffuseTexture } // Optional
});
const mesh = new OGAR.THREE.Mesh( geometry, material );
scene.add( mesh );

function animate() { // Your loop
    engine.render( scene, camera );
    requestAnimationFrame( animate );
}
```

### 🕋 Export and Import binary .ogar files:
```js
const ogarExporter = new OGAR.OGARExporter();
const ogarLoader = new OGAR.OGARLoader();

const mesh = new THREE.Mesh( someGeometry, someMaterial );

// Export and save mesh into 'cube.ogar' 3d model
ogarExporter.exportMesh( mesh, 'cube' );

// Load 'cube.ogar' 3d model
ogarLoader.load('cube.ogar')
    .then( ( asset ) => {
        const loadedModel = new THREE.Mesh( asset.geometry, someMaterial );
        engine.scene.add( loadedModel );
    });
```

###### FIRST EVER OGAR ENGINE
