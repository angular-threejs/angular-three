import {
	MeshDiscardMaterial,
	MeshTransmissionMaterial,
	ProgressiveLightMap,
	SoftShadowMaterial,
	SpotLightMaterial,
} from '@pmndrs/vanilla';
import { NgtMaterial } from 'angular-three';

export type NgtSpotLightMaterial = NgtMaterial<InstanceType<typeof SpotLightMaterial>, typeof SpotLightMaterial>;
export type NgtSoftShadowMaterial = NgtMaterial<InstanceType<typeof SoftShadowMaterial>, typeof SoftShadowMaterial>;

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
	}
}

export { MeshDiscardMaterial, MeshTransmissionMaterial, ProgressiveLightMap, SoftShadowMaterial, SpotLightMaterial };
