import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { NgtArgs, NgtVector3 } from 'angular-three';
import { COLORS } from '../constants';

@Component({
	selector: 'app-tire',
	standalone: true,
	template: `
		<ngt-mesh [position]="position()" [scale]="scale()">
			<ngt-box-geometry *args="[24, 24, 4]" />
			<ngt-mesh-phong-material [color]="COLORS.brownDark" [flatShading]="true" />

			<ngt-mesh>
				<ngt-box-geometry *args="[10, 10, 6]" />
				<ngt-mesh-phong-material [color]="COLORS.brown" [flatShading]="true" />
			</ngt-mesh>
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class Tire {
	protected readonly COLORS = COLORS;

	position = input<NgtVector3>([0, 0, 0]);
	scale = input(1);
}
