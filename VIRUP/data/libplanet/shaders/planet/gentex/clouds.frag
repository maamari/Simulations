#version 150 core

float mod289(float x)
{
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 mod289(vec4 x)
{
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 perm(vec4 x)
{
	return mod289(((x * 34.0) + 1.0) * x);
}
float random(vec3 p)
{
	vec3 a = floor(p);
	vec3 d = p - a;
	d      = d * d * (3.0 - 2.0 * d);

	vec4 b  = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
	vec4 k1 = perm(b.xyxy);
	vec4 k2 = perm(k1.xyxy + b.zzww);

	vec4 c  = k2 + a.zzzz;
	vec4 k3 = perm(c);
	vec4 k4 = perm(c + 1.0);

	vec4 o1 = fract(k3 * (1.0 / 41.0));
	vec4 o2 = fract(k4 * (1.0 / 41.0));

	vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
	vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

	return o4.y * d.y + o4.x * (1.0 - d.y);
}

vec4 tex(in vec3 fragCoord, float freq)
{
	vec3 uv = fragCoord;

	vec3 coord = fract(uv * freq);

	float minDist = 1.0;

	for(int i = -1; i <= 1; i++)
	{
		for(int j = -1; j <= 1; j++)
		{
			for(int k = -1; k <= 1; k++)
			{
				vec3 grid = mod(floor(uv * freq) + vec3(i, j, k), freq);

				vec3 pointInGrid = vec3(random(grid));
				pointInGrid.y    = random(vec3(pointInGrid.x));
				pointInGrid.z    = random(vec3(pointInGrid.y));

				minDist
				    = min(minDist, length(pointInGrid - coord + vec3(i, j, k))
				                       / sqrt(3.0));
			}
		}
	}

	return 1.0 - vec4(minDist);
}
in vec2 texCoord;

uniform float seed;

out vec4 outColor;

#define PI 3.1415
void main()
{
	float lat = PI * (1.0 - texCoord.y);
	float lon = 2.0 * PI * texCoord.x;
	vec3 p    = vec3(sin(lat) * cos(lon), sin(lat) * sin(lon), cos(lat));

	float ampl = 0.5;
	float freq = 5.0;

	outColor = vec4(0.0);

	for(int i = 0; i < 20; ++i)
	{
		outColor += ampl * tex(0.2*(vec3(p) + vec3(seed)), freq);
		ampl /= 2.0;
		freq *= PI / 2.0;
	}

	float density = fract(seed / 3.1415);

	float cut = 0.35 * (sqrt(1.0 - density));
	outColor  = 1.0 - sqrt(sqrt(1.0 - outColor));
	outColor -= vec4(cut);
	outColor = max(vec4(0.0), outColor);
	outColor *= 1.0 / (1.0 - cut);

	outColor = 1.0 - pow(1.0 - outColor, vec4(4.0));
}
