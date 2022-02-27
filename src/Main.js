// THREE
import * as THREE from 'three';

// LOADERS
import { OGARExporter } from './loaders/OGARExporter.js';
import { OGARLoader } from './loaders/OGARLoader.js';

// SHADERS
import { basicVertex } from './shaders/basicVertex.glsl.js';
import { finalRenderFragment } from './shaders/finalRender.glsl.js';
import debug_fragment_output from './shaders/chunks/debug_fragment_output.glsl.js';

// MATERIALS
import { GBufferMaterial } from './materials/GBufferMaterial.js';

// GEOMETRIES
import { FullScreenTriangleGeometry } from './geometries/FullScreenTriangleGeometry.js';

// UTILITY
import { WEBGL } from 'three/examples/jsm/WebGL.js';
import { Debugger } from './utils/debugger.js';


class Engine {

    #_renderer;
    #_MRT;
    #_deferredShading;

    #_gBufferMaterials
    #_settings
    #_visibleObjects

    /**
     * 
     * @param { DOM } element - element to append webgl canvas
     * @param { Object } engineOptions - options of the engine:
     * - debugger - whether to use the debugger
     * @param { Object } rendererOptions - options for the THREE.WebGLRenderer
     */
     constructor( element, engineOptions, rendererOptions ) {

        // Detect WebGL support
        if ( !WEBGL.isWebGL2Available() ) {
            console.error("WebGL 2 is not available!");
            let warning = WEBGL.getWebGLErrorMessage();
            document.body.appendChild( warning );
            return;
        }

        console.log('OGAR initialized!');

        this.#_settings = {
            debugger: engineOptions.debugger,
            debugGbuffer: engineOptions.debugGbuffer,
            shadows: {
                enabled: false,
            }
        }

        this.deferredShadingLayer = 31; // layer to swap objects to, during rendering
        // this.materials = {};
        this.#_visibleObjects = [];

        const rendererParameters = rendererOptions || { precision: 'highp' };
        this.#_renderer = new THREE.WebGLRenderer( rendererParameters );
        this.#_renderer.setSize( window.innerWidth, window.innerHeight );
        this.#_renderer.setPixelRatio( window.devicePixelRatio );

        this.canvas = this.#_renderer.domElement;
        element.appendChild( this.canvas );
        if ( this.#_settings.shadows.enabled ) {

            this.#_renderer.shadowMap.enabled = true;
            this.#_renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            // this.#_renderer.shadowMap.autoUpdate = false;
        }
        this.#_renderer.outputEncoding = THREE.sRGBEncoding;
        this.#_renderer.physicallyCorrectLights = true;

        console.log( 'Renderer:', this.#_renderer ); 

        // Create a multi render target with Float buffers
		this.#_MRT = new THREE.WebGLMultipleRenderTargets(
			window.innerWidth, // * window.devicePixelRatio,
			window.innerHeight, // * window.devicePixelRatio,
			4
		);

		for ( let i = 0, il = this.#_MRT.texture.length; i < il; i ++ ) {

			this.#_MRT.texture[ i ].minFilter = THREE.NearestFilter;
			this.#_MRT.texture[ i ].magFilter = THREE.NearestFilter;
			this.#_MRT.texture[ i ].type = THREE.FloatType;
		}

		// Name our G-Buffer attachments for debugging
		this.#_MRT.texture[ 0 ].name = 'position';
		this.#_MRT.texture[ 1 ].name = 'normal';
		this.#_MRT.texture[ 2 ].name = 'diffuse';
		this.#_MRT.texture[ 3 ].name = 'specular';

        // PostProcessing full-screen triangle setup
        this.#_deferredShading = {};
		this.#_deferredShading.scene = new THREE.Scene();
		this.#_deferredShading.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );

        let fragmentShader = finalRenderFragment;
        if ( this.#_settings.debugGbuffer ) {
            fragmentShader = fragmentShader.replace( 
                `finalColor = vec4( outgoingLight, 1.0 );`, 
                debug_fragment_output 
            );
        }
		this.#_deferredShading.finalShader = new THREE.RawShaderMaterial({
            vertexShader: basicVertex.trim(),
            fragmentShader: fragmentShader.trim(),
            uniforms: Object.assign({
                // Three.js uniforms:
                cameraPosition: { value: new THREE.Vector3() },
                viewMatrix: { value: new THREE.Matrix4() },
                // MRT uniforms:
                tPosition: { value: this.#_MRT.texture[ 0 ] },
                tNormal: { value: this.#_MRT.texture[ 1 ] },
                tDiffuse: { value: this.#_MRT.texture[ 2 ] },
                tSpecular: { value: this.#_MRT.texture[ 3 ] },
                materials: { value: [
                    {
                        unlit: true,
                        diffuse: new THREE.Vector3( 1, 1, 1 ),
                        specularColor: new THREE.Vector3( 0.1, 0.1, 0.1 ),
                        shininess: 0
                    }
                ] }
            }, THREE.UniformsLib['lights'] ),
            lights: true,
        });
        this.#_deferredShading.fullScreenTriangle = new THREE.Mesh(
            new FullScreenTriangleGeometry(),
            this.#_deferredShading.finalShader
        );
        this.#_deferredShading.fullScreenTriangle.frustumCulled = false;

        if ( this.#_settings.debugger ) {
            this.#_setupDebugger();
        }
        this.#_overrideTHREE();

        let onWindowResize = () => {
            this.#_renderer.setSize( window.innerWidth, window.innerHeight );
			// const dpr = this.#_renderer.getPixelRatio();
			this.#_MRT.setSize( window.innerWidth, window.innerHeight );
        }
        window.addEventListener('resize', onWindowResize, false);
    }

    #_setupDebugger() {
        this.debugger = new Debugger();
        this.debugger.addLine( this.#_renderer.info.render, 'triangles', 'Triangles', false );
        this.debugger.addLine( this.#_renderer.info.render, 'calls', 'Draw Calls', false );
        this.debugger.addLine( this.#_renderer.info.programs, 'length', 'Programs' );
        this.debugger.addLine( this.#_renderer.info.memory, 'geometries', 'Geometries' );
        this.debugger.addLine( this.#_renderer.info.memory, 'textures', 'Textures' );
    }

    // TODO: Extends some THREE.JS classes for the purposes of the engine
    #_overrideTHREE() {

        // const engine = this;
        // const oldObject3dAdd = THREE.Object3D.prototype.add;
        // THREE.Object3D.prototype.add = function( object ) {
        //     // -> this.add( object )
        //     oldObject3dAdd.apply( this, arguments );
        // }
    }

    #_updateGMaterialsCamera( scene, camera ) {

        this.#_gBufferMaterials = {};

        scene.traverseVisible( ( object ) => {
            // collect all g-buffer materials in the scene
            if ( object.isMesh && object.material instanceof GBufferMaterial && !this.#_gBufferMaterials[object.material.uuid] ) {
                this.#_gBufferMaterials[object.material.uuid] = object.material;
            }
        });

        for ( const id in this.#_gBufferMaterials ) {
            if (this.#_gBufferMaterials[id].camera !== camera ) this.#_gBufferMaterials[id].camera = camera;
        }
    }

    render( scene, camera ) {

        // render scene into Multiple Render Targets
        this.#_updateGMaterialsCamera( scene, camera );
		this.#_renderer.setRenderTarget( this.#_MRT );
		this.#_renderer.render( scene, camera );

        // needs to update here to show user scene render data, instead of deferred shading triangle
        if ( this.#_settings.debugger ) {
            this.debugger.getLine( 'Triangles' ).update();
            this.debugger.getLine( 'Draw Calls' ).update();
        }

        // hide user scene objects visibility and show fullscreen triangle
        scene.traverseVisible( ( object ) => {
            if ( object.isMesh || object.isPoints || object.isLine ) {
                this.#_visibleObjects.push( object );
                object.layers.set( this.deferredShadingLayer ); // dont render user scene meshes during deferred shading
            }
        });
        scene.add( this.#_deferredShading.fullScreenTriangle );

        this.#_deferredShading.finalShader.uniforms.cameraPosition.value.setFromMatrixPosition( camera.matrixWorld );
        this.#_deferredShading.finalShader.uniforms.viewMatrix.value = camera.matrixWorldInverse;

		// render post FX
		this.#_renderer.setRenderTarget( null );
		this.#_renderer.render( scene, camera );

        // restore user scene objects visibility and hide fullscreen triangle
        for( let i = 0, len = this.#_visibleObjects.length; i < len; i++ ) {
            this.#_visibleObjects[i].layers.set( 0 );
        }
        this.#_visibleObjects = [];
        scene.remove( this.#_deferredShading.fullScreenTriangle );
    }

    setSizeMRT( width, height ) { // TODO: use this once engine supports canvas size other than full window

    }
}

const OGAR = {
    Engine,
    OGARExporter, OGARLoader,
    GBufferMaterial
};
Object.assign( OGAR, THREE );

export { OGAR };