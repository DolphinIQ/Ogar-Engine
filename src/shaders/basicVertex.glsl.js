// The most basic vertex shader
const basicVertex = /*glsl*/`#version 300 es
    precision highp float;

    in vec3 position;
    in vec2 uv;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;

    out vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4( position, 1.0 );
    }
`;

export { basicVertex };