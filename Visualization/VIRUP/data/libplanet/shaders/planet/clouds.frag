#version 150 core

in vec3 f_position;

uniform float planetRadius;
uniform vec3 oblateness;
uniform float cloudsHeight;

uniform vec3 lightpos;
uniform vec3 campos;
uniform float lightradius;
uniform vec3 lightcolor;
uniform vec4 neighborsPosRadius[5];
uniform vec3 neighborsOblateness[5];

// ATMOSPHERE

uniform float atmRadius;
uniform vec2 H0;
uniform vec3 betaR;
uniform vec3 betaM;

uniform sampler2D tex;
uniform sampler2D preproc;

out vec4 outColor;

#include <planet/neighborOcclusion.glsl>
#include <planet/scattering.glsl>

void main()
{
	vec3 pos       = normalize(f_position);
	vec3 cloudsPos = (planetRadius + cloudsHeight) * pos;

	vec3 posFromCam = cloudsPos - campos;

	if(isIntersectingSphere(campos, normalize(posFromCam),
	                        planetRadius))
	{
		float inter
		    = sphereIntersect(campos, normalize(posFromCam), planetRadius).x;
		if(inter > 0.0 && inter < length(posFromCam))
		{
			discard;
		}
	}

	float lat = asin(pos.z);
	float lon = atan(pos.y, pos.x) + PI;
	if(lon > PI)
	{
		lon -= 2.0 * PI;
	}
	vec2 coords = vec2((lon / PI) * 0.5 + 0.5, 1.0 - lat / (PI) -0.5);

	float alpha = texture(tex, coords).r;

	if(alpha == 0.0)
	{
		discard;
	}

	vec3 l = normalize(lightpos / oblateness);

	// clouds can see the sun beyond the 90° terminator limit
	float coslimit
	    = cos(PI / 2.0 + acos(planetRadius / (planetRadius + cloudsHeight)));
	outColor = vec4(
	    lightcolor
	        * vec3(max(0.0, (dot(pos, l) - coslimit) / (1.0 - coslimit))),
	    texture(tex, coords).r);

	vec3 beta0[2] = vec3[](betaR, betaM);
	vec3 pA       = cloudsPos;
	vec3 pB       = pA + l * sphereIntersect(pA, l, atmRadius).y;
	vec3 I = fullScatteringRPreproc(vec3(20.0) * lightcolor, pA, pB, beta0, H0,
	                                planetRadius, atmRadius, l, preproc);
	/*I += fullScatteringMPreproc(vec3(20.0) * lightcolor, pA, pB, betaM, H0M,
	                            planetRadius, atmRadius, l, preproc);*/

	/*vec3 Ie = vec3(20.0)
	          * exp(-1.0 * subTPreproc(pA, pB, H0R, planetRadius, atmRadius,
	   betaR, preproc)
	                - tPreproc(pB, l, H0R, planetRadius, atmRadius, betaR,
	   preproc));

	vec3 Ie = exp(
	    -1.0
	    * subTPreproc(pA, pB, H0R, planetRadius, atmRadius, betaR, preproc));
	*/
	outColor.rgb = pow(outColor.rgb, vec3(0.75)) * 0.8
	               + max(I, vec3(0.0)) * 0.2; //(Ie * outColor.rgb + 2.0*I);

	// NEIGHBORS
	float globalCoeffNeighbor
	    = computeTotalNeighborsOcclusion(cloudsPos, lightpos);
	// END NEIGHBORS
	outColor.rgb *= globalCoeffNeighbor;
}
