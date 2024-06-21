import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
import { NgtArgs, extend, injectBeforeRender } from 'angular-three';
import { NgtpEffectComposer, NgtpEffects, NgtpGlitch } from 'angular-three-postprocessing';
import * as THREE from 'three';
import { Group, Vector2 } from 'three';

extend(THREE);

@Component({
	standalone: true,
	template: `
		<ngt-color *args="['#171717']" attach="background" />

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
				<ngtp-glitch />
			</ng-template>
		</ngtp-effect-composer>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtpEffectComposer, NgtpEffects, NgtArgs, NgtpGlitch],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'experience-basic-postprocessing' },
})
export class Experience {
	group = viewChild.required<ElementRef<Group>>('group');
	offset = new Vector2(0.05, 0.005);

	constructor() {
		injectBeforeRender(() => {
			const { nativeElement } = this.group();
			nativeElement.rotation.x += 0.005;
			nativeElement.rotation.y += 0.005;
		});
	}
}
