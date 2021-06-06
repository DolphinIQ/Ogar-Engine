const lightsChunks = {
    ['light_parameters']: `
        uniform vec3 uLightDirection;
        uniform float uAmbientLightIntensity;
    `,
    ['light_contribution']: `
        float lightContribution = max( dot( normal, uLightDirection ), 0.0 ) + uAmbientLightIntensity;
    `
}