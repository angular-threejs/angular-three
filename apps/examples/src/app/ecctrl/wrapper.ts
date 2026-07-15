import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { NgtrPhysics } from 'angular-three-rapier';
import { NgtCanvas } from 'angular-three/dom';
import type { EcctrlExampleCanvasConfig } from './ecctrl.routes';
import { EcctrlExampleControls } from './shared/example-controls';
import { EcctrlExampleOverlay } from './shared/example-overlay';

const DEFAULT_CANVAS_CONFIG: EcctrlExampleCanvasConfig = {
	shadowExtent: 16,
};

@Component({
	template: `
		<ngt-canvas [camera]="{ position: [9, 7, 12], fov: 45 }" [lookAt]="[0, 1, 5]" shadows>
			<ngtr-physics
				*canvasContent
				[options]="{
					paused: controls.physicsPaused(),
					gravity: controls.physicsGravity(),
					timeStep: controls.physicsTimeStep(),
				}"
			>
				<ng-template>
					@if (canvasConfig().lighting !== 'scene') {
						<ngt-ambient-light [intensity]="0.5 * Math.PI" />
						<ngt-directional-light
							castShadow
							[position]="[8, 12, 6]"
							[intensity]="2 * Math.PI"
							[shadow.mapSize.width]="2048"
							[shadow.mapSize.height]="2048"
							[shadow.camera.near]="0.5"
							[shadow.camera.far]="canvasConfig().shadowFar ?? 50"
							[shadow.camera.left]="-canvasConfig().shadowExtent"
							[shadow.camera.right]="canvasConfig().shadowExtent"
							[shadow.camera.top]="canvasConfig().shadowExtent"
							[shadow.camera.bottom]="-canvasConfig().shadowExtent"
							[shadow.bias]="-0.0001"
							[shadow.normalBias]="0.02"
							[shadow.radius]="4"
							[shadow.intensity]="0.65"
						/>
					}

					<router-outlet (activate)="syncRouteData()" />
				</ng-template>
			</ngtr-physics>
		</ngt-canvas>
		<app-ecctrl-example-overlay [description]="description()" />
	`,
	imports: [EcctrlExampleOverlay, NgtCanvas, NgtrPhysics, RouterOutlet],
	providers: [EcctrlExampleControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block h-full relative w-full' },
})
export default class EcctrlWrapper {
	private readonly route = inject(ActivatedRoute);

	protected readonly Math = Math;
	protected readonly controls = inject(EcctrlExampleControls);
	protected readonly canvasConfig = signal(this.readCanvasConfig());
	protected readonly description = signal(this.readDescription());

	protected syncRouteData() {
		this.canvasConfig.set(this.readCanvasConfig());
		this.description.set(this.readDescription());
	}

	private readCanvasConfig() {
		return (
			(this.route.firstChild?.snapshot.data['ecctrlCanvas'] as EcctrlExampleCanvasConfig | undefined) ??
			DEFAULT_CANVAS_CONFIG
		);
	}

	private readDescription() {
		return (this.route.firstChild?.snapshot.data['description'] as string | undefined) ?? '';
	}
}
