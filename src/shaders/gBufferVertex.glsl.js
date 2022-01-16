
const gBufferVertex = /*glsl*/`#version 300 es
    precision highp float;

    in vec3 position;
    in vec3 normal;
    in vec2 uv;

    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;

    out vec3 vPosition;
    out vec3 vNormal;
    out vec2 vUv;

    void main() {
        vNormal = normalize( normal );
        vUv = uv;
        vPosition = ( modelMatrix * vec4( position, 1.0 ) ).xyz; // vec4 * matrix4 =/= matrix4 * vec4

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`;

export { gBufferVertex };