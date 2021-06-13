// THREE
import * as THREE from 'three';

// LOADERS
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OGARExporter } from './loaders/OGARExporter.js';
import { OGARLoader } from './loaders/OGARLoader.js';

// CONTROLS
import { Orbit } from './controls/orbitControlsOGL.js';

// UTILITY
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { WEBGL } from 'three/examples/jsm/WebGL.js';
import { addMeshesInGrid } from './utils/shapes.js';


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
        this._canvas = this.renderer.domElement;
        element.appendChild( this._canvas );
        if( settings.shadows.enabled ){ 
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            // this.renderer.shadowMap.autoUpdate = false;
        }
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.5, 1000 );
        this.camera.position.set( 0, 4, 8 );

        this.orbitControls = new Orbit( this.camera, {
            element: this._canvas,
            target: new THREE.Vector3()
        });

        this._clock = new THREE.Clock();

        //Stats
        this._stats = new Stats();
        element.appendChild( this._stats.dom );

        //GUI
        this._gui = new GUI();
        // gui.add(object, property, [min], [max], [step])
        
        function onWindowResize(){
            renderer.setSize( window.innerWidth, window.innerHeight );
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
        window.addEventListener('resize', onWindowResize, false);

        const geometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
        const program = new THREE.RawShaderMaterial({
            uniforms: {
                ['uLightDirection']: { value: new THREE.Vector3( 3, 5, 6 ).normalize() },
                ['uAmbientLightIntensity']: { value: 0.1 }
            },
            vertexShader: /*glsl*/`#version 300 es
                precision highp float;

                in vec3 position;
                in vec3 normal;
                in vec2 uv;

                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;
                uniform mat3 normalMatrix;

                out vec3 vNormal;
                out vec2 vUv;

                void main() {
                    vNormal = normal;
                    vUv = uv;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
                `,
            fragmentShader: /*glsl*/`#version 300 es
                precision highp float;

                in vec3 vNormal;
                in vec2 vUv;

                uniform vec3 uLightDirection;
                uniform float uAmbientLightIntensity;

                out vec4 fragColor;

                void main() {
                    vec3 normal = normalize( vNormal );
                    vec3 diffuse = vec3( 1.0 );
                    float lightContribution = max( dot( normal, uLightDirection ), 0.0 ) + uAmbientLightIntensity;

                    vec3 finalColor = diffuse * lightContribution;

                    fragColor = vec4( finalColor, 1.0 );
                }
            `
        });

        const ROWS = 5;
        const DIST = 2;
        addMeshesInGrid( ROWS, ROWS, DIST, geometry, program, this.scene );

        this._stitchPrograms();
        requestAnimationFrame( this.animate.bind(this) );
    }

    _stitchPrograms() {

    }

    animate() {
        this._stats.begin();

        this._delta = this._clock.getDelta();

        requestAnimationFrame( this.animate.bind(this) );
        this.orbitControls.update();
        this.renderer.render( this.scene, this.camera );

        this._stats.end();
    }
}

export { Engine, THREE, OGARExporter, OGARLoader };