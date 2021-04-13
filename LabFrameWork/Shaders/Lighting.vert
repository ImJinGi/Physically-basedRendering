#version 440 

in vec3 VertexPosition;
in vec3 VertexNormal;
in vec2 TexCoords;

out vec3 Position;
out vec3 Normal;
out vec2 Coords;


uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main()
{
	Position = vec3(model * vec4(VertexPosition, 1.0));
	Normal = mat3(model) * VertexNormal;
	Coords = TexCoords;
	
	gl_Position = projection * view * vec4(VertexPosition, 1.0);

}

