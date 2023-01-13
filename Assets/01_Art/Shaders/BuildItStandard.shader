Shader "BuildIt/Standard"
{
	Properties
	{
		_Color("Tint Color", Color) = (1,1,1,1)

		_MainTex ("Main Texture", 2D) = "yellow" {}
		_MainTexRatio("Main Texture Ratio", Range(0, 2)) = 1

		_NormalMap("Normal Map", 2D) = "bump" {}
		_NormalRatio("Normal Ratio (Vtx - Map)", Range(0, 1)) = 0.3
		_NormalPower("Normal Power", Range(0, 1)) = 1

		//_SpecularMap("Specular Map", 2D) = "white" {}
		_SpecularColor("Specular Color", Color) = (1,1,1,0)
		_SpecularRatio("Specular Ratio", Range(0.03, 10)) = 5

		//_MetaillicMap("Metaliic Map", 2D) = "white" {}
		_BrightnessRatio("Brightness Ratio", Range(0, 2)) = 1
		_LightmapRatio("Lightmap Ratio", Range(0, 1)) = 1
		_ShadowRatio("Shadow Ratio", Range(0, 1)) = 1
		
		_ReflectionRatio ("Replection Ratio", Range(0, 1)) = 0.1
		_LightIntensity("Light Intensity", Range(0, 1)) = 0.8
	}

	SubShader
	{
		Pass
		{
			Tags { "RenderType" = "Opaque" "LightMode" = "ForwardBase" }
			LOD 200

			CGPROGRAM
			#pragma vertex vert
			#pragma fragment frag
			#pragma target 3.0
			#pragma multi_compile_fwdbase

			#include "UnityCG.cginc"
			#include "Lighting.cginc"
			#include "AutoLight.cginc"

			struct appdata
			{
				float4 vertex : POSITION;
				float2 texcoord : TEXCOORD0;
				float4 normal : NORMAL;
				float2 texcoordLM : TEXCOORD1;
			};

			struct v2f
			{
				float2 uv : TEXCOORD0;
				SHADOW_COORDS(1) // put shadows data into TEXCOORD1
				fixed3 diff : COLOR0;
				fixed3 ambient : COLOR1;
				float4 pos : SV_POSITION;
				float3 worldPos : TEXCOORD2;
				float3 worldNorm : TEXCOORD3;
				float3 worldRefl : TEXCOORD4;
				float2 uvLightMap : TEXCOORD5;
			};

			fixed4 _Color;

			sampler2D _MainTex;
			fixed _MainTexRatio;

			sampler2D _NormalMap;
			fixed _NormalRatio;
			fixed _NormalPower;

			// 공통 colormap을 사용하다보니 일단 무의미함.
			//sampler2D _SpecularMap;
			fixed4 _SpecularColor;
			fixed _SpecularRatio;

			// 공통 colormap을 사용하다보니 일단 무의미함.
			//sampler2D _MetaillicMap;

			fixed _ShadowRatio;
			fixed _BrightnessRatio;
			fixed _LightmapRatio;
			fixed _ReflectionRatio;
			fixed _LightIntensity;

			v2f vert(appdata v)
			{
				v2f o;
				o.pos = UnityObjectToClipPos(v.vertex);
				o.uv = v.texcoord;
				o.uvLightMap = v.texcoordLM * unity_LightmapST.xy + unity_LightmapST.zw;
				o.worldPos = mul(unity_ObjectToWorld, v.vertex);
				o.worldNorm = UnityObjectToWorldNormal(v.normal);
				o.worldRefl = reflect(UnityWorldSpaceViewDir(o.pos), o.worldNorm);
				o.ambient = ShadeSH9(half4(o.worldNorm, 1));
				TRANSFER_SHADOW(o)
				TRANSFER_VERTEX_TO_FRAGMENT(o);
				return o;
			}

			fixed4 frag(v2f i) : SV_Target
			{
				fixed4 color = tex2D(_MainTex, i.uv) * _MainTexRatio;
				color.rgb *= _Color.rgb * _Color.a;

				// Fetch lightmap
				fixed4 bakedColorTex = UNITY_SAMPLE_TEX2D(unity_Lightmap, i.uvLightMap) * _LightmapRatio;
				color.rgb += color.rgb * DecodeLightmap(bakedColorTex).rgb * _BrightnessRatio;
				
				fixed3 vertexToLightSource = _WorldSpaceLightPos0.xyz - i.worldPos;
				float distance = length(vertexToLightSource);
				fixed attenuation = 1.0 / distance; // linear attenuation 

				float3 normal = lerp(i.worldNorm, UnpackNormal(tex2D(_NormalMap, i.uv)), _NormalRatio);		// [Vertex Normal] VS [NormalMap Normal]
				half dotValue = dot(normal, _WorldSpaceLightPos0.xyz);

				// Diffuse (Lambert)
				fixed lambert = max(0, dotValue) * _LightColor0.rgb;
				lambert = lerp(1, lambert, _NormalPower);

				// Specular
				fixed3 specularReflection;
				if (dotValue < 0.0) {
					specularReflection = float3(0.0, 0.0, 0.0);
				}
				else {
					half3 lightDirection = normalize(vertexToLightSource);
					half3 viewDirection = normalize(_WorldSpaceCameraPos - i.worldPos);

					specularReflection =
					/*_LightColor0.rgb * */	// LightMap이 Bake 되어 있을 경우는 LightColor가 없다..
					_SpecularColor.rgb * _SpecularColor.a
					* pow(max(0.0, dot(reflect(-lightDirection, normal), viewDirection)), _SpecularRatio);
				}

				// compute shadow attenuation (1.0 = fully lit, 0.0 = fully shadowed)
				// Received shadow.
				fixed shadow = lerp(1, SHADOW_ATTENUATION(i), _ShadowRatio);

				// darken light's illumination with shadow, keep ambient intact
				fixed3 lighting = lambert * shadow + i.ambient;

				// Skybox Reflection
				half4 skyData = UNITY_SAMPLE_TEXCUBE(unity_SpecCube0, i.worldRefl);
				fixed3 skyColor = DecodeHDR(skyData, unity_SpecCube0_HDR) * _ReflectionRatio;
				
				return fixed4((color * lighting + specularReflection + skyColor) * _LightIntensity, 1.0);
			}

			ENDCG
		}

		// shadow caster rendering pass, implemented manually
		// using macros from UnityCG.cginc
		Pass
		{
			Tags {"LightMode" = "ShadowCaster"}

			CGPROGRAM
			#pragma vertex vert
			#pragma fragment frag
			#pragma target 3.0
			#pragma multi_compile_shadowcaster
			#include "UnityCG.cginc"

			struct v2f {
				V2F_SHADOW_CASTER;
			};

			v2f vert(appdata_base v)
			{
				v2f o;
				TRANSFER_SHADOW_CASTER_NORMALOFFSET(o)
				return o;
			}

			float4 frag(v2f i) : SV_Target
			{
				SHADOW_CASTER_FRAGMENT(i)
			}
			ENDCG
		}
	}

	FallBack "Mobile/Unlit (Supports Lightmap)"
}
