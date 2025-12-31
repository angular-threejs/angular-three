import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	numberAttribute,
	viewChild,
} from '@angular/core';
import { extend, NgtThreeElements, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Mesh } from 'three';

/**
 * Configuration options for the NgtsMask component.
 */
export interface NgtsMaskOptions extends Partial<NgtThreeElements['ngt-mesh']> {
	/**
	 * Whether to write color to the framebuffer.
	 * @default false
	 */
	colorWrite: boolean;
	/**
	 * Whether to write depth to the depth buffer.
	 * @default false
	 */
	depthWrite: boolean;
}

const defaultOptions: NgtsMaskOptions = {
	colorWrite: false,
	depthWrite: false,
};

/**
 * Component that creates a stencil mask for selective rendering.
 * Objects inside the mask can be shown/hidden using the `mask()` function.
 *
 * @example
 * ```html
 * <ngts-mask [id]="1">
 *   <ngt-circle-geometry *args="[0.5, 64]" />
 * </ngts-mask>
 *
 * <ngt-mesh [material]="maskedMaterial">
 *   <ngt-box-geometry />
 * </ngt-mesh>
 * ```
 *
 * ```typescript
 * maskedMaterial = new THREE.MeshStandardMaterial({
 *   ...mask(() => 1)()
 * });
 * ```
 */
@Component({
	selector: 'ngts-mask',
	template: `
		<ngt-mesh #mesh [renderOrder]="-id()" [parameters]="parameters()">
			<ng-content />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsMask {
	id = input(1, { transform: numberAttribute });
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	protected parameters = omit(this.options, ['colorWrite', 'depthWrite']);

	meshRef = viewChild.required<ElementRef<THREE.Mesh<THREE.BufferGeometry, THREE.Material>>>('mesh');

	private colorWrite = pick(this.options, 'colorWrite');
	private depthWrite = pick(this.options, 'depthWrite');
	private spread = computed(() => {
		const [id, colorWrite, depthWrite] = [this.id(), this.colorWrite(), this.depthWrite()];
		return {
			colorWrite,
			depthWrite,
			stencilWrite: true,
			stencilRef: id,
			stencilFunc: THREE.AlwaysStencilFunc,
			stencilFail: THREE.ReplaceStencilOp,
			stencilZFail: THREE.ReplaceStencilOp,
			stencilZPass: THREE.ReplaceStencilOp,
		};
	});

	constructor() {
		extend({ Mesh });

		effect(() => {
			const [mesh, spread] = [this.meshRef().nativeElement, this.spread()];
			Object.assign(mesh.material, spread);
		});
	}
}

/**
 * Creates stencil material properties for use with NgtsMask.
 * Apply the returned properties to a material to make it respect mask boundaries.
 *
 * @param id - Signal of the mask ID to match
 * @param inverse - Signal of whether to invert the mask (show outside instead of inside)
 * @returns A computed signal containing stencil properties to spread onto a material
 *
 * @example
 * ```typescript
 * // Show content only inside the mask
 * const insideMask = mask(() => 1);
 *
 * // Show content only outside the mask
 * const outsideMask = mask(() => 1, () => true);
 *
 * // Apply to material
 * Object.assign(myMaterial, insideMask());
 * ```
 */
export function mask(id: () => number, inverse: () => boolean = () => false) {
	return computed(() => {
		const [_id, _inverse] = [id(), inverse()];
		return {
			stencilWrite: true,
			stencilRef: _id,
			stencilFunc: _inverse ? THREE.NotEqualStencilFunc : THREE.EqualStencilFunc,
			stencilFail: THREE.KeepStencilOp,
			stencilZFail: THREE.KeepStencilOp,
			stencilZPass: THREE.KeepStencilOp,
		};
	});
}
