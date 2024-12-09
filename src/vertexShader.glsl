
attribute vec3 position;
attribute vec3 normal;

uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix; 

out vec4 vColor;

void main() {
    vColor = vec4(normal, 1.f);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.f);
}