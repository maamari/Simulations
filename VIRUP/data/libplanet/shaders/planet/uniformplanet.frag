#version 150 core

in vec3 f_position;

uniform float planetRadius;
uniform vec3 oblateness = vec3(1.0, 1.0, 1.0);
uniform vec3 color;
uniform vec3 lightpos;
uniform float lightradius;
uniform vec3 lightcolor;
uniform vec4 neighborsPosRadius[5];
uniform vec3 neighborsOblateness[5];

out vec4 outColor;

#include <planet/neighborOcclusion.glsl>

void main()
{
	vec3 pos           = planetRadius * normalize(f_position) * oblateness;
	vec3 norm          = normalize(normalize(f_position) / oblateness);
	vec3 posRelToLight = pos - lightpos;

	vec3 lightdir = -1.0 * normalize(posRelToLight);

	float coeff = max(0.0, dot(lightdir, norm));

	// NEIGHBORS
	float globalCoeffNeighbor = computeTotalNeighborsOcclusion(pos, lightpos);
	// END NEIGHBORS

	outColor = vec4(color, 1.0);
	outColor.rgb *= coeff * globalCoeffNeighbor;

	outColor.rgb *= lightcolor;
}
