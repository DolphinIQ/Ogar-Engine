import { Renderer, Camera, Transform, Box, Program, Geometry, Mesh, Vec3, Orbit, RenderTarget } from 'ogl';
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
        console.log('OGAR initialized!');
    }

    init() {

        let self = this;

        this.renderer = new Renderer({ dpr: 2 });
        const gl = this.renderer.gl;
        document.body.appendChild(gl.canvas);

        this.scene = new Transform();

        this.camera = new Camera(gl);
        this.camera.position.set( 0, 4, 8 );

        this.orbitControls = new Orbit( this.camera, {
            target: new Vec3( 0, 0, 0 ),
        });

        function resize() {
            self.renderer.setSize( window.innerWidth, window.innerHeight );
            self.camera.perspective({
                aspect: gl.canvas.width / gl.canvas.height,
            });
        }
        window.addEventListener('resize', resize, false);
        resize();
        const geometry = new Box( gl );
        const program = new Program( gl , {
            vertex: /*glsl*/`#version 300 es
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
            fragment: /*glsl*/`#version 300 es
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
            `,
            uniforms: {
                ['uLightDirection']: { value: new Vec3( 3, 5, 6 ).normalize() },
                ['uAmbientLightIntensity']: { value: 0.1 }
            }
        });

        const ROWS = 5;
        const DIST = 2;
        addCubesRows( ROWS, ROWS, DIST, gl, geometry, program, this.scene );
        
        const mesh = new Mesh(gl, {geometry, program});
        console.log( mesh );
        // mesh.setParent(scene);

        this._stitchPrograms();
        requestAnimationFrame( this.update.bind(this) );
        // this.update();
    }

    _stitchPrograms() {

    }

    update( delta ) {

        requestAnimationFrame( this.update.bind(this) );
        this.orbitControls.update();
        this.renderer.render({ scene: this.scene, camera: this.camera });
    }
}

function addCubesRows( rows, cols, distance, gl, geometry, program, scene ) {

    for( let i = 0; i < rows; i++ ) {
        for( let j = 0; j < cols; j++ ) {
            const mesh = new Mesh( gl, { geometry, program } );
            mesh.setParent( scene );
            mesh.position.x = distance * (j - (rows - 1) / 2);
            mesh.position.z = distance * (i - (cols - 1) / 2);
        }
    }
}

export { Engine };