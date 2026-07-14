import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgtrPhysics } from 'angular-three-rapier';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtCanvas } from 'angular-three/dom';

@Component({
	template: `
		<ngt-canvas [camera]="{ position: [9, 7, 12], fov: 45 }" shadows>
			<ngtr-physics *canvasContent>
				<ng-template>
					<ngt-ambient-light [intensity]="0.5 * Math.PI" />
					<ngt-directional-light
						castShadow
						[position]="[8, 12, 6]"
						[intensity]="2 * Math.PI"
						[shadow.mapSize.width]="1024"
						[shadow.mapSize.height]="1024"
					/>

					<ngts-orbit-controls [options]="{ makeDefault: true, maxPolarAngle: Math.PI / 2.05 }" />

					<router-outlet />
				</ng-template>
			</ngtr-physics>
		</ngt-canvas>
	`,
	imports: [NgtCanvas, NgtrPhysics, NgtsOrbitControls, RouterOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EcctrlWrapper {
	protected readonly Math = Math;
}
