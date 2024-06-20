import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
import { NgtArgs, extend, injectBeforeRender } from 'angular-three';
import { NgtpBloom, NgtpEffectComposer, NgtpEffects } from 'angular-three-postprocessing';
import * as THREE from 'three';
import { Group } from 'three';

extend(THREE);

@Component({
	standalone: true,
	template: `
		<ngt-color *args="['black']" attach="background" />

		<ngt-group #group>
			<ngt-mesh>
				<ngt-box-geometry />
				<ngt-mesh-basic-material color="pink" />
			</ngt-mesh>

			<ngt-mesh [position]="[2, 2, 2]">
				<ngt-sphere-geometry />
				<ngt-mesh-basic-material color="aquamarine" />
			</ngt-mesh>

			<ngt-mesh [position]="[-2, -2, -2]">
				<ngt-torus-geometry />
				<ngt-mesh-basic-material color="goldenrod" />
			</ngt-mesh>
		</ngt-group>

		<ngtp-effect-composer>
			<ng-template effects>
				<ngtp-bloom [options]="{ kernelSize: 3, luminanceThreshold: 0, luminanceSmoothing: 0.4, intensity: 0.6 }" />
			</ng-template>
		</ngtp-effect-composer>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtpEffectComposer, NgtpEffects, NgtpBloom, NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'experience-basic-postprocessing' },
})
export class Experience {
	group = viewChild.required<ElementRef<Group>>('group');

	constructor() {
		injectBeforeRender(() => {
			const { nativeElement } = this.group();
			nativeElement.rotation.x += 0.01;
			nativeElement.rotation.y += 0.01;
		});
	}
}
