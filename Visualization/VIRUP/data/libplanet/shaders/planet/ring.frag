#version 150 core

in vec2 f_position;

uniform sampler2D tex;

uniform float innerRing;
uniform float outerRing;
uniform float planetRadius;
uniform vec3 oblateness = vec3(1.0, 1.0, 1.0);
uniform vec3 lightpos;
uniform float lightradius;
uniform vec3 lightcolor;
uniform vec4 neighborsPosRadius[5];
uniform vec3 neighborsOblateness[5];

out vec4 outColor;

#include <planet/neighborOcclusion.glsl>

void main()
{
	// make perfect circles
	if(length(f_position) < innerRing || length(f_position) > outerRing)
		discard;

	float alt      = length(f_position);
	float texCoord = (alt - innerRing) / (outerRing - innerRing);

	vec3 pos           = vec3(f_position, 0.0);
	vec3 posRelToLight = pos - lightpos;

	vec3 lightdir = -1.0 * normalize(posRelToLight);

	vec3 closestPoint = dot(lightdir, -1 * pos) * lightdir + pos;

	closestPoint /= oblateness;

	float coeff = 1.0;
	if(dot(lightdir, pos) < 0.0)
	{
		coeff -= getNeighborOcclusionFactor(lightradius * length(pos)
		                                        / length(posRelToLight),
		                                    planetRadius, length(closestPoint));
	}

	// NEIGHBORS
	float globalCoeffNeighbor = computeTotalNeighborsOcclusion(pos, lightpos);
	// END NEIGHBORS

	outColor = texture(tex, vec2(texCoord, 0.5));
	outColor.rgb *= coeff * globalCoeffNeighbor;

	outColor.rgb *= lightcolor;
}
