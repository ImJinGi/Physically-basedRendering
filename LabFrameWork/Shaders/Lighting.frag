#version 440

in vec3 Position;
in vec3 Normal;
in vec2 Coords;

/*
 * BRDF - bidirectional reflective distribution function
 * 미세면 이론에 기반하여 반사와 굴절 값들을 측정하는 함수
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
 * 노멀 분포 함수 D 또는 specular 분포 통계는 h벡터(halfway)에 맞춘 미세면의 비율을 측정한다.
 * 즉, 얘는 결과값에 따라 표면이 평평한지 거친지 알 수 있고, 이로 인하여 specular가 결정된다.
 * Torwbridge-Reitz GGX 노멀 분포 함수는 다음과 같다.
 */
float DistributionGGX(vec3 N, vec3 H, float roughness)
{
	float a = roughness * roughness;
	float a2 = a * a;
	float NdotH = max(dot(N,H), 0.0);
	float NdotH2 = NdotH * NdotH;

	//분자
	float nom   = a2; 
    //분모
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
 * k는 사용중인 직접광 또는 IBL에 대해 기하학 함수(G함수)를 사용하는지에 따라 a가 재 매핑된다.
 * 직접광 k = (a+1)^2 / 8
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
 * 이 함수들은 0.0~1.0의 결과를 반환하며
 * 0.0 또는 black은 완벽히 미세면 쉐도잉이 적용되는 것이며 1.0 또는 white는 미세면 쉐도잉이 적용되지 않는 것.
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
 * Fresnel 방정식을 구현한 함수로 이 함수는 specular와 diffuse 반사율, 즉 표면의 빛에 대한 반사율을 구하는 함수.
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

	// normal 입사각에서 반사율을 계산
	// 플라스틱과 같은 dia-electric과 금속의 경우 F0의 값이 0.04
	// 또한 이러한 경우에 albedo color는 F0
	vec3 F0 = vec3(0.04);
	F0 = mix(F0, albedo, metallic);

// Direct Lighting
// 선형공간에서 라이팅을 계산하기 때문에 light sources들을 감퇴할 수 있다.
// 현재 이 코드에서는 빛을 네 개를 만들어 각각의 벡터를 구한 후
// 그에 대한 H 벡터를 찾고 radiance를 구함.
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