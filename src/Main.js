// THREE
import * as THREE from 'three';

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
    init( element ) {

        console.log('OGAR initialized!');
        let self = this;

        const settings = {
            shadows: {
                enabled: false,
            }
        }

        this.renderer = new THREE.WebGLRenderer({ precision: 'highp' });
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.canvas = this.renderer.domElement;
        element.appendChild( this.canvas );
        if( settings.shadows.enabled ){ 
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            // this.renderer.shadowMap.autoUpdate = false;
        }
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;

        // Create a multi render target with Float buffers
		this._MRT = new THREE.WebGLMultipleRenderTargets(
			window.innerWidth, // * window.devicePixelRatio,
			window.innerHeight, // * window.devicePixelRatio,
			3
		);

		for ( let i = 0, il = this._MRT.texture.length; i < il; i ++ ) {

			this._MRT.texture[ i ].minFilter = THREE.NearestFilter;
			this._MRT.texture[ i ].magFilter = THREE.NearestFilter;
			this._MRT.texture[ i ].type = THREE.FloatType;
		}

		// Name our G-Buffer attachments for debugging
		this._MRT.texture[ 0 ].name = 'position';
		this._MRT.texture[ 1 ].name = 'normal';
		this._MRT.texture[ 2 ].name = 'diffuse';

        // PostProcessing quad setup
        this._postProcessing = {};
		this._postProcessing.scene = new THREE.Scene();
		this._postProcessing.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
        this._postProcessing.quad = new THREE.Mesh(
			new THREE.PlaneGeometry( 2, 2 ),
			new THREE.RawShaderMaterial({
				vertexShader: basicVertex.trim(),
				fragmentShader: finalRenderFragment.trim(),
				uniforms: {
                    tPosition: { value: this._MRT.texture[ 0 ] },
					tNormal: { value: this._MRT.texture[ 1 ] },
					tDiffuse: { value: this._MRT.texture[ 2 ] }
				},
				// glslVersion: THREE.GLSL3
			})
        );
		this._postProcessing.scene.add( this._postProcessing.quad );

        this._stitchPrograms();
        
        let onWindowResize = () => {
            this.renderer.setSize( window.innerWidth, window.innerHeight );
			// const dpr = this.renderer.getPixelRatio();
			this._MRT.setSize( window.innerWidth, window.innerHeight );
			// this.render();
        }
        window.addEventListener('resize', onWindowResize, false);
    }

    _stitchPrograms() { // TODO

    }

    render( scene, camera ) {
        // render scene into Multiple Render Targets
		this.renderer.setRenderTarget( this._MRT );
		this.renderer.render( scene, camera );

		// render post FX
		this.renderer.setRenderTarget( null );
		this.renderer.render( this._postProcessing.scene, this._postProcessing.camera );
    }

    setSizeMRT( width, height ) { // TODO: use this once engine supports canvas size other than full window

    }
}

export { 
    Engine, THREE,
    OGARExporter, OGARLoader,
    gBufferMaterial
};