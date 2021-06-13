# 🐱 OGAR Engine 🐱

**O** ptimized

**G** raphics

**A** dvanced

**R** endering

## [ECS](https://en.wikipedia.org/wiki/Entity_component_system) Deferred Rendering Engine

**Ogar** 😼 is pronounced as: https://translate.google.com/?hl=pl&sl=pl&tl=en&text=ogar&op=translate

Not ready to use yet

## API so far:
```js
import * as OGAR from './dist/OGAR.module.js';

const engine = new OGAR.Engine();
engine.init( document.body );
```

### Export and Import binary .ogar files:
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
