import { Type } from '@angular/core';
import {
	BlurPass,
	CausticsMaterial,
	CausticsProjectionMaterial,
	CausticsProjectionMaterialType,
	createCausticsUpdate,
	MeshDiscardMaterial,
	MeshDistortMaterial,
	MeshDistortMaterialParameters,
	MeshPortalMaterial,
	meshPortalMaterialApplySDF,
	MeshReflectorMaterial,
	MeshTransmissionMaterial,
	MeshWobbleMaterial,
	MeshWobbleMaterialParameters,
	ProgressiveLightMap,
	shaderMaterial,
	SoftShadowMaterial,
	SpotLightMaterial,
} from '@pmndrs/vanilla';
import { NgtThreeElement } from 'angular-three';

export type NgtSpotLightMaterial = NgtThreeElement<typeof SpotLightMaterial>;
export type NgtSoftShadowMaterial = NgtThreeElement<typeof SoftShadowMaterial>;
export type NgtCausticsProjectionMaterial = NgtThreeElement<Type<CausticsProjectionMaterialType>>;
export type NgtMeshPortalMaterial = NgtThreeElement<typeof MeshPortalMaterial>;

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
		/**
		 * @extends ngt-shader-material
		 * @rawOptions resolution|blur|size|sdf|map
		 */
		'ngt-mesh-portal-material': NgtMeshPortalMaterial;
	}
}

export {
	BlurPass,
	CausticsMaterial,
	CausticsProjectionMaterial,
	CausticsProjectionMaterialType,
	createCausticsUpdate,
	MeshDiscardMaterial,
	MeshDistortMaterial,
	MeshDistortMaterialParameters,
	MeshPortalMaterial,
	meshPortalMaterialApplySDF,
	MeshReflectorMaterial,
	MeshTransmissionMaterial,
	MeshWobbleMaterial,
	MeshWobbleMaterialParameters,
	ProgressiveLightMap,
	shaderMaterial,
	SoftShadowMaterial,
	SpotLightMaterial,
};
