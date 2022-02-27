export default /*glsl*/`

if( uv.x < 0.5 ) { // left side
    if( uv.y > 0.5 ) { // top
        finalColor = vec4( position, 1.0 );
    } else { // bottom
        finalColor = vec4( vec3( depth ), 1.0 );
        // finalColor = vec4( outgoingLight, 1.0 );
        
        // finalColor = vec4( directionalLights[ 0 ].color, 1.0 );
        // finalColor = vec4( directionalLights[ 0 ].direction, 1.0 );

        // if ( directionalLights[ 0 ].color.r == 0.0 ) finalColor.r = 1.0;
        // if ( directionalLights[ 0 ].color.g == 0.0 ) finalColor.g = 1.0;
        // if ( directionalLights[ 0 ].color.b == 0.0 ) finalColor.b = 1.0;
        // if ( directionalLights[ 0 ].direction.r == 0.0 ) finalColor.r = 1.0;
        // if ( directionalLights[ 0 ].direction.g == 0.0 ) finalColor.g = 1.0;
        // if ( directionalLights[ 0 ].direction.b == 0.0 ) finalColor.b = 1.0;
    }
} else { // right side
    if( uv.y > 0.5 ) { // top
        finalColor = vec4( normal, 1.0 );
    } else { // bottom
        finalColor = vec4( diffuseColor, 1.0 );
    }
}
`;