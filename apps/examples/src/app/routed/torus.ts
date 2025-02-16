import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsMeshTransmissionMaterial } from 'angular-three-soba/materials';

@Component({
	selector: 'app-torus',
	template: `
		<ngt-mesh [receiveShadow]="true" [castShadow]="true">
			<ngt-torus-geometry *args="[4, 1.2, 128, 64]" />
			<ngts-mesh-transmission-material [options]="{ backside: true, backsideThickness: 5, thickness: 2 }" />
		</ngt-mesh>
	`,
	imports: [NgtArgs, NgtsMeshTransmissionMaterial],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Torus {}
