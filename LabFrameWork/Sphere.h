#ifndef __SPHERE_H__
#define __SPHERE_H__

#include <iostream>

#include "GL/glew.h"
#include <GL/GL.h>
#include <glm/mat4x4.hpp>

#include <vector>

#include "stb_image.h"

class Sphere
{
public:
	Sphere();
	Sphere(float rad, GLuint sl, GLuint st);
	~Sphere();

	void setup(float rad, GLuint sl, GLuint st);
	void draw();
	int getVertexArrayHandle();

	GLuint VAO, VBO_position, VBO_normal, IBO;

	GLuint loadCubemap(std::vector<std::string> faces);

	GLuint skyboxTexture;

private:
	GLuint nVerts, elements;
	float radius;
	GLuint slices, stacks;

	void generateVerts(float *, float *, float *, GLuint *);
};
#endif
