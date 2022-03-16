
const gBufferVertex = /*glsl*/`

    out vec3 vPosition;
    out vec3 vNormal;
    out vec2 vUv;
    out vec3 vViewPosition;

    #ifndef FLAT_SHADED
        #ifdef USE_TANGENT

            varying vec3 vTangent;
            varying vec3 vBitangent;

        #endif
    #endif

    void main() {

        vec3 objectNormal = vec3( normal );
        #ifdef USE_TANGENT
            vec3 objectTangent = vec3( tangent.xyz );
        #endif
        #include <morphnormal_vertex>
        #include <skinbase_vertex>
	    #include <skinnormal_vertex>

        // #include <defaultnormal_vertex> : edited start
        vec3 transformedNormal = objectNormal;

        #ifdef USE_INSTANCING
            // this is in lieu of a per-instance normal-matrix
            // shear transforms in the instance matrix are not supported
            mat3 m = mat3( instanceMatrix );

            transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
            transformedNormal = m * transformedNormal;
        #endif

        // transformedNormal = normalMatrix * transformedNormal;

        #ifdef FLIP_SIDED
            transformedNormal = - transformedNormal;
        #endif

        #ifdef USE_TANGENT
            vec3 transformedTangent = ( modelViewMatrix * vec4( objectTangent, 0.0 ) ).xyz;

            #ifdef FLIP_SIDED
                transformedTangent = - transformedTangent;
            #endif
        #endif
        // #include <defaultnormal_vertex> : edited end

        #include <normal_vertex>


        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        vViewPosition = - mvPosition.xyz;

        // vNormal = normalize( (modelMatrix * vec4( transformedNormal, 0.0 )).xyz ); // world space normal
        vNormal = normalize( (modelMatrix * vec4( vNormal, 0.0 )).xyz ); // world space normal
        vUv = uv;
        vPosition = ( modelMatrix * vec4( position, 1.0 ) ).xyz; // vec4 * matrix4 =/= matrix4 * vec4

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`;

export { gBufferVertex };