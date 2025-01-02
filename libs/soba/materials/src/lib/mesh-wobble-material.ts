import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, inject, input } from '@angular/core';
import { injectBeforeRender, NgtArgs, NgtAttachable, NgtMeshStandardMaterial, omit } from 'angular-three';
import { MeshWobbleMaterial, MeshWobbleMaterialParameters } from 'angular-three-soba/vanilla-exports';
import { mergeInputs } from 'ngxtension/inject-inputs';

export interface NgtsMeshWobbleMaterialOptions extends MeshWobbleMaterialParameters, Partial<NgtMeshStandardMaterial> {
	speed: number;
}

const defaultOptions: NgtsMeshWobbleMaterialOptions = {
	speed: 1,
};

@Component({
	selector: 'ngts-mesh-wobble-material',
	template: `
		<ngt-primitive *args="[material]" [parameters]="parameters()" [attach]="attach()">
			<ng-content />
		</ngt-primitive>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsMeshWobbleMaterial {
	attach = input<NgtAttachable>('material');
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['speed']);

	material = new MeshWobbleMaterial();

	constructor() {
		inject(DestroyRef).onDestroy(() => this.material.dispose());

		injectBeforeRender(({ clock }) => {
			const material = this.material;
			material.time = clock.elapsedTime * this.options().speed;
		});
	}
}
