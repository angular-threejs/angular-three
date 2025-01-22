import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, inject, input } from '@angular/core';
import { injectBeforeRender, NgtArgs, NgtAttachable, NgtThreeElements, omit, pick } from 'angular-three';
import { MeshDistortMaterial, MeshDistortMaterialParameters } from 'angular-three-soba/vanilla-exports';
import { mergeInputs } from 'ngxtension/inject-inputs';

export interface NgtsMeshDistortMaterialOptions
	extends Partial<MeshDistortMaterialParameters>,
		Partial<NgtThreeElements['ngt-mesh-physical-material']> {
	speed: number;
	factor?: number;
}

const defaultOptions: NgtsMeshDistortMaterialOptions = {
	speed: 1,
};

@Component({
	selector: 'ngts-mesh-distort-material',
	template: `
		<ngt-primitive *args="[material]" [attach]="attach()" [parameters]="parameters()">
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsMeshDistortMaterial {
	attach = input<NgtAttachable>('material');
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['speed']);

	material = new MeshDistortMaterial();

	private speed = pick(this.options, 'speed');

	constructor() {
		inject(DestroyRef).onDestroy(() => this.material.dispose());

		injectBeforeRender(({ clock }) => {
			this.material.time = clock.getElapsedTime() * this.speed();
		});
	}
}
