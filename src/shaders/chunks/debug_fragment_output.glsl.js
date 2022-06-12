export default /*glsl*/`

if( uv.x < 0.5 ) { // left side
    if( uv.y > 0.5 ) { // Left top
        finalColor = vec4( position, 1.0 );
    } else { // Left bottom
        finalColor = vec4( vec3( depth ), 1.0 );
    }
} else { // right side
    if( uv.y > 0.5 ) { // Right top
        finalColor = vec4( normal, 1.0 );
    } else { // Right bottom
        finalColor = vec4( diffuseColor, 1.0 );
    }
}
`;