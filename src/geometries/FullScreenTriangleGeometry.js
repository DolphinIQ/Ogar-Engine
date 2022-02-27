import { BufferGeometry, BufferAttribute } from 'three';

/**
 * Geometry for a full-screen triangle. Compared to using a quad, this approach harmonizes with modern 
 * GPU rasterization patterns and eliminates unnecessary fragment calculations along the screen diagonal. 
 * This is especially beneficial for GPGPU passes and effects that use complex fragment shaders.
 */
class FullScreenTriangleGeometry extends BufferGeometry {
    constructor() {
        super();

        const vertices = new Float32Array([ -1, -1, -1, 3, -1, -1, -1, 3, -1 ]);
        const uvs = new Float32Array([ 0, 0, 2, 0, 0, 2 ]);
        this.setAttribute( 'position', new BufferAttribute( vertices, 3 ) );
        this.setAttribute( 'uv', new BufferAttribute( uvs, 2 ) );
    }
}

export { FullScreenTriangleGeometry };