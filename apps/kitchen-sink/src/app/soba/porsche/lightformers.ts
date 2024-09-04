import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, viewChild } from '@angular/core';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { NgtsFloat, NgtsLightformer } from 'angular-three-soba/staging';
import { BackSide, Group } from 'three';

@Component({
	selector: 'app-lightformers',
	standalone: true,
	template: `
		<!--		ceiling-->
		<ngts-lightformer
			[options]="{ intensity: 0.75, rotation: [Math.PI / 2, 0, 0], position: [0, 5, -9], scale: [10, 10, 1] }"
		/>
		<ngt-group [rotation]="[0, 0.5, 0]">
			<ngt-group #group>
				@for (position of positions; track $index) {
					<ngts-lightformer
						[options]="{
							form: 'circle',
							intensity: 2,
							rotation: [Math.PI / 2, 0, 0],
							position: [position, 4, $index * 4],
							scale: [3, 1, 1],
						}"
					/>
				}
			</ngt-group>
		</ngt-group>

		<!--		sides-->
		<ngts-lightformer
			[options]="{ intensity: 4, rotation: [0, Math.PI / 2, 0], position: [-5, 1, -1], scale: [20, 0.1, 1] }"
		/>
		<ngts-lightformer [options]="{ rotation: [0, Math.PI / 2, 0], position: [-5, -1, -1], scale: [20, 0.5, 1] }" />
		<ngts-lightformer [options]="{ rotation: [0, -Math.PI / 2, 0], position: [10, 1, 0], scale: [20, 1, 1] }" />

		<!--		accent red-->
		<ngts-float [options]="{ speed: 5, floatIntensity: 2, rotationIntensity: 2 }">
			<ngts-lightformer
				[options]="{ form: 'ring', color: 'red', intensity: 1, scale: 10, position: [-15, 4, -18], target: [0, 0, 0] }"
			/>
		</ngts-float>

		<!--		background-->
		<ngt-mesh [scale]="100">
			<ngt-sphere-geometry *args="[1, 64, 64]" />
			<!-- we don't have LayerMaterial in angular-three yet -->
			<ngt-mesh-standard-material color="#444" [side]="BackSide" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsLightformer, NgtsFloat, NgtArgs],
})
export class Lightformers {
	protected Math = Math;
	protected BackSide = BackSide;
	protected positions = [2, 0, 2, 0, 2, 0, 2, 0];

	private group = viewChild.required<ElementRef<Group>>('group');

	constructor() {
		injectBeforeRender(({ delta }) => {
			const group = this.group().nativeElement;
			(group.position.z += delta * 10) > 20 && (group.position.z = -60);
		});
	}
}
