import lights_phong_pars_fragment from './chunks/lights_phong_pars_fragment.glsl.js';

const lightSphereShader = {

    pointLightVertex: /*glsl*/`#version 300 es
        precision highp float;

        in vec3 position;

        in vec4 transform; // world position, distance
        in vec4 pointLight; // color, decay

        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;

        out vec4 vTransform; // world position, distance
        out vec4 vPointLight; // color, decay

        void main() {

            vTransform = transform;
            vPointLight = pointLight;

            // Scale the sphere by light distance and translate
            vec3 transformed = position * transform.w + transform.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( transformed, 1.0 );
        }
    `,
    pointLightFragment: /*glsl*/`#version 300 es
        precision highp float;
        
        // Built-in three.js uniforms
        uniform mat4 viewMatrix; // = camera.matrixWorldInverse
        uniform vec3 cameraPosition; // = camera position in world space

        uniform vec2 uScreenSize;
        uniform sampler2D gPosition;
        uniform sampler2D gNormal;
        uniform sampler2D gDiffuse;
        uniform sampler2D gEmissive;
        
        layout(location = 0) out vec4 finalColor;

        
        #include <common>
        #include <packing>

        // #include <dithering_pars_fragment>
        // #include <color_pars_fragment>
        // #include <uv_pars_fragment>
        // #include <uv2_pars_fragment>
        // #include <map_pars_fragment>
        // #include <alphamap_pars_fragment>
        // #include <alphatest_pars_fragment>
        // #include <aomap_pars_fragment>
        // #include <lightmap_pars_fragment>
        // #include <emissivemap_pars_fragment>
        // #include <envmap_common_pars_fragment>
        // #include <envmap_pars_fragment>
        // #include <cube_uv_reflection_fragment>
        // #include <fog_pars_fragment>

        #include <bsdfs>
        // #include <lights_pars_begin> : edited start
        float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {

            #if defined ( PHYSICALLY_CORRECT_LIGHTS )
                // based upon Frostbite 3 Moving to Physically-based Rendering
                // page 32, equation 26: E[window1]
                // https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
                float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );

                if ( cutoffDistance > 0.0 ) {
                    distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
                }
                return distanceFalloff;
            #else
                if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
                    return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
                }
                return 1.0;
            #endif
        }

        struct PointLight {
            vec3 position;
            vec3 color;
            float distance;
            float decay;
        };
        // light is an out parameter as having it as a return value caused compiler errors on some devices
        void getPointLightInfo( const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight light ) {

            vec3 lVector = pointLight.position - geometry.position;

            light.direction = normalize( lVector );

            float lightDistance = length( lVector );

            light.color = pointLight.color;
            light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
            light.visible = ( light.color != vec3( 0.0 ) );

        }
        // #include <lights_pars_begin> : edited end

        // #include <normal_pars_fragment>

        ${ lights_phong_pars_fragment }

        // #include <shadowmap_pars_fragment>
        // #include <bumpmap_pars_fragment>
        // #include <normalmap_pars_fragment>
        // #include <specularmap_pars_fragment>
        // #include <logdepthbuf_pars_fragment>
        // #include <clipping_planes_pars_fragment>

        // The single PointLight for each sphere
        in vec4 vTransform; // world position, distance
        in vec4 vPointLight; // color, decay

        vec2 CalcTexCoord() {
            return gl_FragCoord.xy / uScreenSize;
        }

        void main() {

            // G-Buffer data
            vec2 uv = CalcTexCoord();
            vec3 position = texture( gPosition, uv ).xyz;
            float depth = texture( gPosition, uv ).a;
            vec3 normal = normalize( texture( gNormal, uv ).xyz );
            vec3 diffuseColor = texture( gDiffuse, uv ).rgb;
            float shininess = texture( gEmissive, uv ).a;
            vec3 specular = vec3( texture( gNormal, uv ).a );

            ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

            // Accumulation
            // #include <lights_phong_fragment> : edited start
            BlinnPhongMaterial material;
            material.diffuseColor = diffuseColor.rgb;
            material.specularColor = specular;
            material.specularShininess = shininess;
            material.specularStrength = 1.0;
            // #include <lights_phong_fragment> : edited end

            // #include <lights_fragment_begin> : edited start
            GeometricContext geometry;
            // geometry.position = - vViewPosition;
            // geometry.normal = normalize( (viewMatrix * vec4( normal, 0.0 )).xyz );
            // geometry.viewDir = normalize( vViewPosition );
            geometry.position = position;
            geometry.normal = normalize( normal );
            geometry.viewDir = normalize( cameraPosition - position );

            IncidentLight directLight;

            PointLight fullPointLight = PointLight(
                vTransform.xyz,
                vPointLight.rgb,
                vTransform.w,
                vPointLight.w
            );

            getPointLightInfo( fullPointLight, geometry, directLight );

            // #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
            // pointLightShadow = pointLightShadows[ i ];
            // directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
            // #endif

            RE_Direct( directLight, geometry, material, reflectedLight );
            // float dotN = max( dot( geometry.normal, directLight.direction ), 0.0 );
            // reflectedLight.directDiffuse = diffuseColor * directLight.color * dotN;
            // #include <lights_fragment_begin> : edited end

            // #include <lights_fragment_maps>
            // #include <lights_fragment_end>

            vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + 
                reflectedLight.directSpecular + reflectedLight.indirectSpecular;

            finalColor = vec4( outgoingLight, 1.0 );
            // finalColor = vec4( 0.03, 0.0, 0.0, 1.0 );
        }
    `
}

export { lightSphereShader };