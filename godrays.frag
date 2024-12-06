#version 330 core

in vec2 textureUV;
out vec4 fragColor;

uniform sampler2D texture0;
uniform vec2 lightPositionOnScreen;

const int NUM_SAMPLES = 100; //smoothness (higher = better quality but slower generation)
const float DECAY = 1; //controls fallof (higher = smooth/natural, lower = extended/less realistic) ... just keep at 1
const float DENSITY = 0.01; //increases/decreases the density of rays (higher = packed/foggy, lower = spread out) -> 0.9 makes weird laser beams
const float WEIGHT = 0.02; //brightness -> increases/decreases intensity of rays

void main() {
    vec2 deltaTexCoord = (textureUV - lightPositionOnScreen) * DENSITY;
    vec2 texCoord = textureUV;
    float illuminationDecay = 1.0;

    vec4 color = vec4(0.0);
    for (int i = 0; i < NUM_SAMPLES; i++) {
        texCoord -= deltaTexCoord;
        vec4 temp = texture(texture0, texCoord);
        temp *= illuminationDecay * WEIGHT;
        color += temp;
        illuminationDecay *= DECAY;
    }

    fragColor = color;
}
