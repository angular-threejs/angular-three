import { Type } from '@angular/core';
import {
	BlurPass,
	CameraShake,
	CausticsMaterial,
	CausticsProjectionMaterial,
	CausticsProjectionMaterialType,
	CLOUD_URL,
	createCausticsUpdate,
	Fisheye,
	FisheyeProps,
	MeshDiscardMaterial,
	MeshDistortMaterial,
	MeshDistortMaterialParameters,
	MeshPortalMaterial,
	meshPortalMaterialApplySDF,
	MeshReflectorMaterial,
	MeshTransmissionMaterial,
	MeshWobbleMaterial,
	MeshWobbleMaterialParameters,
	Outlines,
	OutlinesProps,
	ProgressiveLightMap,
	shaderMaterial,
	SoftShadowMaterial,
	Sparkles,
	SparklesProps,
	Splat,
	SplatLoader,
	SpotLightMaterial,
	SpriteAnimator,
	SpriteAnimatorProps,
	Stars,
	StarsProps,
	Trail,
	TrailProps,
} from '@pmndrs/vanilla';
import { NgtThreeElement } from 'angular-three';

/**
 * Type definition for the SpotLightMaterial element in Angular Three templates.
 * Used for volumetric spotlight effects.
 */
export type NgtSpotLightMaterial = NgtThreeElement<typeof SpotLightMaterial>;

/**
 * Type definition for the SoftShadowMaterial element in Angular Three templates.
 * Used for rendering soft shadow effects.
 */
export type NgtSoftShadowMaterial = NgtThreeElement<typeof SoftShadowMaterial>;

/**
 * Type definition for the CausticsProjectionMaterial element in Angular Three templates.
 * Used for projecting caustic light patterns.
 */
export type NgtCausticsProjectionMaterial = NgtThreeElement<Type<CausticsProjectionMaterialType>>;

/**
 * Type definition for the MeshPortalMaterial element in Angular Three templates.
 * Used for creating portal effects that render a different scene inside a mesh.
 */
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
	CameraShake,
	CausticsMaterial,
	CausticsProjectionMaterial,
	CausticsProjectionMaterialType,
	CLOUD_URL,
	createCausticsUpdate,
	Fisheye,
	FisheyeProps,
	MeshDiscardMaterial,
	MeshDistortMaterial,
	MeshDistortMaterialParameters,
	MeshPortalMaterial,
	meshPortalMaterialApplySDF,
	MeshReflectorMaterial,
	MeshTransmissionMaterial,
	MeshWobbleMaterial,
	MeshWobbleMaterialParameters,
	Outlines,
	OutlinesProps,
	ProgressiveLightMap,
	shaderMaterial,
	SoftShadowMaterial,
	Sparkles,
	SparklesProps,
	Splat,
	SplatLoader,
	SpotLightMaterial,
	SpriteAnimator,
	SpriteAnimatorProps,
	Stars,
	StarsProps,
	Trail,
	TrailProps,
};
