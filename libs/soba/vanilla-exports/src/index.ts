import {
	MeshDiscardMaterial,
	MeshTransmissionMaterial,
	ProgressiveLightMap,
	SoftShadowMaterial,
} from '@pmndrs/vanilla';
import { NgtMaterial } from 'angular-three';

export type NgtSoftShadowMaterial = NgtMaterial<InstanceType<typeof SoftShadowMaterial>, typeof SoftShadowMaterial>;

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-mesh-standard-material
		 * @rawOptions color|blend|opacity|alphaTest|map
		 */
		'ngt-soft-shadow-material': NgtSoftShadowMaterial;
	}
}

export { MeshDiscardMaterial, MeshTransmissionMaterial, ProgressiveLightMap, SoftShadowMaterial };
