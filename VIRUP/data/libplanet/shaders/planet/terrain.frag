#version 150 core

in vec2 f_position;
in float f_camlat;
in float f_camlon;
in float f_terrainAngleCoverage;
in mat3 f_tantoworld;

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

out vec4 outColor;

//#define PI 3.14159265359
#include <planet/ground.glsl>


void main()
{
	float deltalat;
	float deltalon;

	if(length(f_position) < 0.008 / f_terrainAngleCoverage
	   || abs(f_position.x) < 0.002 / f_terrainAngleCoverage)
	{
		deltalat = f_position.y * f_terrainAngleCoverage;
		deltalon = f_position.x * f_terrainAngleCoverage;
	}
	else
	{
		float angleToCenterRad = length(f_position) * f_terrainAngleCoverage;
		// azimuth := angle above parallel
		float azimuthRad = atan(f_position.y, f_position.x);

		deltalat = asin(sin(azimuthRad) * sin(angleToCenterRad));
		deltalon = acos(cos(angleToCenterRad) / cos(deltalat));

		if(abs(azimuthRad) > PI / 2.0)
		{
			deltalon *= -1.0;
		}
	}

	vec3 posIfNullLatlon = vec3(cos(deltalat) * cos(deltalon),
	                            cos(deltalat) * sin(deltalon), sin(deltalat));

	// rotate to match lat
	posIfNullLatlon.xz = vec2(
	    cos(f_camlat) * posIfNullLatlon.x + sin(f_camlat) * posIfNullLatlon.z,
	    cos(f_camlat) * posIfNullLatlon.z - sin(f_camlat) * posIfNullLatlon.x);
	// rotate to match lon
	posIfNullLatlon.xy = vec2(
	    cos(f_camlon) * posIfNullLatlon.x - sin(f_camlon) * posIfNullLatlon.y,
	    cos(f_camlon) * posIfNullLatlon.y + sin(f_camlon) * posIfNullLatlon.x);

	posIfNullLatlon.z *= -1.0;

	vec3 ptex = posIfNullLatlon;
	ptex.xy   = flipCoords * ptex.xy;
	float lat = asin(ptex.z);
	float lon = atan(ptex.y, ptex.x) + PI;
	if(lon > PI)
	{
		lon -= 2.0 * PI;
	}
	vec2 coords = vec2((lon / PI) * 0.5 + 0.5, 1.0 - lat / (PI) -0.5);

	if(coords.x >= 1.0)
		coords.x -= 1.0;
	coords.x = clamp(coords.x, 0.00001, 0.99999);
	coords.y = clamp(coords.y, 0.001, 0.999);

	outColor = getGroundColor(posIfNullLatlon, coords, 0.0);
}
