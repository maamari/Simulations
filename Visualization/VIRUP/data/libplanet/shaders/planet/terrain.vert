#version 150 core

in vec2 position;

uniform mat4 camera;

uniform vec3 campos;
uniform vec3 oblateness = vec3(1.0, 1.0, 1.0);

// only if custom mesh would it be -1, -1
uniform vec2 flipCoords = vec2(1.0, 1.0);

out vec2 f_position;
out float f_camlat;
out float f_camlon;
out float f_terrainAngleCoverage;
out mat3 f_tantoworld;

#define PI 3.14159265359

void main()
{
	vec3 ncp  = normalize(campos);
	f_camlat = asin(ncp.z);
	f_camlon = atan(ncp.y, ncp.x);

	f_terrainAngleCoverage = 2.0 * acos(1.0 / length(campos));

	f_position = position - 0.5;

	float deltalat;
	float deltalon;

	// if small angles don't compute unstable computations
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

	vec3 pos = vec3(cos(deltalat) * cos(deltalon),
	                cos(deltalat) * sin(deltalon), -1.0 * sin(deltalat));

	pos.xz = vec2(cos(f_camlat) * pos.x - sin(f_camlat) * pos.z,
	              cos(f_camlat) * pos.z + sin(f_camlat) * pos.x);
	// rotate to match lon
	pos.xy = vec2(cos(f_camlon) * pos.x - sin(f_camlon) * pos.y,
	              cos(f_camlon) * pos.y + sin(f_camlon) * pos.x);

	gl_Position = camera * vec4(pos * oblateness, 1.0);

	vec3 transNorm  = normalize(pos / oblateness);
	vec3 transTan   = cross(vec3(0.0, 0.0, 1.0), transNorm);
	vec3 transBiTan = cross(transNorm, transTan);

	f_tantoworld = mat3(transTan, transBiTan, transNorm);
}
