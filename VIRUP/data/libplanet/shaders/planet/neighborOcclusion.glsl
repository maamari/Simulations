#ifndef OCCLUSION
#define OCCLUSION

#define MYPI 3.1415

// Disk on disk occlusion proportion (see notes/disk-occlusion.ggb in Geogebra
// geometry)
float getNeighborOcclusionFactor(float rLight, float rNeighbor, float dist)
{
	// both disks don't meet

	if(dist >= rLight + rNeighbor)
	{
		return 0.0;
	}


	// they meet and light is a point so occlusion == 1.0
	// early return because of divisions by sLight == 0.0
	if(rLight == 0.0)
	{
		return 1.0;
	}

	float rLightSq    = rLight * rLight;
	float rNeighborSq = rNeighbor * rNeighbor;

	// surfaces of light disk and neighbor disk
	float sLight    = MYPI * rLightSq;
	float sNeighbor = MYPI * rNeighborSq;

	// disks intersection surface
	float sX = 0.0;

	// one disk is included in the other
	if(dist <= abs(rLight - rNeighbor))
	{
		sX = min(sLight, sNeighbor);
	}
	else
	{
		float alpha = (rLightSq - rNeighborSq + (dist * dist)) / (2.0 * dist);
		float x     = sqrt(rLightSq - (alpha * alpha));

		float gammaLight = asin(x / rLight);
		if(alpha < 0.0)
		{
			gammaLight = MYPI - gammaLight;
		}
		float gammaNeighbor = asin(x / rNeighbor);
		if(alpha > dist)
		{
			gammaNeighbor = MYPI - gammaNeighbor;
		}

		sX = (rLightSq * gammaLight) + (rNeighborSq * gammaNeighbor)
		     - (dist * x);
	}

	// somehow we need clamping to avoid artifacts in atmospheres (black or white points)
	return clamp(sX / sLight, 0.0, 0.99999995);
}

float computeTotalNeighborsOcclusion(vec3 pos, vec3 lightpos)
{
	vec3 posRelFromLight = lightpos - pos;
	vec3 lightdir        = normalize(posRelFromLight);

	float globalCoeffNeighbor = 1.0;
	for(int i = 0;
	    i < neighborsPosRadius.length() && neighborsPosRadius[i].w > 0.0; ++i)
	{
		vec3 posRelFromNeighbor = neighborsPosRadius[i].xyz - pos;

		if(dot(lightdir, posRelFromNeighbor) < 0.0)
		{
			continue;
		}

		float neighborRadius = neighborsPosRadius[i].w;

		vec3 closestPoint
		    = dot(lightdir, posRelFromNeighbor) * lightdir - posRelFromNeighbor;

		closestPoint /= neighborsOblateness[i];

		globalCoeffNeighbor
		    *= (1.0
		        - getNeighborOcclusionFactor(
		              lightradius * length(posRelFromNeighbor),
		              neighborRadius * length(posRelFromLight),
		              length(posRelFromLight) * length(closestPoint)));
	}

	return globalCoeffNeighbor;
}
#endif
