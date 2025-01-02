import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import { injectParams } from 'ngxtension/inject-params';
import { SCENES_MAP } from './constants';

export const debug = signal(false);
export const interpolate = signal(true);
export const paused = signal(false);

@Component({
    selector: 'app-floor',
    template: `
		<ngt-object3D
			ngtrRigidBody="fixed"
			[options]="{ colliders: 'cuboid' }"
			name="floor"
			[position]="[0, -12.55 - 5, 0]"
			[scale]="[200, 10, 200]"
			[rotation]="[0, 0, 0]"
		>
			<ngt-mesh [receiveShadow]="true">
				<ngt-box-geometry />
				<ngt-shadow-material [opacity]="0.2" />
			</ngt-mesh>
		</ngt-object3D>
	`,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgtrRigidBody]
})
export class Floor {}

@Component({
    selector: 'app-rapier-wrapper-default',
    template: `
		@if (scene() === 'basic') {
			<ng-container *ngComponentOutlet="component()" />
		} @else {
			<ngtr-physics [options]="{ debug: debug(), interpolate: interpolate(), paused: paused() }">
				<ng-template>
					<ngt-directional-light [castShadow]="true" [position]="10">
						<ngt-value [rawValue]="-40" attach="shadow.camera.bottom" />
						<ngt-value [rawValue]="40" attach="shadow.camera.top" />
						<ngt-value [rawValue]="-40" attach="shadow.camera.left" />
						<ngt-value [rawValue]="40" attach="shadow.camera.right" />
						<ngt-value [rawValue]="1024" attach="shadow.mapSize.width" />
						<ngt-value [rawValue]="-0.0001" attach="shadow.bias" />
					</ngt-directional-light>

					<ngts-environment [options]="{ preset: 'apartment' }" />
					<ngts-orbit-controls />

					<ng-container *ngComponentOutlet="component()" />

					<app-floor />
				</ng-template>
			</ngtr-physics>
		}
	`,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgtrPhysics, NgtsEnvironment, NgtsOrbitControls, NgComponentOutlet, Floor],
    host: { class: 'rapier-wrapper-default' }
})
export class RapierWrapperDefault {
	private params = injectParams();
	protected scene = computed(() => this.params()['scene'] as keyof typeof SCENES_MAP);
	protected component = computed(() => SCENES_MAP[this.scene()]);

	protected debug = debug;
	protected interpolate = interpolate;
	protected paused = paused;
}
