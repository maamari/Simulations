#version 150 core

in vec2 position;

out vec2 texCoord;

void main()
{
    texCoord = position + vec2(0.5);
    gl_Position = vec4(2.0*position, 0.0, 1.0);
}
