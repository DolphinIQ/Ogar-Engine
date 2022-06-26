
const gBufferFragment = /*glsl*/`

    in vec3 vPosition;
    in vec3 vNormal;
    in vec2 vUv;
    in vec3 vViewPosition;

    #include <map_pars_fragment>
    #include <emissivemap_pars_fragment>
    #include <bumpmap_pars_fragment>
    #include <normalmap_pars_fragment>
    #include <specularmap_pars_fragment>

    uniform float uCameraNear;
    uniform float uCameraFar;
    uniform float uSpecular;
    uniform float uShininess;
    uniform vec3 uColor;
    uniform vec3 uEmissive;

    #include <packing>

    float getLinearDepth( float fragZ, float cameraNear, float cameraFar ) {
        float viewZ = perspectiveDepthToViewZ( fragZ, cameraNear, cameraFar );
        return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
    }

    layout(location = 0) out vec4 gPosition;
    layout(location = 1) out vec4 gNormal;
    layout(location = 2) out vec4 gColor;
    layout(location = 3) out vec4 gEmissive;

    void main() {
        vec3 position = vPosition; // world position
        vec2 uv = vUv;
        // float depth = 1.0 - getLinearDepth( gl_FragCoord.z, uCameraNear, uCameraFar );
        float depth = 1.0 - gl_FragCoord.z;

        vec4 diffuseColor = vec4( uColor, 1.0 );
        vec3 totalEmissiveRadiance = uEmissive;
        float specularColor = uSpecular;

        #ifdef USE_MAP
            vec4 texelColor = texture2D( map, uv );
            texelColor = mapTexelToLinear( texelColor );
            diffuseColor *= texelColor;
        #endif
        
        #ifdef USE_EMISSIVEMAP
            vec4 emissiveColor = texture2D( emissiveMap, uv );
            emissiveColor.rgb = emissiveMapTexelToLinear( emissiveColor ).rgb;
            totalEmissiveRadiance *= emissiveColor.rgb;
        #endif

        // #include <specularmap_fragment>
        float specularStrength;
        #ifdef USE_SPECULARMAP
            vec4 texelSpecular = texture2D( specularMap, vUv );
            specularStrength = texelSpecular.r;
        #else
            specularStrength = 1.0;
        #endif
        specularColor *= specularStrength;

        #include <normal_fragment_begin>

        // #include <normal_fragment_maps> : edited start
        #ifdef OBJECTSPACE_NORMALMAP
            // normal = texture2D( normalMap, uv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals

            // #ifdef FLIP_SIDED
            //     normal = - normal;
            // #endif

            // #ifdef DOUBLE_SIDED
            //     normal = normal * faceDirection;
            // #endif

            // normal = normalize( normalMatrix * normal );

            no_support_for_objectspace_normal_map

        #elif defined( TANGENTSPACE_NORMALMAP )

            vec3 mapN = texture2D( normalMap, uv ).xyz * 2.0 - 1.0;
            mapN.xy *= normalScale;

            #ifdef USE_TANGENT
                normal = normalize( vTBN * mapN );
            #else
                normal = perturbNormal2Arb( - vViewPosition, normal, mapN, faceDirection );
            #endif

        #elif defined( USE_BUMPMAP )

            normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );

        #endif
        // #include <normal_fragment_maps> : edited end


        // Write position, depth, normal, shading and color data to G-Buffer
        gPosition = vec4( position, depth );
        gNormal = vec4( normal, specularColor );
        gColor = diffuseColor;
        gEmissive = vec4( totalEmissiveRadiance, uShininess );
    }
`;

export { gBufferFragment };