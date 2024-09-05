import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	Injector,
	input,
	numberAttribute,
	viewChild,
} from '@angular/core';
import { extend, NgtMesh, omit, pick } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import {
	AlwaysStencilFunc,
	BufferGeometry,
	EqualStencilFunc,
	KeepStencilOp,
	Material,
	Mesh,
	NotEqualStencilFunc,
	ReplaceStencilOp,
} from 'three';

export interface NgtsMaskOptions extends Partial<NgtMesh> {
	colorWrite: boolean;
	depthWrite: boolean;
}

const defaultOptions: NgtsMaskOptions = {
	colorWrite: false,
	depthWrite: false,
};

@Component({
	selector: 'ngts-mask',
	standalone: true,
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

	parameters = omit(this.options, ['colorWrite', 'depthWrite']);

	meshRef = viewChild.required<ElementRef<Mesh<BufferGeometry, Material>>>('mesh');

	private colorWrite = pick(this.options, 'colorWrite');
	private depthWrite = pick(this.options, 'depthWrite');
	private spread = computed(() => {
		const [id, colorWrite, depthWrite] = [this.id(), this.colorWrite(), this.depthWrite()];
		return {
			colorWrite,
			depthWrite,
			stencilWrite: true,
			stencilRef: id,
			stencilFunc: AlwaysStencilFunc,
			stencilFail: ReplaceStencilOp,
			stencilZFail: ReplaceStencilOp,
			stencilZPass: ReplaceStencilOp,
		};
	});

	constructor() {
		extend({ Mesh });

		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const [mesh, spread] = [this.meshRef().nativeElement, this.spread()];
				Object.assign(mesh.material, spread);
			});
		});
	}
}

export function injectMask(
	id: () => number,
	inverse: () => boolean = () => false,
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(injectMask, injector, () => {
		return computed(() => {
			const [_id, _inverse] = [id(), inverse()];
			return {
				stencilWrite: true,
				stencilRef: _id,
				stencilFunc: _inverse ? NotEqualStencilFunc : EqualStencilFunc,
				stencilFail: KeepStencilOp,
				stencilZFail: KeepStencilOp,
				stencilZPass: KeepStencilOp,
			};
		});
	});
}
