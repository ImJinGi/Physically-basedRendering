#ifndef __MESH_H__
#define __MESH_H__

#include <GL/glew.h>
#include <GLFW/glfw3.h>

#include <assimp\scene.h>
#include <assimp\mesh.h>

#include <vector>

#include <glm/mat4x4.hpp>
#include <glm/vec3.hpp>
#include <glm/gtx/transform.hpp>
#include <glm/gtc/type_ptr.hpp>

class Mesh
{
public:
	struct MeshEntry
	{
		static enum BUFFERS
		{
			VERTEX_BUFFER, TEXCOORD_BUFFER, NORMAL_BUFFER, INDEX_BUFFER
		};
		GLuint vao;
		GLuint vbo[4];
		GLuint tex_2d[4];
		unsigned int elementCount;

		MeshEntry(aiMesh *mesh);
		~MeshEntry();

		void render();
	};

	std::vector<MeshEntry*> meshEntries;
public:
	Mesh(const char *filename);
	~Mesh(void);

	void render();
};

#endif