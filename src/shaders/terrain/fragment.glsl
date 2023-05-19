uniform sampler2D uTexture;
uniform float uTime;

varying float vElevation;
varying vec2 vUv;

#pragma glslify: getElevation = require('../partials/getElevation.glsl')
#pragma glslify: hslToRgb = require('../partials/hslToRgb.glsl')
#pragma glslify: getPerlinNoise2d = require('../partials/getPerlinNoise2d.glsl')

vec3 getBlueColor() {

    vec2 uv = vUv + uTime * 0.1;

    float hue = getPerlinNoise2d(uv * 5.0);
    float lightness = 0.55 + getPerlinNoise2d(vUv * 20.0 + 1234.5) * 0.25;
    vec3 hslColor = vec3(hue, 1.0, lightness);
    vec3 blueColor = hslToRgb(hslColor);
    return blueColor;
}

void main() 
{
    vec3 uColor = vec3(1.0, 1.0, 1.0);

   vec3 blueColor = getBlueColor();
    vec4 textureColor = texture2D(uTexture, vec2(0.0, vElevation * 10.0));

    vec3 color = mix(uColor, blueColor, textureColor.r);

    float fadeSideAmplitude = 0.2;
    float sideAlpha = 1.0 - max(
        smoothstep(0.5 - fadeSideAmplitude, 0.5,  abs(vUv.x - 0.5)),
        smoothstep(0.5 - fadeSideAmplitude, 0.5, abs(vUv.y - 0.5)));

    gl_FragColor = vec4(color, textureColor.a * sideAlpha);

}