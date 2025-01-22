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

export interface NgtsMaskOptions extends Partial<NgtThreeElements['ngt-mesh']> {
	colorWrite: boolean;
	depthWrite: boolean;
}

const defaultOptions: NgtsMaskOptions = {
	colorWrite: false,
	depthWrite: false,
};

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
