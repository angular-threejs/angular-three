import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal, viewChild } from '@angular/core';
import { injectBeforeRender } from 'angular-three';
import { NgtsRoundedBox } from 'angular-three-soba/abstractions';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { TheatreSheetObject, TheatreSheetObjectTransform } from 'angular-three-theatre';

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngts-perspective-camera #camera [options]="{ makeDefault: true, position: [5, 5, 5], fov: 75, far: 1000 }" />

		<ngt-ambient-light
			#ambientLight
			*sheetObject="'Ambient Light'"
			[sync]="ambientLight"
			[syncProps]="['intensity', 'color']"
		/>

		<theatre-transform *sheetObject="'Directional Light'">
			<ngt-directional-light
				#directionalLight
				castShadow
				[sync]="directionalLight"
				[syncProps]="['intensity', 'color']"
			/>
		</theatre-transform>

		<theatre-transform
			#boxTransform
			*sheetObject="'Box'; select as select; deselect as deselect"
			[options]="{ mode: boxTransformMode() }"
		>
			<ngts-rounded-box [options]="{ castShadow: true }" (click)="select()" (pointermissed)="deselect()">
				<ngt-mesh-standard-material
					#boxMaterial
					transparent
					[sync]="boxMaterial"
					[syncProps]="['color', 'roughness', 'metalness', 'side', 'opacity']"
				/>
			</ngts-rounded-box>
		</theatre-transform>

		<ngt-mesh receiveShadow [position.y]="-1" [rotation.x]="-Math.PI / 2" [scale]="10">
			<ngt-circle-geometry />
			<ngt-mesh-standard-material />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [TheatreSheetObject, NgtsRoundedBox, NgtsPerspectiveCamera],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'experience-basic-theatre', '(document:keyup)': 'onKeyup($event)' },
})
export class SceneGraph {
	protected readonly Math = Math;

	private boxTransform = viewChild.required('boxTransform', { read: TheatreSheetObjectTransform });
	private modes = ['translate', 'rotate', 'scale'] as const;
	protected boxTransformMode = signal<(typeof this.modes)[number]>('translate');

	protected onKeyup(event: KeyboardEvent) {
		if (event.key === 'Shift' && event.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
			// cycle through modes
			this.boxTransformMode.set(
				this.modes[(this.modes.indexOf(this.boxTransformMode()) + 1) % this.modes.length],
			);
		}
	}

	constructor() {
		injectBeforeRender(({ camera }) => {
			const boxSheetObject = this.boxTransform().sheetObject();
			const position = boxSheetObject.value['position'];
			camera.lookAt(position.x, position.y, position.z);
		});
	}
}
