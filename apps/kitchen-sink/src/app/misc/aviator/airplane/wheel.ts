import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { NgtArgs, NgtVector3 } from 'angular-three';
import { COLORS } from '../constants';

@Component({
	selector: 'app-wheel',
	standalone: true,
	template: `
		<ngt-mesh [position]="position()">
			<ngt-box-geometry *args="[30, 15, 10]" />
			<ngt-mesh-phong-material [color]="COLORS.red" [flatShading]="true" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class Wheel {
	protected readonly COLORS = COLORS;

	position = input<NgtVector3>([0, 0, 0]);
}
