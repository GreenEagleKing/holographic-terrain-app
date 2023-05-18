uniform sampler2D uTexture;

varying float vElevation;
varying vec2 vUv;

#pragma glslify: getElevation = require('../partials/getElevation.glsl')
#pragma glslify: hslToRgb = require('../partials/hslToRgb.glsl')
#pragma glslify: getPerlinNoise3d = require('../partials/getPerlinNoise3d.glsl')

vec3 getBlueColor() {
    float hue = getPerlinNoise3d(vec3(vUv * 10.0, 0.0));
    vec3 hslColor = vec3(hue, 1.0, 0.5);
    vec3 blueColor = hslToRgb(hslColor);
    return blueColor;
}

void main() 
{
    vec3 uColor = vec3(1.0, 1.0, 1.0);

   vec3 blueColor = getBlueColor();

    vec4 textureColor = texture2D(uTexture, vec2(0.0, vElevation * 10.0));

    // float alpha = mod(vElevation * 10.0, 1.0);
    // alpha = step(0.95, alpha);

    vec3 color = mix(uColor, blueColor, textureColor.r);

    gl_FragColor = vec4(color, textureColor.a);
}