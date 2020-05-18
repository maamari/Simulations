#version 150 core

in vec3 position;

uniform mat4 camera;
uniform vec3 oblateness = vec3(1.0);

uniform float planetRadius;
uniform float atmRadius;

out vec3 f_position;

void main()
{
	f_position  = normalize(position);

	gl_Position = camera * vec4((atmRadius / planetRadius) * normalize(position)*oblateness, 1.0);
}
