#version 150 core

in vec3 position;
in vec3 normal;

uniform mat4 camera;
uniform mat4 lightspace;
uniform vec3 oblateness = vec3(1.0, 1.0, 1.0);
uniform float boundingSphereRadius;

out vec3 f_position;
out mat3 f_tantoworld;
out vec4 f_lightrelpos;

#include <shadows.glsl>

void main()
{
	f_position = position;

	vec3 transNorm;
	if(length(normal) == 0.0)
		transNorm = normalize(position / oblateness);
	else
		transNorm = normal;
	vec3 transTan   = cross(vec3(0.0, 0.0, 1.0), transNorm);
	vec3 transBiTan = cross(transNorm, transTan);

	f_tantoworld = mat3(transTan, transBiTan, transNorm);

	gl_Position   = camera * vec4(position * oblateness, 1.0);
	f_lightrelpos = computeLightSpacePosition(lightspace, position, normal,
	                                          boundingSphereRadius);
}
