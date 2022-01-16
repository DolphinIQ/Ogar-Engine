// THREE
import * as THREE from 'three';
// import * as Threejs from 'three';
// const THREE = Object.assign( THREE, Threejs );

// LOADERS
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OGARExporter } from './loaders/OGARExporter.js';
import { OGARLoader } from './loaders/OGARLoader.js';

// SHADERS
import { basicVertex } from './shaders/basicVertex.glsl.js';
import { finalRenderFragment } from './shaders/finalRender.glsl.js';

// MATERIALS
import { gBufferMaterial } from './materials/gBufferMaterial.js';

// UTILITY
import { WEBGL } from 'three/examples/jsm/WebGL.js';


import {
    createWorld,
    addEntity,
    removeEntity,

    defineComponent,
    addComponent,
    removeComponent,
    hasComponent,

    defineQuery,
    Changed,
    Not,
    enterQuery,
    exitQuery,

    defineSystem,

    defineSerializer,
    defineDeserializer,

    pipe,
} from 'bitecs';

class Engine {

    #_renderer;
    #_MRT;
    #_postProcessing;

    // #_materials;
    // #_geometries;
    // #_textures;
    // #_meshes;
    // #_lights;

    constructor() {

        // Detect WebGL support
        if ( !WEBGL.isWebGL2Available() ) {
            console.error("WebGL 2 is not available!");
            let warning = WEBGL.getWebGLErrorMessage();
            document.body.appendChild( warning );
            return;
        }
    }

    /**
     * 
     * @param {DOM} element - element to append webgl canvas
     */
    init( element, ogar ) {

        console.log('OGAR initialized!');
        let self = this;

        const settings = {
            shadows: {
                enabled: false,
            }
        }

        this.materials = new Set();
        this.geometries = new Set();
        this.textures = new Set();
        this.meshes = new Set();
        this.lights = new Set();

        this.#_renderer = new THREE.WebGLRenderer({ precision: 'highp' });
        this.#_renderer.setSize( window.innerWidth, window.innerHeight );
        this.canvas = this.#_renderer.domElement;
        element.appendChild( this.canvas );
        if( settings.shadows.enabled ){ 
            this.#_renderer.shadowMap.enabled = true;
            this.#_renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            // this.#_renderer.shadowMap.autoUpdate = false;
        }
        this.#_renderer.outputEncoding = THREE.sRGBEncoding;
        this.#_renderer.physicallyCorrectLights = true;

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

        // PostProcessing quad setup
        this.#_postProcessing = {};
		this.#_postProcessing.scene = new THREE.Scene();
		this.#_postProcessing.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );

		this.#_postProcessing.finalShader = new THREE.RawShaderMaterial({
            vertexShader: basicVertex.trim(),
            fragmentShader: finalRenderFragment.trim(),
            uniforms: {
                tPosition: { value: this.#_MRT.texture[ 0 ] },
                tNormal: { value: this.#_MRT.texture[ 1 ] },
                tDiffuse: { value: this.#_MRT.texture[ 2 ] },
                tSpecular: { value: this.#_MRT.texture[ 3 ] },
                uCameraPosition: { value: new THREE.Vector3() },
                materials: { value: [
                    {
                        unlit: true,
                        diffuse: new THREE.Vector3( 1, 1, 1 ),
                        specularColor: new THREE.Vector3( 0.1, 0.1, 0.1 ),
                        shininess: 0
                    }
                ] }
            },
            // glslVersion: THREE.GLSL3
        });
        this.#_postProcessing.quad = new THREE.Mesh(
			new THREE.PlaneGeometry( 2, 2 ),
            this.#_postProcessing.finalShader
        );
		this.#_postProcessing.scene.add( this.#_postProcessing.quad );

        const P_light = new THREE.PointLight( 0xff6600, 2.0 );
        P_light.position.set( 0, 4, 0 );
        const D_light = new THREE.DirectionalLight( 0xff0000, 2.0 );
        D_light.position.set( 4, 4, 0 );
        const D_light2 = new THREE.DirectionalLight( 0xff0000, 0.5 );
        D_light2.position.set( -4, 3, 0 );
        const A_light = new THREE.AmbientLight( 0xffffff, 1 );
		// this.#_postProcessing.scene.add( P_light );
		this.#_postProcessing.scene.add( D_light );
		this.#_postProcessing.scene.add( D_light2 );
		// this.#_postProcessing.scene.add( A_light );

        console.log( 'this.#_postProcessing.finalShader:', this.#_postProcessing.finalShader );

        this.#_stitchPrograms();
        this.#_overrideTHREE( ogar );
        
        let onWindowResize = () => {
            this.#_renderer.setSize( window.innerWidth, window.innerHeight );
			// const dpr = this.#_renderer.getPixelRatio();
			this.#_MRT.setSize( window.innerWidth, window.innerHeight );
			// this.render();
        }
        window.addEventListener('resize', onWindowResize, false);
    }

    // Extends some THREE.JS classes for the purposes of the engine
    #_overrideTHREE( ogar ) {

        // const engine = self;
        let self = this;

        class RMesh extends THREE.Mesh {
            constructor( geometry, material ) {

                super( geometry, material );

                // self.#_materials.add( material );
                // self.#_geometries.add( geometry );
                // self.#_meshes.add( this );
                // console.log( 'hello hello!' );
                // console.log( self.#_materials );

                // this.destroy = () => {
                //     self.#_materials.remove( material );
                //     self.#_geometries.remove( geometry );
                //     self.#_meshes.remove( this );

                //     geometry.dispose();
                //     material.dispose();
                // };

                self.materials.add( material );
                self.geometries.add( geometry );
                self.meshes.add( this );
                console.log( 'new OGAR.Mesh' );
                console.log( 'Engine materials:', self.materials );

                this.destroy = () => {
                    self.materials.remove( material );
                    self.geometries.remove( geometry );
                    self.meshes.remove( this );

                    geometry.dispose();
                    material.dispose();
                };
            }
        }
        console.log( 'overriding THREE' );

        // Object.defineProperties( THREE, {
        //     Mesh: {
        //         get: () => RMesh
        //     }
        // } );

        // THREE.Mesh = RMesh;
        ogar.Mesh = RMesh;
    }

    #_stitchPrograms() { // TODO

    }

    render( scene, camera ) {
        // render scene into Multiple Render Targets
		this.#_renderer.setRenderTarget( this.#_MRT );
		this.#_renderer.render( scene, camera );

		// render post FX
        this.#_postProcessing.finalShader.uniforms.uCameraPosition.value = camera.position;
		this.#_renderer.setRenderTarget( null );
		this.#_renderer.render( this.#_postProcessing.scene, this.#_postProcessing.camera );
    }

    setSizeMRT( width, height ) { // TODO: use this once engine supports canvas size other than full window

    }
}

const OGAR = { 
    Engine,
    OGARExporter, OGARLoader,
    gBufferMaterial
};
Object.assign( OGAR, THREE );

// OGAR.Mesh = class {
//     constructor() {
//         this.a = 8;
//     }
// }

export { OGAR };