#version 330 core

#include <planet/gentex/simplex4DNoise.glsl>

in vec2 texCoord;

uniform vec3 color;
uniform float seed;

uniform float bandsIntensity;

out vec4 outColor;

vec2 curl_noise(in vec2 uv, in float shift_by);

void main()
{
	float lat = texCoord.y * 3.1415;
	float lon = texCoord.x * 2.0 * 3.1415;

	vec3 p = vec3(sin(lat) * cos(lon), sin(lat) * sin(lon), cos(lat));

	pow(p.z, 3.0);
	p.z *= 5.0;
	p.x *= 0.25;

	int time             = int(10);
	const float stepSize = 0.01;

	for(int i = 0; i < time; ++i)
	{
		p.xz += curl_noise(p.xz, seed) * stepSize;
	}
	p.z /= 5.0;
	pow(p.z, 1.0 / 3.0);
	p.x /= 0.25;

	lat = p.z * 3.1415;
	lon = p.x * 2.0 * 3.1415;

	vec3 pos
	    = normalize(vec3(sin(lat) * cos(lon), sin(lat) * sin(lon), cos(lat)));

	float n = noise(vec4(pos, 1.0 + seed), 24, 5.0, 0.5) * 0.1 * bandsIntensity;

	float alt = pos.z + n;

	float colorBands = (noise(vec4(1.0, 1.0, alt, 1.0 + seed), 24, 1, 0.6) + 1)
	                       * 0.5 * bandsIntensity
	                   + 1 - bandsIntensity;

	float dr = noise(vec4(1.0, 1.0, alt, 2.0 + seed), 24, 1, 0.6);
	float dg = noise(vec4(1.0, 1.0, alt, 3.0 + seed), 24, 1, 0.6);
	float db = noise(vec4(1.0, 1.0, alt, 4.0 + seed), 24, 1, 0.6);

	outColor = vec4(
	    color + (vec3(dr, dg, db) * 0.3 * bandsIntensity * bandsIntensity),
	    1.0);
	outColor.rgb *= colorBands;
}

// CURL NOISE FROM mds2 : https://www.shadertoy.com/view/ltdfWB

// The MIT License
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions: The above copyright
// notice and this permission notice shall be included in all copies or
// substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
// WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
// TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
// FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR
// THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// All hash functions copied from https://www.shadertoy.com/view/Xt3cDn
// Thanks, nimitz!

// Modified from: iq's "Integer Hash - III"
// (https://www.shadertoy.com/view/4tXyWN) Faster than "full" xxHash and good
// quality
uint baseHash(uvec2 p)
{
	p        = 1103515245U * ((p >> 1U) ^ (p.yx));
	uint h32 = 1103515245U * ((p.x) ^ (p.y >> 3U));
	return h32 ^ (h32 >> 16);
}

//--------------------------------------------------

float hash12(vec2 x)
{
	uint n = baseHash(floatBitsToUint(x));

	return float(n & 0x7fffffffU) / float(0x7fffffff);
}

float noise_term(in vec2 x, in float scale_val)
{
	vec2 s   = vec2(scale_val);
	vec2 x00 = x - mod(x, s);
	vec2 x01 = x + vec2(0.0, scale_val);
	x01      = x01 - mod(x01, s);
	vec2 x10 = x + vec2(scale_val, 0.0);
	x10      = x10 - mod(x10, s);
	vec2 x11 = x + s;
	x11      = x11 - mod(x11, s);

	float v00 = hash12(x00);
	float v01 = hash12(x01);
	float v10 = hash12(x10);
	float v11 = hash12(x11);

	vec2 uv = mod(x, s) / s;

	float yweight = smoothstep(0.0, 1.0, uv.y);
	float v1      = mix(v10, v11, yweight);
	float v0      = mix(v00, v01, yweight);

	float xweight = smoothstep(0.0, 1.0, uv.x);

	return mix(v0, v1, xweight);
}

float noise(in vec2 x, in float base_scale, in float space_decay,
            in float height_decay, in float shift_by)
{
	float h = 1.0;
	float s = base_scale;

	float summation = 0.0;

	for(int i = 0; i < 5; ++i)
	{
		summation = summation + h * noise_term(x + vec2(0.0, s * shift_by), s);
		s *= space_decay;
		h *= height_decay;
	}
	return summation;
}

float simple_noise(in vec2 uv, in float shift_by)
{
	return noise(uv * 10.0, 5.0, 0.75, 0.75, shift_by);
}

vec2 noise2(in vec2 uv, in float shift_by)
{
	return vec2(simple_noise(uv, shift_by),
	            simple_noise(uv + vec2(0.0, 101.0), shift_by));
}

vec2 noise_grad(in vec2 uv, in float shift_by)
{
	float f           = simple_noise(uv, shift_by);
	const float h     = 0.001;
	const float h_inv = 1000.0;

	// just hte definition of a derivative / gradient
	return h_inv
	       * vec2(simple_noise(uv + vec2(h, 0.0), shift_by) - f,
	              simple_noise(uv + vec2(0.0, h), shift_by) - f);
}

vec2 curl_noise(in vec2 uv, in float shift_by)
{
	vec2 grad = noise_grad(uv, shift_by);
	return vec2(
	    grad.y,
	    -grad.x); // curl of simple_noise * z_unit : d/dy noise - d/dx noise
}
