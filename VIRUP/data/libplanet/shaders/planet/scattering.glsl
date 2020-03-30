#ifndef SCATTERING
#define SCATTERING

#include <planet/neighborOcclusion.glsl>

const float PI = 3.14159265359;

bool isIntersectingSphere(vec3 p, vec3 dir_norm, float radius)
{
	float b_over_2 = dot(p, dir_norm);
	float c        = dot(p, p) - radius * radius;
	float d_over_4 = b_over_2 * b_over_2 - c;

	return d_over_4 >= 0.0;
}

// returns alpha0 and alpha1 such that alpha0 < alpha1
// and p+alphai*dir_norm is on the sphere of radius radius centered on 0,0,0
// make sure dir_norm is normalized
vec2 sphereIntersect(vec3 p, vec3 dir_norm, float radius)
{
	float b_over_2 = dot(p, dir_norm);
	float c        = dot(p, p) - radius * radius;
	float d_over_4 = b_over_2 * b_over_2 - c;

	float d = sqrt(d_over_4);
	return vec2(-b_over_2 - d, -b_over_2 + d);
}

vec2 opticalDepthPreproc(vec3 p, vec3 lightdir, float planetRadius,
                         float atmRadius, sampler2D preproctex)
{
	vec2 uv;
	uv.x = (length(p) - planetRadius) / (atmRadius - planetRadius);
	uv.y = acos(dot(normalize(p), lightdir)) / PI;

	return texture(preproctex, uv).rg;
}

// opticalDepth(pA->pB) = opticalDepth(pA->Sun) - opticalDepth(pB->Sun)
vec2 subOpticalDepthPreproc(vec3 pA, vec3 pB, float planetRadius,
                            float atmRadius, sampler2D preproctex)
{
	vec3 dir = normalize(pB - pA);
	// revert ray if dir will hit the planet
	float coeff = normalize(dot(normalize(pA), dir));
	vec2 result = opticalDepthPreproc(pA, coeff * dir, planetRadius, atmRadius,
	                                  preproctex);
	result -= opticalDepthPreproc(pB, coeff * dir, planetRadius, atmRadius,
	                              preproctex);
	return coeff * result;
}

vec3 tPreproc(vec3 p, vec3 lightdir, float H0, float planetRadius,
              float atmRadius, vec3 beta0, sampler2D preproctex)
{
	return exp(
	    -1.0 * beta0
	    * opticalDepthPreproc(p, lightdir, planetRadius, atmRadius, preproctex)
	          .x);
}

vec3 subTPreproc(vec3 pA, vec3 pB, float H0, float planetRadius,
                 float atmRadius, vec3 beta0, sampler2D preproctex)
{
	return exp(
	    -1.0 * beta0
	    * subOpticalDepthPreproc(pA, pB, planetRadius, atmRadius, preproctex)
	          .x);
}

vec2 density(float negalt, vec2 H0)
{
	return exp(negalt / H0);
}

float phaseR(float mu)
{
	return (3.0 + 3.0 * mu * mu) / (16.0 * PI);
}

float phaseM(float mu)
{
	const float g = 0.76;
	float gg      = g * g;
	return (3.0 * (1.0 - gg) * (1.0 + mu * mu))
	       / (8.0 * PI * (2.0 + gg) * pow(1.0 + gg - 2.0 * g * mu, 1.5));
}

void scatteringIntegralPreproc(inout vec3 integral[2], vec3 pA, vec3 pB,
                               vec3 beta0[2], vec2 H0, float planetRadius,
                               float atmRadius, vec3 lightdir,
                               sampler2D preproctex)
{
	vec3 ds = (pB - pA) / float(NUM_IN_SCATTER);
	vec3 v  = pA + ds * 0.5;

	integral = vec3[](vec3(0.0), vec3(0.0));

	// when we compute optical depth P(n)->PA, we already know it from
	// P(n-1)->PA so compute only the contribution of P(n)->P(n-1)
	vec2 accumulativeOpticalDepth
	    = subOpticalDepthPreproc(v, pA, planetRadius, atmRadius, preproctex);

	vec3 beta0neg[2] = vec3[](-1.0 * beta0[0], -1.0 * beta0[1]);
	for(int i = 0; i < NUM_IN_SCATTER; i++)
	{
		vec2 coeff1 = opticalDepthPreproc(v, lightdir, planetRadius, atmRadius,
		                                  preproctex)
		              + accumulativeOpticalDepth;

		vec2 coeff2 = density(planetRadius - length(v), H0)
		              * computeTotalNeighborsOcclusion(v, lightpos);

		integral[0] += exp(beta0neg[0] * coeff1[0]) * coeff2[0];
		integral[1] += exp(beta0neg[1] * coeff1[1]) * coeff2[1];

		v += ds;
		accumulativeOpticalDepth
		    += length(ds) * density(planetRadius - length(v), H0);
	}

	integral[0] *= length(ds);
	integral[1] *= length(ds);
}

vec3 fullScatteringRPreproc(vec3 sunLight, vec3 pA, vec3 pB, vec3 beta0[2],
                            vec2 H0, float planetRadius, float atmRadius,
                            vec3 lightdir, sampler2D preproctex)
{
	vec3 integral[2];
	scatteringIntegralPreproc(integral, pA, pB, beta0, H0, planetRadius,
	                          atmRadius, lightdir, preproctex);
	return sunLight * beta0[0] * phaseR(dot(lightdir, normalize(pB - pA)))
	       * integral[0];
}

vec3 fullScatteringMPreproc(vec3 sunLight, vec3 pA, vec3 pB, vec3 beta0[2],
                            vec2 H0, float planetRadius, float atmRadius,
                            vec3 lightdir, sampler2D preproctex)
{
	vec3 integral[2];
	scatteringIntegralPreproc(integral, pA, pB, beta0, H0, planetRadius,
	                          atmRadius, lightdir, preproctex);
	return sunLight * beta0[1] * phaseM(dot(lightdir, normalize(pB - pA)))
	       * integral[1];
}

vec3 fullScatteringPreproc(vec3 sunLight, vec3 pA, vec3 pB, vec3 beta0[2],
                           vec2 H0, float planetRadius, float atmRadius,
                           vec3 lightdir, sampler2D preproctex)
{
	vec3 integral[2];
	scatteringIntegralPreproc(integral, pA, pB, beta0, H0, planetRadius,
	                          atmRadius, lightdir, preproctex);
	integral[0]
	    *= sunLight * beta0[0] * phaseR(dot(lightdir, normalize(pB - pA)));
	integral[1]
	    *= sunLight * beta0[1] * phaseM(dot(lightdir, normalize(pB - pA)));

	return integral[0] + integral[1];
}
#endif
