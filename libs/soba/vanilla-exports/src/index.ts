import {
	BlurPass,
	CausticsMaterial,
	CausticsProjectionMaterial,
	CausticsProjectionMaterialType,
	MeshDiscardMaterial,
	MeshDistortMaterial,
	MeshDistortMaterialParameters,
	MeshReflectorMaterial,
	MeshTransmissionMaterial,
	MeshWobbleMaterial,
	MeshWobbleMaterialParameters,
	ProgressiveLightMap,
	SoftShadowMaterial,
	SpotLightMaterial,
	createCausticsUpdate,
	shaderMaterial,
} from '@pmndrs/vanilla';
import { NgtMaterial } from 'angular-three';

export type NgtSpotLightMaterial = NgtMaterial<InstanceType<typeof SpotLightMaterial>, typeof SpotLightMaterial>;
export type NgtSoftShadowMaterial = NgtMaterial<InstanceType<typeof SoftShadowMaterial>, typeof SoftShadowMaterial>;
export type NgtCausticsProjectionMaterial = NgtMaterial<
	CausticsProjectionMaterialType,
	[CausticsProjectionMaterialType]
>;

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-mesh-standard-material
		 * @rawOptions color|blend|opacity|alphaTest|map
		 */
		'ngt-soft-shadow-material': NgtSoftShadowMaterial;
		/**
		 * @extends ngt-shader-material
		 * @rawOptions depth|opacity|attenuation|anglePower|spotPosition|lightColor|cameraNear|cameraFar|resolution|transparent|depthWrite
		 */
		'ngt-spot-light-material': NgtSpotLightMaterial;
		/**
		 * @extends ngt-shader-material
		 * @rawOptions color|causticsTexture|causticsTextureB|lightProjMatrix|lightViewMatrix
		 */
		'ngt-caustics-projection-material': NgtCausticsProjectionMaterial;
	}
}

export {
	BlurPass,
	CausticsMaterial,
	CausticsProjectionMaterial,
	CausticsProjectionMaterialType,
	MeshDiscardMaterial,
	MeshDistortMaterial,
	MeshDistortMaterialParameters,
	MeshReflectorMaterial,
	MeshTransmissionMaterial,
	MeshWobbleMaterial,
	MeshWobbleMaterialParameters,
	ProgressiveLightMap,
	SoftShadowMaterial,
	SpotLightMaterial,
	createCausticsUpdate,
	shaderMaterial,
};
