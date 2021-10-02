
const finalRenderFragment = /*glsl*/`#version 300 es
    precision highp float;

    in vec2 vUv;

    uniform sampler2D tPosition;
    uniform sampler2D tNormal;
    uniform sampler2D tDiffuse;

    out vec4 finalColor;

    void main() {
        vec2 uv = vUv;
        vec3 position = texture( tPosition, uv ).xyz;
        float depth = texture( tPosition, uv ).a;
        vec3 normal = texture( tNormal, uv ).xyz;
        vec3 diffuse = texture( tDiffuse, uv ).rgb;

        // finalColor = vec4( position, 1.0 );

        if( uv.x < 0.5 ) { // left side
            if( uv.y > 0.5 ) { // top
                finalColor = vec4( position, 1.0 );
            } else { // bottom
                finalColor = vec4( vec3( depth ), 1.0 );
            }
        } else { // right side
            if( uv.y > 0.5 ) { // top
                finalColor = vec4( normal, 1.0 );
            } else { // bottom
                finalColor = vec4( diffuse, 1.0 );
            }
        }
    }
`;

export { finalRenderFragment };