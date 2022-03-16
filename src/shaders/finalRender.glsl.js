import lights_fragment_begin from './chunks/lights_fragment_begin.glsl.js';
import lights_phong_pars_fragment from './chunks/lights_phong_pars_fragment.glsl.js';
import debug_fragment_output from './chunks/debug_fragment_output.glsl.js';


const finalRenderFragment = /*glsl*/`#version 300 es
    precision highp float;
    #define PHONG

    in vec2 vUv;
    
    // Built-in three.js uniforms
    // uniform mat4 modelMatrix; // = object.matrixWorld
    // uniform mat4 modelViewMatrix; // = camera.matrixWorldInverse * object.matrixWorld
    // uniform mat4 projectionMatrix; // = camera.projectionMatrix
    uniform mat4 viewMatrix; // = camera.matrixWorldInverse
    // uniform mat3 normalMatrix; // = inverse transpose of modelViewMatrix
    uniform vec3 cameraPosition; // = camera position in world space (orthographic for deferred shaded quad)

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

export { finalRenderFragment };