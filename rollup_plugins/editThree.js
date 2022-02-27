const fs = require('fs');

// While preferred to avoid, it is sometimes necessary to edit three.js source code after build
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

const editThree = ( outputPaths ) => {
    return {
        name: 'edit-three',
        // generateBundle() {
        // writeBundle() {
        closeBundle() {

            outputPaths.forEach( ( path ) => {

                fs.readFile( path, 'utf-8', ( err, data ) => {
                    if ( err ) throw err;
                    console.log('Read three.js');

                    let newData = data;
                    for ( const edit of EDITS ) {
                        newData = newData.replace( edit.line, edit.replacement );
                    }
                
                    fs.writeFile( path, newData, 'utf-8', function( err, data ) {
                        if (err) throw err;
                        console.log('Edited three.js!');
                    });
                });
            });
        }
    }
}

export { editThree };