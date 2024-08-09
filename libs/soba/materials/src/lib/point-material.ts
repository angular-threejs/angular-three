import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { NgtArgs, NgtAttachable } from 'angular-three';
import { PointMaterial } from 'angular-three-soba/shaders';
import { PointsMaterialParameters } from 'three';

@Component({
	selector: 'ngts-point-material',
	standalone: true,
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
	options = input({} as PointsMaterialParameters);

	material = new PointMaterial(this.options());
}
