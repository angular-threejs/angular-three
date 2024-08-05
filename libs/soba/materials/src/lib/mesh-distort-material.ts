import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { injectBeforeRender, NgtArgs, NgtAttachable, NgtMeshPhysicalMaterial, omit, pick } from 'angular-three';
import { MeshDistortMaterial, MeshDistortMaterialParameters } from 'angular-three-soba/vanilla-exports';
import { mergeInputs } from 'ngxtension/inject-inputs';

export interface NgtsMeshDistortMaterialOptions
	extends Partial<MeshDistortMaterialParameters>,
		Partial<NgtMeshPhysicalMaterial> {
	speed: number;
	factor?: number;
}

const defaultOptions: NgtsMeshDistortMaterialOptions = {
	speed: 1,
};

@Component({
	selector: 'ngts-mesh-distort-material',
	standalone: true,
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
	parameters = omit(this.options, ['speed']);

	material = new MeshDistortMaterial();

	private speed = pick(this.options, 'speed');

	constructor() {
		injectBeforeRender(({ clock }) => {
			this.material.time = clock.getElapsedTime() * this.speed();
		});
	}
}
