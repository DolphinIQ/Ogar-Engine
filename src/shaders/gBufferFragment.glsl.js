
const gBufferFragment = /*glsl*/`#version 300 es
    precision highp float;

    uniform sampler2D tDiffuse;
    uniform float uCameraNear;
    uniform float uCameraFar;

    in vec3 vPosition;
    in vec3 vNormal;
    in vec2 vUv;

    #include <packing>

    float getLinearDepth( float fragZ, float cameraNear, float cameraFar ) {
        float viewZ = perspectiveDepthToViewZ( fragZ, cameraNear, cameraFar );
        return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
    }

    layout(location = 0) out vec4 gPosition;
    layout(location = 1) out vec4 gNormal;
    layout(location = 2) out vec4 gColor;

    void main() {
        vec3 position = vPosition; // world position
        vec3 normal = normalize( vNormal );
        vec2 uv = vUv;
        float depth = 1.0 - getLinearDepth( gl_FragCoord.z, uCameraNear, uCameraFar );

        vec4 color = texture( tDiffuse, uv );

        // Write position, depth, normal and color data to G-Buffer
        gPosition = vec4( position, depth );
        gNormal = vec4( normal, 1.0 );
        gColor = color;
    }
`;

export { gBufferFragment };