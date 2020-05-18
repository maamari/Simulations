#version 150 core

in vec3 position;

uniform mat4 camera;
uniform float overridenScale;
uniform vec3 cameraRelPos;
uniform vec4 color;

void main()
{
	vec3 relPos = cameraRelPos + position;

	float centerPosition = 5000.0;

	float camDist = length(relPos);
	float scale   = centerPosition / camDist;

	if(overridenScale != 0.0 && overridenScale < scale)
	{
		scale = overridenScale;
	}

	gl_Position = camera * vec4(scale * relPos, 1.0);
}
