const fs = require('fs');

// While preferred to avoid, it is sometimes necessary to edit three.js source code. To avoid fixed three.js version,
// we install dependencies and then run this script to edit three.module.js, that OGAR puts into its build.
const EDITS = [
    {
        // This edit prevents the 'setupView()' function from running during scene render.
        // It updates light uniforms in the shaders, but puts them in camera space.
        // OGAR uses Engine.#_updateLightUniformsForFinalShader() to do it while keeping the lights in world space.
        line: `function setupView( lights, camera ) {`,
        replacement: `function setupView( lights, camera ) {
            if ( camera.isOgar ) return;`
    }
];

const pathToThreeJs = 'node_modules/three/build/three.module.js';

function main() {

    console.log('Started updating three.js...');

    let threejs = fs.readFileSync( pathToThreeJs, { encoding: 'utf-8' } );
    console.log('Finished reading three.js');

    for ( const edit of EDITS ) {
        threejs = threejs.replace( edit.line, edit.replacement );
    }

    fs.writeFileSync( pathToThreeJs, threejs, { encoding: 'utf-8' } );
    console.log('Finished editing three.js!');
}

main();