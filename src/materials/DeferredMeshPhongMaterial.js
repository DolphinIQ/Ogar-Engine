
import { ShaderMaterial, GLSL3, Color, Vector2, TangentSpaceNormalMap, ObjectSpaceNormalMap } from 'three';
// SHADERS
import { gBufferVertex } from '../shaders/gBufferVertex.glsl.js';
import { gBufferFragment } from '../shaders/gBufferFragment.glsl.js';

const color = new Color();

// Use ShaderMaterial, instead of RawShaderMaterial, in order to have THREE fill material.defines
class DeferredMeshPhongMaterial extends ShaderMaterial {
/**
 * G-Buffer Deferred Phong Material
 * @param {Object} uniforms - uniforms for the shader
 * 
 * Currently supported Three.js options:
 * - map { THREE.Texture } - diffuse map
 * - color { THREE.Color } - color
 * - emissive { THREE.Color } - emissive color
 * - emissiveMap { THREE.Texture } - emissive map
 * - emissiveIntensity { Number } - emissive scalar factor
 * - bumpMap { THREE.Texture } - bump map
 * - bumpScale { Number } - bump map scale
 * - normalMap { THREE.Texture } - normal map
 * - normalScale { THREE.Vector2 } - normal map scale
 * - specularMap { THREE.Texture } - specular map
 * - specular { Number } - specular color - supports only black-white values
 * - shininess { Number } - shininess value
 * 
 * New options:
 * - textureRepeat { THREE.Vector2 } - a uniform scale for all uv1 textures
 */
    #_camera
    #_map
    #_emissiveMap
    #_bumpMap
    #_bumpScale
    #_normalMap
    #_normalScale
    #_color
    #_emissive
    #_emissiveIntensity
    #_specularMap
    #_specular
    #_shininess
    #_textureRepeat

    constructor( options ) {

        super({
            vertexShader: gBufferVertex.trim(),
            fragmentShader: gBufferFragment.trim(),
            glslVersion: GLSL3
        });

		this.type = 'DeferredMeshPhongMaterial';
        this.isDeferred = true;

        // Default values fill
        this.#_map = options.map;
        this.#_emissiveMap = options.emissiveMap;
        this.#_normalMap = options.normalMap;
		this.normalMapType = TangentSpaceNormalMap;
        this.#_normalScale = options.normalScale || new Vector2( 1, 1 );
        this.#_bumpMap = options.bumpMap;
        this.#_bumpScale = options.bumpScale || 1;
        this.#_specularMap = options.specularMap;
        this.#_textureRepeat = options.textureRepeat || new Vector2( 1, 1 );

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
        this.uniforms['specularMap'] = { value: this.#_specularMap };
        this.uniforms['normalMap'] = { value: this.#_normalMap };
        this.uniforms['normalScale'] = { value: this.#_normalScale };
        this.uniforms['bumpMap'] = { value: this.#_bumpMap };
        this.uniforms['bumpScale'] = { value: this.#_bumpScale };
        this.uniforms['textureRepeat'] = { value: this.#_textureRepeat };
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

    get textureRepeat() {
        return this.#_textureRepeat;
    }
    set textureRepeat( value ) {
        this.#_textureRepeat = value;
        this.uniforms['textureRepeat'] = this.#_textureRepeat;
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

    get bumpMap() {
        return this.#_bumpMap;
    }
    set bumpMap( value ) {
        this.#_bumpMap = value;
        this.uniforms['bumpMap'].value = value;
    }

    get bumpScale() {
        return this.#_bumpScale;
    }
    set bumpScale( value ) {
        this.#_bumpScale = value;
        this.uniforms['bumpScale'].value = value;
    }

    get emissive() {
        return this.#_emissive;
    }
    set emissive( value ) {
        if ( value.isColor ) {
            this.#_emissive = value;
            this.uniforms['uEmissive'].value = value.multiplyScalar( this.#_emissiveIntensity );
        } else { // check for hexadecimal
            this.#_emissive.set( value );
            this.uniforms['uEmissive'].value = color.copy( this.#_emissive ).multiplyScalar( this.#_emissiveIntensity );
        }
    }

    get emissiveIntensity() {
        return this.#_emissiveIntensity;
    }
    set emissiveIntensity( value ) {
        this.#_emissiveIntensity = value;
        this.uniforms['uEmissive'].value = color.copy( this.#_emissive ).multiplyScalar( value );
    }

    get color() {
        return this.#_color;
    }
    set color( value ) {
        if ( value.isColor ) {
            this.#_color = value;
        } else { // check for hexadecimal
            this.#_color.set( value );
        }
        this.uniforms['uColor'].value = this.#_color;
    }

    get specularMap() {
        return this.#_specularMap;
    }
    set specularMap( value ) {
        this.#_specularMap = value;
        this.uniforms['specularMap'].value = value;
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
}

export { DeferredMeshPhongMaterial };