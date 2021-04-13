//#define  FREEGLUT_LIB_PRAGMAS  0

#pragma warning(push)
#pragma warning(disable:4311)		// convert void* to long
#pragma warning(disable:4312)		// convert long to void*

#include <iostream>
#include "GL/glew.h"
#include <string>
#include <stack>

#include <SOIL\SOIL.h>

#include "glm/glm.hpp"
#include "glm/gtc/matrix_transform.hpp"
#include "glm/gtc/matrix_inverse.hpp"

#include "Viewer.h"
#include "ModelView.h"
#include "ShaderLoad.h"

#include "Sphere.h"
#include "Mesh.h"

#pragma warning(pop)


class MyGlWindow {
public:
	MyGlWindow(int w, int h);
	~MyGlWindow();
	void draw();
	void setSize(int w, int h) { m_width = w; m_height = h; }
	void setAspect(float r) { m_viewer->setAspectRatio(r); }
	Viewer *m_viewer;

	void printSphereInfo();
	void drawSphere(shaderLoading* shader, glm::mat4 &view, glm::mat4 &projection);

	void printMeshInfo();
	void drawMesh(shaderLoading* shader, glm::mat4 &view, glm::mat4 &projection);

	void renderCube();
	void renderQuad();
	void constructIrradianceMap();

	float metalic;
	float roughness;
	float ao;

private:
	int m_width;
	int m_height;
	void initialize(); 

	void setupShaders();

	unsigned int cubeVAO = 0;
	unsigned int cubeVBO = 0;

	unsigned int quadVAO = 0;
	unsigned int quadVBO = 0;

	unsigned int envCubemap;

	Model m_model;
	
	Sphere *m_sphere;
	shaderLoading *m_sphereShader;
	
	Mesh *m_mesh;
	shaderLoading *m_meshShader;
	
	shaderLoading *m_backgroundShader;
	shaderLoading *m_equiretangularShader;
	shaderLoading *m_irradianceShader;
	shaderLoading *m_brdfShader;
	shaderLoading *m_prefilterShader;
};
