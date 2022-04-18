import lights_fragment_begin from './chunks/lights_fragment_begin.glsl.js';
import lights_phong_pars_fragment from './chunks/lights_phong_pars_fragment.glsl.js';
import debug_fragment_output from './chunks/debug_fragment_output.glsl.js';


const finalRenderFragment2 = /*glsl*/`#version 300 es
    precision highp float;
    #define PHONG

    in vec2 vUv;
    
    // Built-in three.js uniforms
    // uniform mat4 modelMatrix; // = object.matrixWorld
    // uniform mat4 modelViewMatrix; // = camera.matrixWorldInverse * object.matrixWorld
    // uniform mat4 projectionMatrix; // = camera.projectionMatrix
    uniform mat4 viewMatrix; // = camera.matrixWorldInverse
    // uniform mat3 normalMatrix; // = inverse transpose of modelViewMatrix
    uniform vec3 cameraPosition; // = camera position in world space

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
    #include <lights_pars_begin>

    // #include <normal_pars_fragment>

    ${ lights_phong_pars_fragment }

    // #include <shadowmap_pars_fragment>
    // #include <bumpmap_pars_fragment>
    // #include <normalmap_pars_fragment>
    // #include <specularmap_pars_fragment>
    // #include <logdepthbuf_pars_fragment>
    // #include <clipping_planes_pars_fragment>

    void main() {

        // G-Buffer data
        vec2 uv = vUv;
        vec3 position = texture( gPosition, uv ).xyz;
        float depth = texture( gPosition, uv ).a;
        vec3 normal = normalize( texture( gNormal, uv ).xyz );
        vec3 diffuseColor = texture( gDiffuse, uv ).rgb;
        vec3 emissiveColor = texture( gEmissive, uv ).rgb;
        float shininess = texture( gEmissive, uv ).a;
        vec3 specular = vec3( texture( gNormal, uv ).a );

        vec4 mvPosition = viewMatrix * vec4( position, 1.0 );
        vec3 vViewPosition = - mvPosition.xyz;

	    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
        // TODO: vec3 totalEmissiveRadiance = emissive;

        // Accumulation
        // #include <lights_phong_fragment> : edited start
        BlinnPhongMaterial material;
        material.diffuseColor = diffuseColor.rgb;
        material.specularColor = specular;
        material.specularShininess = shininess;
        material.specularStrength = 1.0;
        // #include <lights_phong_fragment> : edited end
        ${ lights_fragment_begin }
        // #include <lights_fragment_maps>
        #include <lights_fragment_end>

        vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + 
            reflectedLight.directSpecular + reflectedLight.indirectSpecular + emissiveColor;

        finalColor = vec4( outgoingLight, 1.0 );
    }
`;

const finalRenderVertex = /*glsl*/`
    // #version 300 es
    // precision highp float;

    // in vec3 position;
    // in vec2 uv;

    // uniform mat4 modelViewMatrix;
    // uniform mat4 projectionMatrix;
    // uniform mat3 normalMatrix;

    out vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4( position, 1.0 );
    }
`;

const finalRenderFragment = /*glsl*/`
    // #version 300 es
    // precision highp float;
    // #define PHONG

    in vec2 vUv;

    // struct HemisphereLight {
	// 	vec3 direction;
	// 	vec3 skyColor;
	// 	vec3 groundColor;
	// };
    
    // Built-in three.js uniforms
    // uniform mat4 modelMatrix; // = object.matrixWorld
    // uniform mat4 modelViewMatrix; // = camera.matrixWorldInverse * object.matrixWorld
    // uniform mat4 projectionMatrix; // = camera.projectionMatrix
    // uniform mat3 normalMatrix; // = inverse transpose of modelViewMatrix
    // uniform mat4 viewMatrix; // = camera.matrixWorldInverse
    // uniform vec3 cameraPosition; // = camera position in world space

    uniform sampler2D gPosition;
    uniform sampler2D gNormal;
    uniform sampler2D gDiffuse;
    uniform sampler2D gEmissive;

    uniform sampler2D dynamicLights;

    uniform sampler2D forwardRender;

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
    uniform bool receiveShadow;
    uniform vec3 ambientLightColor;
    uniform vec3 ambientLight; // custom ambient light uniform
    uniform vec3 lightProbe[ 9 ];

    // get the irradiance (radiance convolved with cosine lobe) at the point 'normal' on the unit sphere
    // source: https://graphics.stanford.edu/papers/envmap/envmap.pdf
    vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {

        // normal is assumed to have unit length

        float x = normal.x, y = normal.y, z = normal.z;

        // band 0
        vec3 result = shCoefficients[ 0 ] * 0.886227;

        // band 1
        result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
        result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
        result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;

        // band 2
        result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
        result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
        result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
        result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
        result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );

        return result;

    }

    vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {

        vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
        vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
        return irradiance;

    }

    vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {

        vec3 irradiance = ambientLightColor;
        return irradiance;

    }

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

    // #if NUM_DIR_LIGHTS > 0
    #if NR_OF_DIR_LIGHTS > 0

        struct DirectionalLight {
            vec3 direction;
            vec3 color;
        };

        // uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
        uniform DirectionalLight directionalLights[ NR_OF_DIR_LIGHTS ];

        void getDirectionalLightInfo( const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight light ) {

            light.color = directionalLight.color;
            light.direction = directionalLight.direction;
            light.visible = true;

        }
    #endif


    #if NUM_RECT_AREA_LIGHTS > 0

        struct RectAreaLight {
            vec3 color;
            vec3 position;
            vec3 halfWidth;
            vec3 halfHeight;
        };

        // Pre-computed values of LinearTransformedCosine approximation of BRDF
        // BRDF approximation Texture is 64x64
        uniform sampler2D ltc_1; // RGBA Float
        uniform sampler2D ltc_2; // RGBA Float

        uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
    #endif


    // #if NUM_HEMI_LIGHTS > 0
    #if NR_OF_HEMI_LIGHTS > 0

        struct HemisphereLight {
            vec3 direction;
            vec3 skyColor;
            vec3 groundColor;
        };

        // uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
        // uniform HemisphereLight hemisphereLights[ NR_OF_HEMI_LIGHTS ];
        uniform HemisphereLight hemiLights[ NR_OF_HEMI_LIGHTS ];

        vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {

            float dotNL = dot( normal, hemiLight.direction );
            float hemiDiffuseWeight = 0.5 * dotNL + 0.5;

            vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );

            return irradiance;
        }
    #endif
    // #include <lights_pars_begin> : edited end

    // #include <normal_pars_fragment>

    ${ lights_phong_pars_fragment }

    // #include <shadowmap_pars_fragment>
    // #include <bumpmap_pars_fragment>
    // #include <normalmap_pars_fragment>
    // #include <specularmap_pars_fragment>
    // #include <logdepthbuf_pars_fragment>
    // #include <clipping_planes_pars_fragment>

    void main() {

        // G-Buffer data
        vec2 uv = vUv;
        vec3 position = texture( gPosition, uv ).xyz;
        float depth = texture( gPosition, uv ).a;
        vec3 normal = normalize( texture( gNormal, uv ).xyz );
        vec3 diffuseColor = texture( gDiffuse, uv ).rgb;
        vec3 emissiveColor = texture( gEmissive, uv ).rgb;
        float shininess = texture( gEmissive, uv ).a;
        vec3 specular = vec3( texture( gNormal, uv ).a );

        vec4 mvPosition = viewMatrix * vec4( position, 1.0 );
        vec3 vViewPosition = - mvPosition.xyz;

	    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
        // TODO: vec3 totalEmissiveRadiance = emissive;

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
        // geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
        // geometry.viewDir = normalize( vViewPosition );

        geometry.position = position;
        geometry.normal = normalize( normal );
        geometry.viewDir = normalize( cameraPosition - position );

        IncidentLight directLight;

        #if ( NR_OF_DIR_LIGHTS > 0 ) && defined( RE_Direct )

            DirectionalLight directionalLight;
            #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
                DirectionalLightShadow directionalLightShadow;
            #endif

            #pragma unroll_loop_start
            for ( int i = 0; i < NR_OF_DIR_LIGHTS; i ++ ) {

                directionalLight = directionalLights[ i ];

                getDirectionalLightInfo( directionalLight, geometry, directLight );

                #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
                directionalLightShadow = directionalLightShadows[ i ];
                directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
                #endif

                RE_Direct( directLight, geometry, material, reflectedLight );

            }
            #pragma unroll_loop_end
        #endif

        #if defined( RE_IndirectDiffuse )

            vec3 iblIrradiance = vec3( 0.0 );
            // vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
            vec3 irradiance = getAmbientLightIrradiance( ambientLight );
            // vec3 irradiance = ambientLight;
            irradiance += getLightProbeIrradiance( lightProbe, geometry.normal );

            #if ( NUM_HEMI_LIGHTS > 0 )

                #pragma unroll_loop_start
                for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {

                    irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry.normal );

                }
                #pragma unroll_loop_end
            #endif

            #if ( NR_OF_HEMI_LIGHTS > 0 )

                #pragma unroll_loop_start
                for ( int i = 0; i < NR_OF_HEMI_LIGHTS; i ++ ) {

                    irradiance += getHemisphereLightIrradiance( hemiLights[ i ], geometry.normal );
                }
                #pragma unroll_loop_end

            #endif
        #endif

        #if defined( RE_IndirectSpecular )
            vec3 radiance = vec3( 0.0 );
            vec3 clearcoatRadiance = vec3( 0.0 );
        #endif
        // #include <lights_fragment_begin> : edited end

        #include <lights_fragment_end>

        vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + 
            reflectedLight.directSpecular + reflectedLight.indirectSpecular + emissiveColor;
        // vec3 outgoingLight = reflectedLight.indirectDiffuse;

        outgoingLight += texture( dynamicLights, uv ).xyz;

        finalColor = vec4( outgoingLight, 1.0 );
        // finalColor = vec4( normal, 1.0 );
        // finalColor = vec4( ambientLight, 1.0 );
        // finalColor = texture( dynamicLights, uv );
        // finalColor = texture( forwardRender, uv );
    }
`;

export { finalRenderVertex, finalRenderFragment };