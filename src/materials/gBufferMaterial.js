
import { RawShaderMaterial } from 'three';
// SHADERS
import { gBufferVertex } from './../shaders/gBufferVertex.glsl.js';
import { gBufferFragment } from './../shaders/gBufferFragment.glsl.js';

class gBufferMaterial extends RawShaderMaterial {
/**
 * Basic gBufferMaterial
 * @param {Object} uniforms - uniforms for the shader
 * 
 * REQUIRED:
 * - uCameraNear - camera.near
 * - uCameraFar - camera.far
 * 
 * Currently supported:
 * - tDiffuse - diffuse map
 */
    constructor( uniforms ) {

        uniforms['uMaterialID'] = { value: 0 }; // 0-255

        super({
            uniforms,
            vertexShader: gBufferVertex.trim(),
            fragmentShader: gBufferFragment.trim()
        });
    }
}

export { gBufferMaterial };