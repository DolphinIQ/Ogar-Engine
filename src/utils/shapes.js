// Meshes utilities for poopulating a scene
import { Mesh } from 'three';

/**
 * Creates a grid of meshes
 * @param {*} rows - X axis
 * @param {*} cols - Z axis
 * @param {*} distance - distance between each mesh
 * @param {*} geometry - geometry to use for the mesh
 * @param {*} material - material to use for the mesh
 * @param {*} scene - scene to add the mesh to
 */
function addMeshesInGrid( rows, cols, distance, geometry, material, scene ) {

    for( let i = 0; i < rows; i++ ) {
        for( let j = 0; j < cols; j++ ) {
            const mesh = new Mesh( geometry, material );
            mesh.position.x = distance * (j - (rows - 1) / 2);
            mesh.position.z = distance * (i - (cols - 1) / 2);
            scene.add( mesh );
        }
    }
}

export { addMeshesInGrid };