import { BufferGeometry, BufferAttribute, Vector3 } from 'three';

class PointLightHelperGeometry extends BufferGeometry {
    /**
     * Geometry for Unreal Engine style point light visualization
     * @param { Number } heightSegments - How many segments should each circle have.
     * The more segments, the smoother the circles are
     */
    constructor( heightSegments = 25 ) {
        super();

        const radius = 1;
        const stepY = radius * 2 / ( heightSegments - 1 );

        const forwardRing = [];
        const sideRing = [];
        const upRing = [];

        // Make one ring
        const vec3 = new Vector3();
        for ( let i = 0; i < heightSegments; i++ ) {
            vec3.y = radius - i * stepY;
            vec3.x = 1.0 - Math.abs( vec3.y );
            vec3.setLength( radius );
            forwardRing.push( vec3.x, vec3.y, vec3.z );
        }
        for ( let i = (heightSegments - 2) * 3; i >= 0; i-= 3 ) {
            forwardRing.push( -forwardRing[ i ], forwardRing[ i + 1 ], forwardRing[ i + 2 ] );
        }

        // Copy the ring with reversed X and Z
        for ( let i = 0, n = forwardRing.length; i < n; i+= 3 ) {
            sideRing.push( forwardRing[ i + 2 ], forwardRing[ i + 1 ], forwardRing[ i ] );
        }

        // A little "bridge" connecting side and up rings, so that the next ring starts in the right place
        for ( let i = 0, n = forwardRing.length / 4; i < n; i+= 3 ) {
            sideRing.push( forwardRing[ i ], forwardRing[ i + 1 ], forwardRing[ i + 2 ] );
        }

        // Copy the ring onto the "belt"
        for ( let i = 0, n = forwardRing.length; i < n; i+= 3 ) {
            upRing.push( forwardRing[ i + 1 ], forwardRing[ i + 2 ], forwardRing[ i ] );
        }

        const vertices = new Float32Array( [].concat( forwardRing, sideRing, upRing ) );
        this.setAttribute( 'position', new BufferAttribute( vertices, 3 ) );
    }
}

export { PointLightHelperGeometry };