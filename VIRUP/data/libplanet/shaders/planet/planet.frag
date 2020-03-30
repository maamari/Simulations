#version 150 core

in vec3 f_position;
in mat3 f_tantoworld;
in vec4 f_lightrelpos;

uniform sampler2D diff;
uniform sampler2D norm;
uniform sampler2D specular;
uniform sampler2D night;
uniform sampler2D texRing;

uniform float innerRing;
uniform float outerRing;

uniform vec3 oblateness = vec3(1.0, 1.0, 1.0);
uniform vec3 campos;
uniform vec3 lightpos;
uniform float lightradius;
uniform vec3 lightcolor;
uniform vec4 neighborsPosRadius[5];
uniform vec3 neighborsOblateness[5];

// only if custom mesh would it be -1, -1
uniform vec2 flipCoords = vec2(1.0, 1.0);

// ATMOSPHERE

uniform float planetRadius;
uniform float atmRadius;
uniform vec2 H0;
uniform vec3 betaR;
uniform vec3 betaM;

uniform sampler2D preproc;
uniform sampler2DShadow shadowmap;

out vec4 outColor;

#include <planet/ground.glsl>
#include <shadows.glsl>

void main()
{
	vec3 p             = normalize(f_position);
	vec3 ptex = p;
	ptex.xy   = flipCoords * ptex.xy;
	float lat = asin(ptex.z);
	float lon = atan(ptex.y, ptex.x) + PI;
	if(lon > PI)
	{
		lon -= 2.0 * PI;
	}
	vec2 coords = vec2((lon / PI) * 0.5 + 0.5, 1.0 - lat / (PI) -0.5);

	outColor = getGroundColor(p, coords, 1.0);
	outColor.rgb *= computeShadow(f_lightrelpos, shadowmap);
}
