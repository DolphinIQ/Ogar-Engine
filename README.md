# 🐱 OGAR Engine 🐱

**O** ptimized

**G** raphics

**A** dvanced

**R** endering

## [ECS](https://en.wikipedia.org/wiki/Entity_component_system) Deferred Rendering Engine

**Ogar** 😼 is pronounced as: https://translate.google.com/?hl=pl&sl=pl&tl=en&text=ogar&op=translate

⚠️ Engine not ready for use yet ⚠️

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

## 📖 API so far:
```js
import * as OGAR from './dist/OGAR.module.js';

const engine = new OGAR.Engine();
engine.init( document.body );
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
