
import { RawShaderMaterial, Color } from 'three';
import { EmptyTexture } from '../utils/emptyTexture.js';
// SHADERS
import { gBufferVertex } from '../shaders/gBufferVertex.glsl.js';
import { gBufferFragment } from '../shaders/gBufferFragment.glsl.js';

class GBufferMaterial extends RawShaderMaterial {
/**
 * Basic G-Buffer Material
 * @param {Object} uniforms - uniforms for the shader
 * 
 * Currently supported:
 * - map - diffuse map
 * - color - color
 * - specular - specular color
 * - shininess - shininess value
 */
    #_camera
    #_map
    #_color
    #_specular
    #_shininess

    constructor( options ) {

        super({
            vertexShader: gBufferVertex.trim(),
            fragmentShader: gBufferFragment.trim()
        });

        // Default values fill
        this.#_map = options.map || new EmptyTexture();
        if ( options.color ) {
            this.#_color = options.color.isColor ? options.color : new Color( options.color ); // check for hex
        } else {
            this.#_color = new Color( 1, 1, 1 );
        }
        // this.#_color = options.color || new Color( 1, 1, 1 );
        this.#_specular = options.specular || new Color( 0.1, 0.1, 0.1 );
        this.#_shininess = options.shininess || 30;
        this.#_camera = options.camera || { near: 0.1, far: 100 };
        
        // this.map = options.map || new EmptyTexture();
        // this.color = options.color || new Color( 1, 1, 1 );
        // this.specular = options.specular || new Color( 0.1, 0.1, 0.1 );
        // this.shininess = options.shininess || 30;
        // this.camera = options.camera;

        // const uniforms = {};
        this.uniforms['uMaterialID'] = { value: 0 }; // 0-255
        this.uniforms['tDiffuse'] = { value: this.#_map };
        this.uniforms['uColor'] = { value: this.#_color };
        this.uniforms['uSpecularColor'] = { value: this.#_specular };
        this.uniforms['uShininess'] = { value: this.#_shininess };
        this.uniforms['uCameraNear'] = { value: this.#_camera.near };
        this.uniforms['uCameraFar'] = { value: this.#_camera.far };

        // this.uniforms['uMaterialID'] = { value: 0 }; // 0-255
        // this.uniforms['tDiffuse'] = { value: this.map };
        // this.uniforms['uColor'] = { value: this.color };
        // this.uniforms['uSpecularColor'] = { value: this.specular };
        // this.uniforms['uShininess'] = { value: this.shininess };
        // this.uniforms['uCameraNear'] = { value: this.camera.near };
        // this.uniforms['uCameraFar'] = { value: this.camera.far };

        // super({
        //     uniforms,
        //     vertexShader: gBufferVertex.trim(),
        //     fragmentShader: gBufferFragment.trim()
        // });
    }

    get camera() {
        return this.#_camera;
    }
    set camera( value ) {
        this.#_camera = value;
        this.uniforms['uCameraNear'].value = this.#_camera.near;
        this.uniforms['uCameraFar'].value = this.#_camera.far;
    }

    get map() {
        return this.#_map;
    }
    set map( value ) {
        this.#_map = value;
        this.uniforms['tDiffuse'].value = value;
    }

    get color() {
        return this.#_color;
    }
    set color( value ) {
        this.#_color = value;
        this.uniforms['uColor'].value = value;
    }

    get specular() {
        return this.#_specular;
    }
    set specular( value ) {
        this.#_specular = value;
        this.uniforms['uSpecularColor'].value = value;
    }

    get shininess() {
        return this.#_shininess;
    }
    set shininess( value ) {
        this.#_shininess = value;
        this.uniforms['uShininess'].value = value;
    }
}

export { GBufferMaterial };