import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, viewChild } from '@angular/core';
import { injectBeforeRender, injectStore, NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsCameraShake, NgtsEnvironment } from 'angular-three-soba/staging';
import { Group, Vector3 } from 'three';
import { RectAreaLightUniformsLib } from 'three-stdlib';
import { Model } from './model';

RectAreaLightUniformsLib.init();

@Component({
	selector: 'app-light',
	standalone: true,
	template: `
		<ngt-group #group>
			<ngt-rect-area-light
				[width]="15"
				[height]="100"
				[position]="[30, 30, -10]"
				[intensity]="5"
				(updated)="$any($event).lookAt(0, 0, 0)"
			/>
		</ngt-group>

		<ngt-ambient-light [intensity]="0.2" />
		<ngt-spot-light [position]="[50, 50, -30]" [castShadow]="true" [decay]="0" />
		<ngt-point-light [position]="[-10, -10, -10]" color="red" [intensity]="3 * Math.PI" [decay]="0" />
		<ngt-point-light [position]="[0, -5, 5]" [intensity]="0.5 * Math.PI" [decay]="0" />
		<ngt-directional-light [position]="[0, -5, 0]" color="red" [intensity]="2 * Math.PI" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Light {
	protected readonly Math = Math;

	private groupRef = viewChild.required<ElementRef<Group>>('group');

	constructor() {
		injectBeforeRender(({ clock }) => {
			const group = this.groupRef().nativeElement;
			group.rotation.x = clock.elapsedTime;
		});
	}
}

@Component({
	selector: 'app-rig',
	standalone: true,
	template: `
		<ngts-camera-shake
			[options]="{
				maxYaw: 0.01,
				maxPitch: 0.01,
				maxRoll: 0.01,
				yawFrequency: 0.5,
				pitchFrequency: 0.5,
				rollFrequency: 0.4,
			}"
		/>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsCameraShake],
})
export class Rig {
	private vec = new Vector3();
	private store = injectStore();

	constructor() {
		injectBeforeRender(() => {
			const { camera, pointer } = this.store.snapshot;
			camera.position.lerp(this.vec.set(pointer.x * 2, 1, 60), 0.05);
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-fog attach="fog" *args="['lightpink', 60, 100]" />

		<app-model [position]="[-4.5, -4, 0]" [rotation]="[0, -2.8, 0]" />
		<app-light />
		<app-rig />

		<ngts-environment [options]="{ preset: 'warehouse' }" />
		<ngts-orbit-controls [options]="{ makeDefault: true, minPolarAngle: 0, maxPolarAngle: Math.PI / 2 }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'shaky-experience' },
	imports: [NgtArgs, Light, NgtsEnvironment, Rig, NgtsOrbitControls, Model],
})
export class Experience {
	protected readonly Math = Math;
}
