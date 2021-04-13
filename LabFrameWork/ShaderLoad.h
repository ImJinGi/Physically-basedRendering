/*
2018/03/15 start
*/

#ifndef __SHADER_LOAD_H__
#define __SHADER_LOAD_H__

#include <string>
#include <iostream>
#include <fstream>
#include <sstream>

#include <GL\glew.h>
#include <GL\GL.h>
#include <glm\glm.hpp>

static bool isPrint = false;

class shaderLoading
{
public:

	static const bool DEBUG = true;

	unsigned int programID;



	// constructor reads and builds the shader
	shaderLoading(const GLchar* vertexPath, const GLchar* fragmentPath)
	{
		// shader를 string 형태로 저장
		std::string vertexCode;			
		std::string fragmentCode;

		// shader 파일 가져오는 ifstream 형 변수(읽기 전용)
		std::ifstream vShaderFile;
		std::ifstream fShaderFile;

		vShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);
		fShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);

		try
		{
			// open files
			vShaderFile.open(vertexPath);
			fShaderFile.open(fragmentPath);
			std::stringstream vShaderStream, fShaderStream;
			
			if (!vShaderFile.good())
			{
				std::cout << "Failed to open file: " << vertexPath << std::endl;
			}

			if (!fShaderFile.good())
			{
				std::cout << "Failed to open file: " << vertexPath << std::endl;
			}

			// read file's buffer contents into streams
			vShaderStream << vShaderFile.rdbuf();
			fShaderStream << fShaderFile.rdbuf();

			// close file handlers
			vShaderFile.close();
			fShaderFile.close();

			// convert stream into string
			vertexCode = vShaderStream.str();
			fragmentCode = fShaderStream.str();
		}
		catch(std::ifstream::failure e)
		{
			std::cout << "ERROR::SHADER::FILE_NOT_SUCCESSFULLY_READ" << std::endl;
		}

		const char* vShaderCode = vertexCode.c_str();
		const char* fShaderCode = fragmentCode.c_str();

		unsigned int vertex, fragment;
		int success;
		char infoLog[512];

		// compile vertex shader
		vertex = glCreateShader(GL_VERTEX_SHADER);
		glShaderSource(vertex, 1, &vShaderCode, NULL);
		glCompileShader(vertex);
		checkCompileErrors(vertex, "VERTEX");

		// compile fragment shader
		fragment = glCreateShader(GL_FRAGMENT_SHADER);
		glShaderSource(fragment, 1, &fShaderCode, NULL);
		glCompileShader(fragment);
		checkCompileErrors(fragment, "FRAGMENT");

		GLint vShaderStatus = 0, fShaderStatus = 0;
		printShaderStatus(vertex, vShaderStatus, "GL_VERTEX_SHADER");
		printShaderStatus(fragment, fShaderStatus, "GL_FRAGMENT_SHADER");

		// shader program
		programID = glCreateProgram();
		glAttachShader(programID, vertex);
		glAttachShader(programID, fragment);
		glLinkProgram(programID);
		// print linking errors if any
		glGetProgramiv(programID, GL_LINK_STATUS, &success);
		if (!success)
		{
			glGetProgramInfoLog(programID, 512, NULL, infoLog);
			std::cout << "ERROR::SHADER::PROGRAM::LINKING_FAILED\n" << infoLog << std::endl;
		}

		// delete the shaders as they are linked into out program now and no longer necessery
		glDeleteShader(vertex);
		glDeleteShader(fragment);
	}

	void printShaderStatus(unsigned int shader, GLint shaderStatus, std::string shaderType)
	{
		std::string shaderName = "";
		if (shaderType == "GL_VERTEX_SHADER")
		{
			shaderName = "GL_VERTEX_SHADER";
		}
		else if (shaderType == "GL_FRAGMENT_SHADER")
		{
			shaderName = "GL_FRAGMENT_SHADER";
		}
		glGetShaderiv(shader, GL_COMPILE_STATUS, &shaderStatus);
		if (!isPrint) 
		{
			if (shaderStatus == GL_FALSE)
			{
				std::cout << shaderName << " compilation failed " << std::endl;
			}
			else
			{
				if (DEBUG)
				{
					std::cout << shaderName << " shader compilation successful." << std::endl;
				}
			}
			isPrint = true;
		}
	}

	~shaderLoading()
	{
		glDeleteProgram(programID);
	}

	// use/activate the shader
	void use()
	{
		glUseProgram(programID);
	}
	void disable()
	{
		glUseProgram(0);
	}

	// utility uniform functions
	void setBool(const std::string &name, bool value) const
	{
		glUniform1i(glGetUniformLocation(programID, name.c_str()), (int) value);
	}
	void setInt(const std::string &name, int value) const
	{
		glUniform1i(glGetUniformLocation(programID, name.c_str()), value);
	}
	void setFloat(const std::string &name, float value) const
	{
		glUniform1f(glGetUniformLocation(programID, name.c_str()), value);
	}
	void setVec2(const std::string &name, const glm::vec2 &value) const
	{
		glUniform2fv(glGetUniformLocation(programID, name.c_str()), 1, &value[0]);
	}
	void setVec2(const std::string &name, float x, float y) const
	{
		glUniform2f(glGetUniformLocation(programID, name.c_str()), x, y);
	}
	// ------------------------------------------------------------------------
	void setVec3(const std::string &name, const glm::vec3 &value) const
	{
		glUniform3fv(glGetUniformLocation(programID, name.c_str()), 1, &value[0]);
	}
	void setVec3(const std::string &name, float x, float y, float z) const
	{
		glUniform3f(glGetUniformLocation(programID, name.c_str()), x, y, z);
	}
	// ------------------------------------------------------------------------
	void setVec4(const std::string &name, const glm::vec4 &value) const
	{
		glUniform4fv(glGetUniformLocation(programID, name.c_str()), 1, &value[0]);
	}
	void setVec4(const std::string &name, float x, float y, float z, float w) const
	{
		glUniform4f(glGetUniformLocation(programID, name.c_str()), x, y, z, w);
	}
	// ------------------------------------------------------------------------
	void setMat2(const std::string &name, const glm::mat2 &mat) const
	{
		glUniformMatrix2fv(glGetUniformLocation(programID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
	}
	// ------------------------------------------------------------------------
	void setMat3(const std::string &name, const glm::mat3 &mat) const
	{
		glUniformMatrix3fv(glGetUniformLocation(programID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
	}
	// ------------------------------------------------------------------------
	void setMat4(const std::string &name, const glm::mat4 &mat) const
	{
		glUniformMatrix4fv(glGetUniformLocation(programID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
	}
	
	void showAttributeLocation(const std::string &attributeName)
	{
		std::cout << "Attribute " << attributeName << " bound to location: " << glGetAttribLocation(programID, attributeName.c_str()) << std::endl;
	}

	void showUniformLocation(const std::string &uniformName)
	{
		std::cout<< "Uniform "<< uniformName << " bound to location: " <<glGetUniformLocation(programID, uniformName.c_str()) <<std::endl;
	}

	// print object's name 
	void showShaderName(const std::string name)
	{
		std::cout << "Shader's Name: " << name << std::endl;
	}

private:
	void checkCompileErrors(unsigned int shader, std::string type)
	{
		int success;
		char infoLog[1024];
		if (type != "PROGRAM")
		{
			glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
			if (!success)
			{
				glGetShaderInfoLog(shader, 1024, NULL, infoLog);

				std::cout << "ERROR::SHADER_COMPILATION_ERROR of type: " << type << "\n" << infoLog << "\n -- --------------------------------------------------- -- " << std::endl;
			}
		}
		else
		{
			glGetProgramiv(shader, GL_LINK_STATUS, &success);
			if (!success)
			{
				glGetProgramInfoLog(shader, 1024, NULL, infoLog);
				std::cout << "ERROR::PROGRAM_LINKING_ERROR of type: " << type << "\n" << infoLog << "\n -- --------------------------------------------------- -- " << std::endl;
			}
		}
	}
};

#endif
