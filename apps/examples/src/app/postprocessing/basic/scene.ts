import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { NgtArgs, beforeRender } from 'angular-three';
import { NgtpEffectComposer, NgtpGodRays } from 'angular-three-postprocessing';
import { Group, Mesh } from 'three';

// NOTE: this is to be used with GodRaysEffect as the effect needs a sun source
@Component({
	selector: 'app-sun',
	template: `
		<ngt-mesh #sun [position]="position()">
			<ngt-sphere-geometry *args="[4, 36, 36]" />
			<ngt-mesh-basic-material [color]="color()" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sun {
	color = input('#00FF00');
	position = input([0, 0, -15]);
	sunRef = viewChild.required<ElementRef<Mesh>>('sun');
}

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-color *args="['#171717']" attach="background" />

		<app-sun #sun color="yellow" />

		<ngt-group #group>
			<ngt-mesh>
				<ngt-torus-knot-geometry />
				<ngt-mesh-basic-material color="pink" />
			</ngt-mesh>

			<ngt-mesh [position]="2">
				<ngt-sphere-geometry />
				<ngt-mesh-basic-material color="aquamarine" />
			</ngt-mesh>

			<ngt-mesh [position]="-2">
				<ngt-box-geometry />
				<ngt-mesh-basic-material color="goldenrod" />
			</ngt-mesh>
		</ngt-group>

		<ngtp-effect-composer>
			<ngtp-god-rays [options]="{ sun: sun.sunRef }" />
		</ngtp-effect-composer>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtpEffectComposer, NgtArgs, NgtpGodRays, Sun],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'experience-basic-postprocessing' },
})
export class SceneGraph {
	private group = viewChild.required<ElementRef<Group>>('group');

	constructor() {
		beforeRender(() => {
			const { nativeElement } = this.group();
			nativeElement.rotation.x += 0.005;
			nativeElement.rotation.y += 0.005;
		});
	}
}
