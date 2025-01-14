import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	ComponentRef,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	inject,
	viewChild,
	ViewContainerRef,
} from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { CANVAS_OPTIONS } from './canvas-options';
import { SOBA_CONTENT } from './soba-content';

@Component({
	template: `
		<ngt-color *args="[background()]" attach="background" />

		<ng-container #anchor />

		@if (lights()) {
			<ngt-ambient-light [intensity]="0.8" />
			<ngt-point-light [intensity]="Math.PI" [position]="[0, 6, 0]" [decay]="0" />
		}

		@if (controls(); as controls) {
			<ngts-orbit-controls [options]="{ makeDefault: controls['makeDefault'] ?? true }" />
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtsOrbitControls, NgtArgs, NgtsOrbitControls],
})
export class SceneGraph {
	protected readonly Math = Math;

	private canvasOptionsStore = inject(CANVAS_OPTIONS);
	background = this.canvasOptionsStore.select('background');
	lights = this.canvasOptionsStore.select('lights');
	controls = this.canvasOptionsStore.select('controls');

	private sobaContent = inject(SOBA_CONTENT);

	anchor = viewChild.required('anchor', { read: ViewContainerRef });

	constructor() {
		let ref: ComponentRef<unknown>;

		afterNextRender(() => {
			ref = this.anchor().createComponent(this.sobaContent());
			ref.changeDetectorRef.detectChanges();
		});

		inject(DestroyRef).onDestroy(() => {
			ref?.destroy();
		});
	}
}
