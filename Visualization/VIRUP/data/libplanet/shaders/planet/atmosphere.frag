#version 150 core

// Conventions From :
// https://developer.nvidia.com/gpugems/GPUGems2/gpugems2_chapter16.html

in vec3 f_position;

uniform vec3 lightpos;
uniform vec3 campos;

uniform vec3 oblateness;
uniform float planetRadius;
uniform float atmRadius;
uniform float lightradius;
uniform vec3 lightcolor;
uniform vec4 neighborsPosRadius[5];
uniform vec3 neighborsOblateness[5];

uniform vec2 H0;
uniform vec3 betaR;
uniform vec3 betaM;

uniform sampler2D preproc;

out vec4 outColor;

#include <planet/scattering.glsl>

void main()
{
	vec3 lightdir = normalize(lightpos / oblateness);

	vec3 pA = campos / oblateness;
	vec3 pB = atmRadius * normalize(f_position);

	vec3 dir = normalize(pB - pA);

	vec2 res = sphereIntersect(pA, dir, atmRadius);
	if(res.x > 0.0)
	{
		pA += dir * res.x;
	}

	outColor.a = 1.0;

	float coeff = 3.0 / (lightcolor.r + lightcolor.g + lightcolor.b);

	vec3 beta0[2] = vec3[](betaR, betaM);
	vec3 I = fullScatteringPreproc(coeff*vec3(20.0) * lightcolor, pA, pB, beta0, H0, planetRadius,
	                         atmRadius, lightdir, preproc);

	outColor.rgb = I;
	// ad hoc...
	vec3 Ie      = vec3(1.0) - pow(tPreproc(pA, dir, H0.x, planetRadius, atmRadius, betaR, preproc), vec3(3.0));
	outColor.a = (Ie.r + Ie.g + Ie.b) / 3.0;
}
