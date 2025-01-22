import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, inject, input } from '@angular/core';
import { NgtArgs, NgtAttachable } from 'angular-three';
import { PointMaterial } from 'angular-three-soba/shaders';
import * as THREE from 'three';

@Component({
	selector: 'ngts-point-material',
	template: `
		<ngt-primitive *args="[material]" [attach]="attach()" [parameters]="options()">
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsPointMaterial {
	attach = input<NgtAttachable>('material');
	options = input({} as THREE.PointsMaterialParameters);

	protected material = new PointMaterial(this.options());

	constructor() {
		inject(DestroyRef).onDestroy(() => this.material.dispose());
	}
}
