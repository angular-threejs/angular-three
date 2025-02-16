import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsEnvironment } from 'angular-three-soba/staging';

@Component({
	selector: 'app-floor',
	template: `
		<ngt-object3D
			rigidBody="fixed"
			[options]="{ colliders: 'cuboid' }"
			name="floor"
			[position]="[0, -12.55 - 5, 0]"
			[scale]="[200, 10, 200]"
			[rotation]="[0, 0, 0]"
		>
			<ngt-mesh receiveShadow>
				<ngt-box-geometry />
				<ngt-shadow-material [opacity]="0.2" />
			</ngt-mesh>
		</ngt-object3D>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrRigidBody],
})
export class Floor {}

@Component({
	selector: 'app-rapier-wrapper-default',
	template: `
		<ngtr-physics [options]="{ debug: debug(), interpolate: interpolate(), paused: paused() }">
			<ng-template>
				<ngt-directional-light
					castShadow
					[position]="10"
					[shadow.camera.bottom]="-40"
					[shadow.camera.top]="40"
					[shadow.camera.left]="-40"
					[shadow.camera.right]="40"
					[shadow.mapSize.width]="1024"
					[shadow.bias]="-0.0001"
				/>

				<ngts-environment [options]="{ preset: 'apartment' }" />
				<ngts-orbit-controls />

				<router-outlet #o="outlet" />

				@if (o.activatedRoute.snapshot.url[0]?.path !== 'basic') {
					<app-floor />
				}
			</ng-template>
		</ngtr-physics>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrPhysics, NgtsEnvironment, NgtsOrbitControls, Floor, RouterOutlet],
	host: { class: 'rapier-wrapper-default' },
})
export class RapierWrapperDefault {
	debug = input(true);
	interpolate = input(false);
	paused = input(false);
}
