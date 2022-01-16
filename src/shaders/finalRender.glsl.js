import lights_fragment_begin from './chunks/light_fragment_begin.glsl.js';

const finalRenderFragment = /*glsl*/`#version 300 es
    precision highp float;
    #define PHONG

    // struct PointLight {
    //     vec3 color;
    //     vec3 position;
    //     float intensity;
    //     float radius;
    // };

    // struct DirectionalLight {
    //     vec3 color;
    //     vec3 position;
    //     float intensity;
    // };

    struct Material {
        bool unlit;
        vec3 diffuse;
        vec3 specular;
        float shininess;
    };

    in vec2 vUv;
    
    // Built-in three.js uniforms
    uniform mat4 modelMatrix; // = object.matrixWorld
    uniform mat4 modelViewMatrix; // = camera.matrixWorldInverse * object.matrixWorld
    uniform mat4 projectionMatrix; // = camera.projectionMatrix
    uniform mat4 viewMatrix; // = camera.matrixWorldInverse
    uniform mat3 normalMatrix; // = inverse transpose of modelViewMatrix
    // uniform vec3 cameraPosition; // = camera position in world space (orthographic for deferred shaded quad)

    uniform sampler2D tPosition;
    uniform sampler2D tNormal;
    uniform sampler2D tDiffuse;
    uniform sampler2D tSpecular;
    uniform vec3 uCameraPosition;
    uniform Material materials[ 256 ];

    out vec4 finalColor;

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
    // #include <lights_pars_begin>
    uniform bool receiveShadow;
    uniform vec3 ambientLightColor;
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

    #if NUM_DIR_LIGHTS > 0

        struct DirectionalLight {
            vec3 direction;
            vec3 color;
        };

        uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

        void getDirectionalLightInfo( const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight light ) {

            light.color = directionalLight.color;
            light.direction = directionalLight.direction;
            light.visible = true;

        }

        // finalColor = vec4( directionalLights[ 0 ].color, 1.0 );

    #endif
    // #include <normal_pars_fragment>

    // edited: #include <lights_phong_pars_fragment>
    // vec4 mvPosition = 
    // varying vec3 vViewPosition;
    struct BlinnPhongMaterial {
        vec3 diffuseColor;
        vec3 specularColor;
        float specularShininess;
        float specularStrength;
    };
    void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
        float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
        vec3 irradiance = dotNL * directLight.color;
        reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
        reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularShininess ) * material.specularStrength;
    }
    void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
        reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
    }
    #define RE_Direct				RE_Direct_BlinnPhong
    #define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong
    #define Material_LightProbeLOD( material )	(0)
    // end edited: #include <lights_phong_pars_fragment>
    
// #include <shadowmap_pars_fragment>
// #include <bumpmap_pars_fragment>
// #include <normalmap_pars_fragment>
// #include <specularmap_pars_fragment>
// #include <logdepthbuf_pars_fragment>
// #include <clipping_planes_pars_fragment>

    void main() {

        // G-Buffer data
        vec2 uv = vUv;
        vec3 position = texture( tPosition, uv ).xyz;
        float depth = texture( tPosition, uv ).a;
        vec3 normal = normalize( texture( tNormal, uv ).xyz );
        float materialID = texture( tNormal, uv ).a * 255.0;
        vec3 diffuseColor = texture( tDiffuse, uv ).rgb;
        vec3 specular = texture( tSpecular, uv ).rgb;
        float shininess = texture( tSpecular, uv ).a;

        vec3 vViewPosition = uCameraPosition - position;
        // reflect()

	    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
        // TODO: vec3 totalEmissiveRadiance = emissive;

        // Accumulation
        // edited: #include <lights_phong_fragment>
        BlinnPhongMaterial material;
        material.diffuseColor = diffuseColor.rgb;
        material.specularColor = specular;
        material.specularShininess = shininess;
        material.specularStrength = 1.0;
        // end edited: #include <lights_phong_fragment>
        // #include <lights_fragment_begin>
        ${ lights_fragment_begin }
        // #include <lights_fragment_maps>
        #include <lights_fragment_end>

        // vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + 
        //     reflectedLight.directSpecular + reflectedLight.indirectSpecular;
        vec3 outgoingLight = reflectedLight.directDiffuse;

        // finalColor = vec4( position, 1.0 );

        if( uv.x < 0.5 ) { // left side
            if( uv.y > 0.5 ) { // top
                finalColor = vec4( position, 1.0 );
            } else { // bottom
                // finalColor = vec4( vec3( depth ), 1.0 );
                // finalColor = vec4( outgoingLight, 1.0 );
                
                // finalColor = vec4( directionalLights[ 0 ].color, 1.0 );
                // finalColor = vec4( vec3(0.6), 1.0 );
                finalColor = vec4( directionalLights[ 0 ].color, 1.0 );

                // if ( directionalLights[ 0 ].color.r == 0.0 )finalColor.r = 1.0;
                // if ( directionalLights[ 0 ].color.g == 0.0 )finalColor.g = 1.0;
                // if ( directionalLights[ 0 ].color.b == 0.0 )finalColor.b = 1.0;
            }
        } else { // right side
            if( uv.y > 0.5 ) { // top
                finalColor = vec4( normal, 1.0 );
            } else { // bottom
                finalColor = vec4( diffuseColor, 1.0 );
            }
        }
    }
`;

export { finalRenderFragment };