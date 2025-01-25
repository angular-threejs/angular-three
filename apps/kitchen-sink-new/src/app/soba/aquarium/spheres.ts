import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsInstance, NgtsInstances } from 'angular-three-soba/performances';
import { NgtsFloat } from 'angular-three-soba/staging';

@Component({
	selector: 'app-spheres',
	template: `
		<ngts-instances [options]="{ renderOrder: -1000 }">
			<ngt-sphere-geometry *args="[1, 64, 64]" />
			<ngt-mesh-basic-material [depthTest]="false" />

			@for (sphere of spheres; track $index) {
				@let scale = sphere[0];
				@let color = sphere[1];
				@let speed = sphere[2];
				@let position = sphere[3];

				<ngts-float [options]="{ rotationIntensity: 40, floatIntensity: 20, speed: speed / 2 }">
					<ngts-instance [options]="{ position, color, scale }" />
				</ngts-float>
			}
		</ngts-instances>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsInstances, NgtArgs, NgtsFloat, NgtsInstance],
})
export class Spheres {
	protected spheres = [
		[1, 'orange', 0.05, [-4, -1, -1]],
		[0.75, 'hotpink', 0.1, [-4, 2, -2]],
		[1.25, 'aquamarine', 0.2, [4, -3, 2]],
		[1.5, 'lightblue', 0.3, [-4, -2, -3]],
		[2, 'pink', 0.3, [-4, 2, -4]],
		[2, 'skyblue', 0.3, [-4, 2, -4]],
		[1.5, 'orange', 0.05, [-4, -1, -1]],
		[2, 'hotpink', 0.1, [-4, 2, -2]],
		[1.5, 'aquamarine', 0.2, [4, -3, 2]],
		[1.25, 'lightblue', 0.3, [-4, -2, -3]],
		[1, 'pink', 0.3, [-4, 2, -4]],
		[1, 'skyblue', 0.3, [-4, 2, -4]],
	] as const;
}
