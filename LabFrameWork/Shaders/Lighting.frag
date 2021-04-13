#version 440

in vec3 Position;
in vec3 Normal;
in vec2 Coords;

/*
 * BRDF - bidirectional reflective distribution function
 * �̼��� �̷п� ����Ͽ� �ݻ�� ���� ������ �����ϴ� �Լ�
 * 
 */

/* 
 * material parameters
 * albedo - diffuse color of surface
 * normal - normal mapping
 * roughness - how rough a surface is on a per texel basis
 * AO - abbreviation of ambient occlusion, specifies an extra shadowing factor of the surface
*/
uniform vec3 albedo;
uniform float metallic;
uniform float roughness;
uniform float ao;

uniform samplerCube irradianceMap;
uniform samplerCube prefilterMap;
uniform sampler2D brdfLUT;

uniform vec3 cameraPos;
uniform vec3 lightPositions[4];

out vec4 FragColor;

const float PI = 3.14159265359;
const vec3 lightColor = vec3(1,1,1);

/* 
 * D function(Normal Distribution Function)
 * every microfacet on surface is depend on their material
 * then, you can control just use some parameters
 * D function means, in macro surface, how many shows their reflectable microfacet
 * (how much of the microfacet in the macro surface can show mirror reflection)
 * ��� ���� �Լ� D �Ǵ� specular ���� ���� h����(halfway)�� ���� �̼����� ������ �����Ѵ�.
 * ��, ��� ������� ���� ǥ���� �������� ��ģ�� �� �� �ְ�, �̷� ���Ͽ� specular�� �����ȴ�.
 * Torwbridge-Reitz GGX ��� ���� �Լ��� ������ ����.
 */
float DistributionGGX(vec3 N, vec3 H, float roughness)
{
	float a = roughness * roughness;
	float a2 = a * a;
	float NdotH = max(dot(N,H), 0.0);
	float NdotH2 = NdotH * NdotH;

	//����
	float nom   = a2; 
    //�и�
	float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / max(denom, 0.001);
}

/*
 * G function(for shadow masking)
 * Describes the self-shadowing property of the microfacet
 * when the microfacet rough, the surface of the microfacet can overshadow other microfacet
 * it return ratio of microfacets that overshadow each other causing light rays to lose
 * their energy in the process
 * k�� ������� ������ �Ǵ� IBL�� ���� ������ �Լ�(G�Լ�)�� ����ϴ����� ���� a�� �� ���εȴ�.
 * ������ k = (a+1)^2 / 8
 * IBL = a^2 / 2
 * 
 */
float GeometrySchlickGGX(float NdotV, float roughness)
{
	float r = (roughness + 1.0);
	float k = (r*r)/8.0;

	float nom = NdotV;
	float denom = NdotV * (1.0 - k) + k;

	return nom/denom;
}
/*
 * this function is more effectively working than SchlickGGX
 * �� �Լ����� 0.0~1.0�� ����� ��ȯ�ϸ�
 * 0.0 �Ǵ� black�� �Ϻ��� �̼��� �������� ����Ǵ� ���̸� 1.0 �Ǵ� white�� �̼��� �������� ������� �ʴ� ��.
 */
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}
/* 
 * F function(fresnel's law with Schlick's approximation)
 * F0  = pow(n1 - n2/n1 + n2)
 * acatually, F0 means Fresnel at Degree 0(zero)
 * Fresnel �������� ������ �Լ��� �� �Լ��� specular�� diffuse �ݻ���, �� ǥ���� ���� ���� �ݻ����� ���ϴ� �Լ�.
 */
vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
	return F0 + (1.0f - F0) * pow(1.0f - cosTheta, 5.0f);
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness)
{
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - cosTheta, 5.0);
}   

void main()
{
	vec3 N = Normal;
	vec3 V = normalize(cameraPos - Position);
    vec3 R = reflect(-V, N);

	// normal �Ի簢���� �ݻ����� ���
	// �ö�ƽ�� ���� dia-electric�� �ݼ��� ��� F0�� ���� 0.04
	// ���� �̷��� ��쿡 albedo color�� F0
	vec3 F0 = vec3(0.04);
	F0 = mix(F0, albedo, metallic);

// Direct Lighting
// ������������ �������� ����ϱ� ������ light sources���� ������ �� �ִ�.
// ���� �� �ڵ忡���� ���� �� ���� ����� ������ ���͸� ���� ��
// �׿� ���� H ���͸� ã�� radiance�� ����.
	vec3 Lo = vec3(0.0);
	for(int i=0; i<4; i++)
	{
		//Light Vector
		vec3 L = normalize(lightPositions[i] - Position);
		// Halfway Vector - halfway between light and view vector
		vec3 H = normalize(V + L);

		// distance between light and model
		float distance_light_Pos = length(lightPositions[i] - Position);
		// don't know
		float attenuation = 1.0/(distance_light_Pos * distance_light_Pos);
		// flux of light
		vec3 radiance = lightColor * attenuation;
// Direct Lighting


		// Cook - Torrance BRDF
		// Frensel function (called F function)
		float NDF = DistributionGGX(N, H, roughness);
		float G = GeometrySmith(N, V, L, roughness);
		vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

		// 
		vec3 nominator = NDF * G * F;
        float denominator = 4 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.001;
		vec3 specular = nominator / denominator;
		// prevent divede by zero for NdotV = 0.0 or NdotL = 0.0

		// ks is equal to Fresnel
		vec3 kS = F;
		//
		// for energy conservation, the diffuse and specular light can not
		// be above 1.0(unless the surface emits light);
		// to preserver this relationship, the diffuse component(kD) should equal 1.0 - kS
		//
		vec3 kD = vec3(1.0) - kS;
		//
		// multiply kD by the inverse metalness such that only non metals
		// have diffuse lighting, or a linear blend if partly metal
		// (pure metals have no diffuse light)
		//
		kD *= 1.0 - metallic;

		float NdotL = max(dot(N, L), 0.0);

		Lo += (kD * albedo / PI + specular) * radiance * NdotL;
	}
    vec3 F = fresnelSchlickRoughness(max(dot(N, V), 0.0), F0, roughness);

    vec3 kS = F;
    vec3 kD = 1.0 - kS;
    
//    vec3 kS = fresnelSchlick(max(dot(N, V), 0.0), F0);
//    vec3 kD = 1.0 - kS;
    kD *= 1.0 - metallic;

    vec3 irradiance = texture(irradianceMap, N).rgb;
    vec3 diffuse = irradiance * albedo;
	
    const float MAX_REFLECTION_LOD = 4.0f;
    vec3 prefilteredColor = textureLod(prefilterMap, R,  roughness * MAX_REFLECTION_LOD).rgb;    
    vec2 brdf  = texture(brdfLUT, vec2(max(dot(N, V), 0.0), roughness)).rg;
    vec3 specular = prefilteredColor * (F * brdf.x + brdf.y);    
    vec3 ambient = (kD * diffuse + specular) * ao;
    
//    vec3 ambient = (kD * diffuse) * ao;
	
    vec3 color = ambient + Lo;

	color = color / (color + vec3(1.0));
	color = pow(color, vec3(1.0/2.2));

	FragColor = vec4(color, 1.0);
}