// THREE
import * as THREE from 'three';

// LOADERS
import { OGARExporter } from './loaders/OGARExporter.js';
import { OGARLoader } from './loaders/OGARLoader.js';

// SHADERS
import { basicVertex } from './shaders/basicVertex.glsl.js';
import { finalRenderVertex, finalRenderFragment } from './shaders/finalRender.glsl.js';
import debug_fragment_output from './shaders/chunks/debug_fragment_output.glsl.js';
import { lightSphereShader } from './shaders/lightSphereShader.glsl';

// MATERIALS
import { DeferredMeshPhongMaterial } from './materials/DeferredMeshPhongMaterial.js';

// GEOMETRIES
import { FullScreenTriangleGeometry } from './geometries/FullScreenTriangleGeometry.js';

// UTILITY
import { WEBGL } from 'three/examples/jsm/WebGL.js';
import { Debugger } from './utils/debugger.js';


const OGAR = {
    OGARExporter, OGARLoader,
    DeferredMeshPhongMaterial
};
Object.assign( OGAR, THREE );

class Engine {

    #_renderer;
    #_MRT;
    #_dynamicLightsRT;
    #_deferredShading;
    #_forwardRendering;
    #_RENDER_TARGETS;

    #_settings;
    #_visibleObjects;
    #_visualizePointLightVolumes;
    #_lights;
    #_lightScaleFactor;
    #_cameraPosition;

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
            const warning = WEBGL.getWebGLErrorMessage();
            document.body.appendChild( warning );
            return;
        }

        this.#_settings = {
            debugger: engineOptions.debugger,
            debugGbuffer: engineOptions.debugGbuffer,
            shadows: { // no support yet
                enabled: false,
            }
        }

        this.invisibleLayer = 31; // layer to swap objects to, during rendering
        this.#_visibleObjects = [];
        this.#_RENDER_TARGETS = [];
        this.#_lights = {
            ambient: new THREE.Color(),
            point: {
                transformAttribute: null,
                pointLightAttribute: null,
                count: 0
            },
            spot: { count: 0 },
            directional: { count: 0 },
            hemi: { count: 0 }
        };
        this.screenSize = new THREE.Vector2();

        this.vec3 = new THREE.Vector3(); // vec3 for reusing purposes
        this.color = new THREE.Color(); // color for reusing purposes
        this.upVec3 = new THREE.Vector3( 0, 1, 0 );
        this.#_cameraPosition = new THREE.Vector3();

        this.#_setupRenderer( element, rendererOptions );
        this.#_setupForwardRendering();
        this.#_setupMRT();
        this.#_setupDynamicLights();

        if ( this.#_settings.debugger ) {
            this.#_setupDebugger();
        }

        this.#_overrideTHREE();

        window.addEventListener('resize', this.#_onWindowResize.bind( this ), false);
    }

    // SETUP METHODS

    /**
     * Create the webgl renderer with properties
     * @param { Element } element - element to append the webgl canvas to
     * @param { Object } rendererOptions - options to be passed into WebGLRenderer constructor
     */
    #_setupRenderer( element, rendererOptions ) {

        const rendererParameters = rendererOptions || { precision: 'highp' };
        this.#_renderer = new THREE.WebGLRenderer( rendererParameters );
        this.#_renderer.setSize( window.innerWidth, window.innerHeight );
        this.#_renderer.setPixelRatio( window.devicePixelRatio );

        this.canvas = this.#_renderer.domElement;
        element.appendChild( this.canvas );

        this.#_renderer.outputEncoding = THREE.sRGBEncoding;
        this.#_renderer.physicallyCorrectLights = true;
        this.#_lightScaleFactor = ( this.#_renderer.physicallyCorrectLights !== true ) ? Math.PI : 1;

        this.#_renderer.info.autoReset = false;

        this.#_renderer.getSize( this.screenSize ).multiplyScalar( window.devicePixelRatio );
    }

    #_setupForwardRendering() {

        this.#_forwardRendering = {};
        this.#_forwardRendering.objects = [];
        this.#_forwardRendering.RT = new THREE.WebGLRenderTarget(
            window.innerWidth * window.devicePixelRatio,
			window.innerHeight * window.devicePixelRatio,
            {
                minFilter: THREE.NearestFilter,
                magFilter: THREE.NearestFilter,
                type: THREE.FloatType
            }
        );
        this.#_RENDER_TARGETS.push( this.#_forwardRendering.RT );
    }

    /**
     * Creates multiple render targets necessary for the deferred pipeline
     */
    #_setupMRT() {

        this.#_dynamicLightsRT = new THREE.WebGLRenderTarget(
            window.innerWidth * window.devicePixelRatio,
			window.innerHeight * window.devicePixelRatio,
            {
                minFilter: THREE.NearestFilter,
                magFilter: THREE.NearestFilter,
                type: THREE.FloatType
            }
        );
        this.#_RENDER_TARGETS.push( this.#_dynamicLightsRT );

        // Create a multi render target with Float buffers
		this.#_MRT = new THREE.WebGLMultipleRenderTargets(
			window.innerWidth * window.devicePixelRatio,
			window.innerHeight * window.devicePixelRatio,
			4
		);

		for ( let i = 0, il = this.#_MRT.texture.length; i < il; i ++ ) {

			this.#_MRT.texture[ i ].minFilter = THREE.NearestFilter;
			this.#_MRT.texture[ i ].magFilter = THREE.NearestFilter;
			this.#_MRT.texture[ i ].type = THREE.FloatType;
		}

        this.#_MRT.depthTexture = new THREE.DepthTexture();
		this.#_MRT.depthTexture.format = THREE.DepthFormat;
		this.#_MRT.depthTexture.type = THREE.UnsignedShortType;

		// Name our G-Buffer attachments for debugging
		this.#_MRT.texture[ 0 ].name = 'position';
		this.#_MRT.texture[ 1 ].name = 'normal';
		this.#_MRT.texture[ 2 ].name = 'diffuse';
		this.#_MRT.texture[ 3 ].name = 'emissive';

        this.#_RENDER_TARGETS.push( this.#_MRT );

        console.log( 'this.#_MRT:', this.#_MRT );

        // PostProcessing full-screen triangle setup
        this.#_deferredShading = {};
		this.#_deferredShading.scene = new THREE.Scene();
        this.#_deferredShading.scene.autoUpdate = true
		this.#_deferredShading.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        this.#_deferredShading.objects = [];

        let fragmentShader = finalRenderFragment;
        if ( this.#_settings.debugGbuffer ) {
            fragmentShader = fragmentShader.replace(
                `finalColor = vec4( outgoingLight, 1.0 );`,
                debug_fragment_output
            );
        }

		this.#_deferredShading.shader = new THREE.ShaderMaterial({
            // vertexShader: basicVertex.trim(),
            vertexShader: finalRenderVertex.trim(),
            fragmentShader: fragmentShader.trim(),
            // uniforms: Object.assign({
            //     // MRT uniforms:
            //     gPosition: { value: this.#_MRT.texture[ 0 ] },
            //     gNormal: { value: this.#_MRT.texture[ 1 ] },
            //     gDiffuse: { value: this.#_MRT.texture[ 2 ] },
            //     gEmissive: { value: this.#_MRT.texture[ 3 ] },
            //     // Lights
            //     dynamicLights: { value: this.#_dynamicLightsRT.texture }
            // }, THREE.UniformsLib['lights'] ),
            uniforms: {
                // MRT uniforms:
                gPosition: { value: this.#_MRT.texture[ 0 ] },
                gNormal: { value: this.#_MRT.texture[ 1 ] },
                gDiffuse: { value: this.#_MRT.texture[ 2 ] },
                gEmissive: { value: this.#_MRT.texture[ 3 ] },
                // Lights
                dynamicLights: { value: this.#_dynamicLightsRT.texture },
                ambientLight: { value: new THREE.Color() },
                hemiLights: { value: [] },
                directionalLights: { value: [] },
                // Forward Render
                forwardRender: { value: this.#_forwardRendering.RT.texture }
            },
            // lights: true,
            glslVersion: THREE.GLSL3
        });

        this.#_deferredShading.fullScreenMesh = new THREE.Mesh(
            new FullScreenTriangleGeometry(),
            this.#_deferredShading.shader
        );
        this.#_deferredShading.fullScreenMesh.frustumCulled = false;
        console.log( 'this.#_deferredShading.fullScreenMesh:', this.#_deferredShading.fullScreenMesh ); 
    }

    #_setupDynamicLights() {

        this.#_setupPointLights();
        // this.#_setupSpotLights(); TODO
        // this.#_setupDirectionalLights(); TODO

    }

    /**
     * Dynamic lighting is done through rendering point lights as backface spheres and blending them additively
     */
    #_setupPointLights() {

        // PointLight volume spheres
        // const lightSphereGeometry = new THREE.SphereGeometry( 1, 16, 8 );
        const lightSphereGeometry = new THREE.SphereGeometry( 1, 8, 6 );
        const lightSphereInstancedGeometry = new THREE.InstancedBufferGeometry();
        const maxLights = 10000;
        lightSphereInstancedGeometry.instanceCount = 0;

        lightSphereInstancedGeometry.index = lightSphereGeometry.index;
        lightSphereInstancedGeometry.attributes = lightSphereGeometry.attributes;

        this.#_lights.point.transformAttribute = new THREE.InstancedBufferAttribute( new Float32Array( maxLights * 4 ), 4 );
        this.#_lights.point.pointLightAttribute = new THREE.InstancedBufferAttribute( new Float32Array( maxLights * 4 ), 4 );
        lightSphereInstancedGeometry.setAttribute( 'transform', this.#_lights.point.transformAttribute );
        lightSphereInstancedGeometry.setAttribute( 'pointLight', this.#_lights.point.pointLightAttribute );
        this.#_lights.point.transformAttribute.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame
        this.#_lights.point.pointLightAttribute.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame

        const lightSphereMaterial = new THREE.RawShaderMaterial({
            vertexShader: lightSphereShader.pointLightVertex,
            fragmentShader: lightSphereShader.pointLightFragment,
            uniforms: {
                uScreenSize: { value: this.screenSize },
                // MRT uniforms:
                gPosition: { value: this.#_MRT.texture[ 0 ] },
                gNormal: { value: this.#_MRT.texture[ 1 ] },
                gDiffuse: { value: this.#_MRT.texture[ 2 ] },
                gEmissive: { value: this.#_MRT.texture[ 3 ] },
            },
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.lightVolumeSpheres = new THREE.Mesh( lightSphereInstancedGeometry, lightSphereMaterial );
        this.lightVolumeSpheres.frustumCulled = false;
        this.#_deferredShading.scene.add( this.lightVolumeSpheres );

        this.#_visualizePointLightVolumes = false;
    }

    /**
     * Creates a debugger to showcase various data live
     */
    #_setupDebugger() {

        this.debugger = new Debugger();
        // this.debugger.addLine( this.#_renderer.info.render, 'triangles', 'Triangles', false );
        // this.debugger.addLine( this.#_renderer.info.render, 'calls', 'Draw Calls', false );
        this.debugger.addLine( this.#_renderer.info.render, 'triangles', 'Triangles' );
        this.debugger.addLine( this.#_renderer.info.render, 'calls', 'Draw Calls' );
        this.debugger.addLine( this.#_renderer.info.programs, 'length', 'Programs' );
        this.debugger.addLine( this.#_renderer.info.memory, 'geometries', 'Geometries' );
        this.debugger.addLine( this.#_renderer.info.memory, 'textures', 'Textures' );
        this.debugger.addLine( this.#_lights.point, 'count', 'Point Lights' );
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

    #_onWindowResize() {

		const dpr = this.#_renderer.getPixelRatio();
        this.#_renderer.setSize( window.innerWidth, window.innerHeight );

        for ( const renderTarget of this.#_RENDER_TARGETS ) {

            renderTarget.setSize( window.innerWidth * dpr, window.innerHeight * dpr );
        }

		// this.#_MRT.setSize( window.innerWidth * dpr, window.innerHeight * dpr );
		// this.#_dynamicLightsRT.setSize( window.innerWidth * dpr, window.innerHeight * dpr );
        this.#_renderer.getSize( this.screenSize ).multiplyScalar( window.devicePixelRatio );
        this.lightVolumeSpheres.material.uniforms[ 'uScreenSize' ].value = this.screenSize;
    }

    // UPDATE METHODS

    /**
     * Updates deferred materials' uniforms
     * @param { DeferredMeshPhongMaterial } material
     * @param { THREE.Camera } activeCamera
     */
    #_updateDeferredMaterials( material, activeCamera ) {

        material.camera = activeCamera;
    }

    #_updateStaticLights( light ) {

        if ( light.isAmbientLight ) { // If ambient, just merge them all into one final color uniform

            this.#_lights.ambient.r += light.color.r * light.intensity * this.#_lightScaleFactor;
            this.#_lights.ambient.g += light.color.g * light.intensity * this.#_lightScaleFactor;
            this.#_lights.ambient.b += light.color.b * light.intensity * this.#_lightScaleFactor;

        } else if ( light.isHemisphereLight ) {

            this.#_lights.hemi.count++;

            const hemiLightUniform = {
                direction: this.upVec3,
                skyColor: new THREE.Color().copy( light.color ).multiplyScalar( light.intensity * this.#_lightScaleFactor ),
                groundColor: new THREE.Color().copy( light.groundColor ).multiplyScalar( light.intensity * this.#_lightScaleFactor )
            };

            this.#_deferredShading.fullScreenMesh.material.uniforms.hemiLights.value.push( hemiLightUniform );
        }
    }

    #_updateDynamicLights( light ) {

        if ( light.isPointLight ) {

            this.#_updatePointLights( light );

        } else if ( light.isSpotLight ) {

            this.#_updateSpotLights( light );

        } else if ( light.isDirectionalLight ) {

            this.#_updateDirectionalLights( light );

        }
    }

    #_updatePointLights( pointLight ) {

        this.vec3.setFromMatrixPosition( pointLight.matrixWorld );

        // place for potential lights culling
        // if ( this.vec3.distanceTo( this.#_cameraPosition ) > 50 ) {
        //     return;
        // }

        this.#_lights.point.transformAttribute.setXYZW(
            this.#_lights.point.count,
            this.vec3.x, this.vec3.y, this.vec3.z,
            pointLight.distance
        );

        this.color.copy( pointLight.color ).multiplyScalar( pointLight.intensity * this.#_lightScaleFactor ),
        this.#_lights.point.pointLightAttribute.setXYZW(
            this.#_lights.point.count,
            this.color.r, this.color.g, this.color.b,
            pointLight.decay
        );

        this.#_lights.point.count ++;
    }

    #_updateSpotLights( spotLight ) {
        // TODO
    }

    #_updateDirectionalLights( directionalLight ) {

        this.#_lights.directional.count++;
        
        const dirLightUniform = {
            direction: new THREE.Vector3(),
            color: new THREE.Color().copy( directionalLight.color ).multiplyScalar( directionalLight.intensity * this.#_lightScaleFactor )
        };
                
        dirLightUniform.direction.setFromMatrixPosition( directionalLight.matrixWorld );
        this.vec3.setFromMatrixPosition( directionalLight.target.matrixWorld );
        dirLightUniform.direction.sub( this.vec3 );

        this.#_deferredShading.fullScreenMesh.material.uniforms.directionalLights.value.push( dirLightUniform );
    }

    #_updateObjects( scene, camera ) {

        this.#_forwardRendering.objects = [];
        this.#_deferredShading.objects = [];

        this.#_lights.ambient.set( 0, 0, 0 );
        this.#_lights.point.count = 0;
        this.#_lights.spot.count = 0;
        this.#_lights.directional.count = 0;
        this.#_lights.hemi.count = 0;
        this.#_deferredShading.fullScreenMesh.material.uniforms.hemiLights.value = [];

        // artist-friendly light intensity scaling factor
        this.#_lightScaleFactor = ( this.#_renderer.physicallyCorrectLights !== true ) ? Math.PI : 1;

        scene.traverseVisible( ( object ) => {

            if ( !object.layers.test( camera.layers ) ) return;

            if ( object.isLight ) {

                this.#_updateDynamicLights( object );
                this.#_updateStaticLights( object );

            } else if ( object.isMesh ) {

                if ( object.material.isDeferred ) {

                    this.#_updateDeferredMaterials( object.material, camera );
                    this.#_deferredShading.objects.push( object );

                } else {

                    this.#_forwardRendering.objects.push( object );
                    object.layers.set( this.invisibleLayer );
                }
            }
        });

        this.lightVolumeSpheres.geometry.instanceCount = this.#_lights.point.count;
        this.#_lights.point.transformAttribute.needsUpdate = true;
        this.#_lights.point.pointLightAttribute.needsUpdate = true;
        this.#_deferredShading.fullScreenMesh.material.uniforms.ambientLight.value = this.#_lights.ambient;

        // DEFINES (require shader recompilation)
        if ( // Need to use custom DEFINES for lights. Three.js overrides the default ones during render
            this.#_deferredShading.fullScreenMesh.material.defines.NR_OF_HEMI_LIGHTS !== this.#_lights.hemi.count ||
            this.#_deferredShading.fullScreenMesh.material.defines.NR_OF_DIR_LIGHTS !== this.#_lights.directional.count
        ) {
            this.#_deferredShading.fullScreenMesh.material.needsUpdate = true;
            this.#_deferredShading.fullScreenMesh.material.defines.NR_OF_HEMI_LIGHTS = this.#_lights.hemi.count;
            this.#_deferredShading.fullScreenMesh.material.defines.NR_OF_DIR_LIGHTS = this.#_lights.directional.count;
        }
    }

    /**
     * Forward rendering of any objects with no deferred material
     */
    #_renderForward( scene, camera ) {

        for( let i = 0, len = this.#_forwardRendering.objects.length; i < len; i++ ) {

            this.#_forwardRendering.objects[ i ].layers.set( 0 );
        }
        // Hide deferred material meshes
        for( let i = 0, len = this.#_deferredShading.objects.length; i < len; i++ ) {

            this.#_deferredShading.objects[ i ].layers.set( this.invisibleLayer );
        }


        // Bread Fan code
        const gl = this.#_renderer.getContext();

        // this.#_renderer.state.bindFramebuffer( gl.FRAMEBUFFER, null );
        this.#_renderer.setRenderTarget( null );

        // const webglDepthTexture = this.#_renderer.properties.get( renderTarget.depthTexture ).__webglTexture;
        // const webglDepthTexture = this.#_renderer.properties.get( this.#_MRT.depthTexture ).__webglTexture;
        // console.log( 'webglDepthTexture:', webglDepthTexture );
        // console.log( 'this.#_MRT.depthTexture:', this.#_MRT.depthTexture );
        // document.body.append( this.#_MRT.depthTexture ); 
        // gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, webglDepthTexture, 0 );


        // or, blit


        // const gBuffer = this.#_renderer.properties.get( renderTarget ).__webglFramebuffer;
        // const gBuffer = this.#_renderer.properties.get( this.#_MRT.texture[ 0 ] ).__webglFramebuffer;

        // console.log( 'gBuffer:', gBuffer );

        // this.#_renderer.state.bindFramebuffer( gl.READ_FRAMEBUFFER, this.#_MRT.texture[ 0 ] );
        // this.#_renderer.state.bindFramebuffer( gl.WRITE_FRAMEBUFFER, null );
        // gl.blitFramebuffer( 0, 0, this.#_MRT.width, this.#_MRT.height, 0, 0, this.#_MRT.width, this.#_MRT.height, gl.DEPTH_BUFFER_BIT, gl.NEAREST );
        // this.#_renderer.state.bindFramebuffer( gl.READ_FRAMEBUFFER, null );


        // new blit

        const gBuffer = this.#_renderer.properties.get( this.#_MRT ).__webglFramebuffer;
        // console.log( 'gBuffer:', gBuffer );

        this.#_renderer.state.bindFramebuffer( gl.READ_FRAMEBUFFER, gBuffer );
        this.#_renderer.state.bindFramebuffer( gl.WRITE_FRAMEBUFFER, null );
        gl.blitFramebuffer( 0, 0, this.#_MRT.width, this.#_MRT.height, 0, 0, this.#_MRT.width, this.#_MRT.height, gl.DEPTH_BUFFER_BIT, gl.NEAREST );
        this.#_renderer.state.bindFramebuffer( gl.READ_FRAMEBUFFER, null );


        // this.#_renderer.setRenderTarget( null );

        // gl.bindFramebuffer( gl.READ_FRAMEBUFFER, gDeferredDrawer.FrameBuffer.Context );
        // gl.bindFramebuffer( gl.DRAW_FRAMEBUFFER, null ); 
        // gl.blitFramebuffer( 0, 0, gl.viewportWidth, gl.viewportHeight, 0, 0, gl.viewportWidth, gl.viewportHeight, gl.DEPTH_BUFFER_BIT, gl.NEAREST );
        // gl.bindFramebuffer( gl.FRAMEBUFFER, null );




		// this.#_renderer.setRenderTarget( null );
		// this.#_renderer.setRenderTarget( this.#_forwardRendering.RT );
		this.#_renderer.render( scene, camera );

        // Show deferred material meshes for next frame
        for( let i = 0, len = this.#_deferredShading.objects.length; i < len; i++ ) {

            this.#_deferredShading.objects[ i ].layers.set( 0 );
        }
    }

    render( scene, camera ) {

        this.#_renderer.info.reset();
        this.#_cameraPosition.setFromMatrixPosition( camera.matrixWorld );

        this.#_updateObjects( scene, camera );

        // render scene into Multiple Render Targets
		this.#_renderer.setRenderTarget( this.#_MRT );
		this.#_renderer.render( scene, camera );

        // needs to update here to show user scene render data, instead of deferred shading triangle
        // if ( this.#_settings.debugger ) {
        //     this.debugger.getLine( 'Triangles' ).update();
        //     this.debugger.getLine( 'Draw Calls' ).update();
        // }
        
        this.#_renderForward( scene, camera );

        // BREAD FAN - COMMENT OUT THE LINE ABOVE AND UNCOMMENT RENDER CODE BELOW TO SEE THE DEFERRED BOXES SCENE

        // Render dynamic lights optimized as volume spheres
		// this.#_renderer.setRenderTarget( this.#_dynamicLightsRT );
		// this.#_renderer.render( this.#_deferredShading.scene, camera );

        // Composite everything into the final image
		// this.#_renderer.setRenderTarget( null );
		// this.#_renderer.render( this.#_deferredShading.fullScreenMesh, camera );

    }

    setSizeMRT( width, height ) { // TODO: use this once engine supports canvas size other than full window

    }

    get visualizePointLightVolumes() {
        return this.#_visualizePointLightVolumes;
    }
    set visualizePointLightVolumes( bool ) {
        this.#_visualizePointLightVolumes = bool;
        // TODO light volume helpers
    }
}

OGAR.Engine = Engine;

export { OGAR };