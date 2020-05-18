#ifndef GROUND
#define GROUND

#include <planet/neighborOcclusion.glsl>
#include <planet/scattering.glsl>

vec4 getGroundColor(vec3 p, vec2 coords, float useShadowMapping)
{
	vec3 pos           = planetRadius * normalize(p) * oblateness;
	vec3 norm_pos      = normalize(p / oblateness);
	vec3 posRelToLight = pos - lightpos;

	vec3 lightdir = -1.0 * normalize(posRelToLight);

	vec4 diffuse    = texture(diff, coords);
	vec4 specular   = texture(specular, coords);
	vec4 nightcolor = texture(night, coords);
	vec3 normal     = texture(norm, coords).xyz;

	normal = normalize(normal * 2.0 - 1.0); // from [0;1] to [-1;1]
	normal.y *= -1.0;
	normal = f_tantoworld * normal;

	// 0 or 1
	// if no shadow mapping, avoids lighting stuff behind the planet
	float coeff_pos = mix(dot(lightdir, norm_pos), 1.0, useShadowMapping);
	float coeff     = max(0.0, dot(lightdir, normal));

	// NEIGHBORS
	float globalCoeffNeighbor = computeTotalNeighborsOcclusion(pos, lightpos);
	// END NEIGHBORS

	// RINGS SHADOW
	float coeffRings = 1.0;
	if(outerRing > 0.0 && sign(lightdir.z) != sign(pos.z))
	{
		vec3 pointOnRings = pos + lightdir * abs(pos.z / lightdir.z);
		float alt         = length(pointOnRings);
		if(alt >= innerRing && alt <= outerRing)
		{
			float texCoord = (alt - innerRing) / (outerRing - innerRing);
			coeffRings     = 1.0 - texture(texRing, vec2(texCoord, 0.5)).a;
		}
	}
	// END RINGS SHADOW

	vec4 result = diffuse;

	// specular
	vec3 viewDir    = normalize(campos - pos);
	vec3 reflectDir = reflect(-1.0*normalize(lightpos), normal);
	float spec      = pow(max(dot(viewDir, reflectDir), 0.0), 32);
	result.rgb += spec * lightcolor * max(0.0, coeff) * specular.rgb * 0.1;
	// result.rgb /= 2.0;

	result = mix(nightcolor / 100.0, result,
	             coeff * min(1.0, max(0.0, coeff_pos + 0.1) * 10.0));
	// result.rgb *= lightcolor;
	// return result;

	// ATMOSPHERE
	if(H0 != vec2(0.0))
	{
		vec3 l = normalize(lightpos / oblateness);

		vec3 pA = campos / oblateness;
		vec3 pB = pos / oblateness;

		vec3 dir = normalize(pB - pA);

		vec2 res = sphereIntersect(pA, dir, atmRadius);
		if(res.x > 0.0)
		{
			pA += dir * res.x;
		}

		vec3 pC = pB + l * sphereIntersect(pB, l, atmRadius).y;

		float lightcoeff = 3.0 / (lightcolor.r + lightcolor.g + lightcolor.b);

		vec3 beta0[2] = vec3[](betaR, betaM);
		vec3 I = fullScatteringPreproc(lightcoeff * vec3(20.0) * lightcolor, pA,
		                               pB, beta0, H0, planetRadius, atmRadius,
		                               l, preproc);

		vec3 Ie = lightcoeff * vec3(20.0) * lightcolor
		          * exp(-1.0
		                    * subTPreproc(pA, pB, H0.x, planetRadius, atmRadius,
		                                  betaR, preproc)
		                - tPreproc(pB, l, H0.x, planetRadius, atmRadius, betaR,
		                           preproc));
		result.rgb = Ie * result.rgb + I;
	}
	result.rgb *= coeffRings * globalCoeffNeighbor;

	return result;
}
#endif
