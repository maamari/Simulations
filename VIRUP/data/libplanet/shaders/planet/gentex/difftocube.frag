#version 150 core

in vec3 f_position;

uniform sampler2D diff;

uniform float PI = 3.1415;

out vec4 outColor;

void main()
{
	vec3 pos = normalize(f_position);
	vec2 texCoord
	    = vec2(atan(pos.y, pos.x) / (2.0 * PI), 1.0 - (asin(pos.z) / PI) - 0.5);

	if(texCoord.x < 0.0)
	{
		texCoord.x += 1.0;
	}
	outColor = texture(diff, texCoord);
}
