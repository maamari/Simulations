#version 150 core

in vec2 position;

uniform mat4 camera;

uniform float planetRadius;

out vec2 f_position;

void main()
{
	f_position = planetRadius * position;

	gl_Position = camera * vec4(position, 0.0, 1.0);
}
