import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsMeshTransmissionMaterial } from 'angular-three-soba/materials';

@Component({
	selector: 'app-knot',
	template: `
		<ngt-mesh [receiveShadow]="true" [castShadow]="true">
			<ngt-torus-knot-geometry *args="[3, 1, 256, 32]" />
			<ngts-mesh-transmission-material [options]="{ backside: true, backsideThickness: 5, thickness: 2 }" />
		</ngt-mesh>
	`,
	imports: [NgtArgs, NgtsMeshTransmissionMaterial],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Knot {}
