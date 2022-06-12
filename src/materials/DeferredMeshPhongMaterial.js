
import { ShaderMaterial, GLSL3, Color, Vector2, TangentSpaceNormalMap, ObjectSpaceNormalMap } from 'three';
// SHADERS
import { gBufferVertex } from '../shaders/gBufferVertex.glsl.js';
import { gBufferFragment } from '../shaders/gBufferFragment.glsl.js';

// Use ShaderMaterial, instead of RawShaderMaterial, in order to have THREE fill material.defines
class DeferredMeshPhongMaterial extends ShaderMaterial {
/**
 * G-Buffer Deferred Phong Material
 * @param {Object} uniforms - uniforms for the shader
 * 
 * Currently supported:
 * - map { THREE.Texture } - diffuse map
 * - color { THREE.Color } - color
 * - emissive { THREE.Color } - emissive color
 * - emissiveMap { THREE.Texture } - emissive map
 * - emissiveIntensity { Number } - emissive scalar factor
 * - normalMap { THREE.Texture } - normal map
 * - normalScale { THREE.Vector2 } - normal map scale
 * - specular { Number } - specular color - supports only black-white values
 * - shininess { Number } - shininess value
 */
    #_camera
    #_map
    #_emissiveMap
    #_normalMap
    #_normalScale
    #_color
    #_emissive
    #_emissiveIntensity
    #_specular
    #_shininess

    constructor( options ) {

        super({
            vertexShader: gBufferVertex.trim(),
            fragmentShader: gBufferFragment.trim(),
            glslVersion: GLSL3
        });

		this.type = 'DeferredMeshPhongMaterial';

        // Default values fill
        this.#_map = options.map;
        this.#_emissiveMap = options.emissiveMap;
        this.#_normalMap = options.normalMap;
		this.normalMapType = TangentSpaceNormalMap;
        this.#_normalScale = options.normalScale || new Vector2( 1, 1 );

        this.#_color = options.color ? // check for hexadecimal
            ( options.color.isColor ? options.color : new Color( options.color ) ) : new Color( 1, 1, 1 );
        this.#_emissive = options.emissive ? // check for hexadecimal
            ( options.emissive.isColor ? options.emissive : new Color( options.emissive ) ) : new Color( 0, 0, 0 );
        this.#_emissiveIntensity = options.emissiveIntensity || 1.0;
        this.#_specular = options.specular || 0.1; // supports only black-white colors
        this.#_shininess = options.shininess || 30;
        this.#_camera = options.camera || { near: 0.1, far: 100 };

        // Uniforms
        this.uniforms['map'] = { value: this.#_map };
        this.uniforms['emissiveMap'] = { value: this.#_emissiveMap };
        this.uniforms['normalMap'] = { value: this.#_normalMap };
        this.uniforms['normalScale'] = { value: this.#_normalScale };
        this.uniforms['uColor'] = { value: this.#_color };
        this.uniforms['uEmissive'] = { value: this.#_emissive };
        this.uniforms['uSpecular'] = { value: this.#_specular };
        this.uniforms['uShininess'] = { value: this.#_shininess };
        this.uniforms['uCameraNear'] = { value: this.#_camera.near };
        this.uniforms['uCameraFar'] = { value: this.#_camera.far };
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
        this.uniforms['map'].value = value;
    }

    get emissiveMap() {
        return this.#_emissiveMap;
    }
    set emissiveMap( value ) {
        this.#_emissiveMap = value;
        this.uniforms['emissiveMap'].value = value;
    }

    get normalMap() {
        return this.#_normalMap;
    }
    set normalMap( value ) {
        if ( value ) {
            this.#_normalMap = value;
            this.normalMapType = TangentSpaceNormalMap;
            this.uniforms['normalMap'].value = value;
        }
    }

    get normalScale() {
        return this.#_normalScale;
    }
    set normalScale( value ) {
        this.#_normalScale = value;
        this.uniforms['normalScale'].value = value;
    }

    get emissive() {
        return this.#_emissive;
    }
    set emissive( value ) {
        this.#_emissive = value;
        this.uniforms['uEmissive'].value = value.multiplyScalar( this.#_emissiveIntensity );
    }

    get emissiveIntensity() {
        return this.#_emissiveIntensity;
    }
    set emissiveIntensity( value ) {
        this.#_emissiveIntensity = value;
        this.uniforms['uEmissive'].value = this.#_emissive.multiplyScalar( value );
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
        this.uniforms['uSpecular'].value = value;
    }

    get shininess() {
        return this.#_shininess;
    }
    set shininess( value ) {
        this.#_shininess = value;
        this.uniforms['uShininess'].value = value;
    }

    get isDeferred() {
        return true;
    }
}

export { DeferredMeshPhongMaterial };