import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	effect,
	input,
	output,
	signal,
	viewChild,
} from '@angular/core';
import { Triplet } from '@pmndrs/cannon-worker-api';
import { NgtArgs } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { injectCompound, injectPlane } from 'angular-three-cannon/body';
import { NgtcDebug } from 'angular-three-cannon/debug';
import { Group } from 'three';

@Component({
	selector: 'app-plane',
	standalone: true,
	template: `
		<ngt-group #group>
			<ngt-mesh>
				<ngt-plane-geometry *args="[8, 8]" />
				<ngt-mesh-basic-material color="#ffb385" />
			</ngt-mesh>
			<ngt-mesh [receiveShadow]="true">
				<ngt-plane-geometry *args="[8, 8]" />
				<ngt-shadow-material color="lightsalmon" />
			</ngt-mesh>
		</ngt-group>
	`,
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Plane {
	rotation = input<Triplet>([0, 0, 0]);
	private group = viewChild.required<ElementRef<Group>>('group');

	constructor() {
		injectPlane(() => ({ type: 'Static', rotation: this.rotation() }), this.group);
	}
}

@Component({
	selector: 'app-compound-body',
	standalone: true,
	template: `
		<ngt-group #group>
			<ngt-mesh [castShadow]="true">
				<ngt-box-geometry *args="boxSize" />
				<ngt-mesh-normal-material />
			</ngt-mesh>
			<ngt-mesh [castShadow]="true" [position]="[1, 0, 0]">
				<ngt-sphere-geometry *args="[sphereRadius, 16, 16]" />
				<ngt-mesh-normal-material />
			</ngt-mesh>
		</ngt-group>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompoundBody {
	protected boxSize: Triplet = [1, 1, 1];
	protected sphereRadius = 0.65;

	position = input<Triplet>([0, 0, 0]);
	rotation = input<Triplet>([0, 0, 0]);
	isTrigger = input(false);
	mass = input(12);

	positionChanged = output<Triplet>();
	rotationChanged = output<Triplet>();

	private group = viewChild.required<ElementRef<Group>>('group');

	constructor() {
		const compoundApi = injectCompound(
			() => ({
				isTrigger: this.isTrigger(),
				mass: this.mass(),
				position: this.position(),
				rotation: this.rotation(),
				shapes: [
					{ args: this.boxSize, position: [0, 0, 0], rotation: [0, 0, 0], type: 'Box' },
					{ args: [this.sphereRadius], position: [1, 0, 0], rotation: [0, 0, 0], type: 'Sphere' },
				],
			}),
			this.group,
		);

		effect((onCleanup) => {
			const api = compoundApi();
			if (!api) return;

			const positionCleanup = api.position.subscribe(this.positionChanged.emit.bind(this.positionChanged));
			const rotationCleanup = api.rotation.subscribe(this.rotationChanged.emit.bind(this.rotationChanged));

			onCleanup(() => {
				positionCleanup();
				rotationCleanup();
			});
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['#f6d186']" />
		<ngt-hemisphere-light [intensity]="0.35" />
		<ngt-spot-light [position]="[5, 5, 5]" [angle]="0.3" [penumbra]="1" [intensity]="2" [castShadow]="true">
			<ngt-vector2 *args="[1028, 1028]" attach="shadow.mapSize" />
		</ngt-spot-light>

		<ngtc-physics [options]="{ iterations: 6 }" [debug]="{ scale: 1.1 }">
			<app-plane [rotation]="[-Math.PI / 2, 0, 0]" />
			<app-compound-body [position]="[1.5, 5, 0.5]" [rotation]="[1.25, 0, 0]" />
			<app-compound-body
				[position]="[2.5, 3, 0.25]"
				[rotation]="[1.25, -1.25, 0]"
				(positionChanged)="!copy() && (position = $event)"
				(rotationChanged)="!copy() && (rotation = $event)"
			/>

			@if (ready()) {
				<app-compound-body [position]="[2.5, 4, 0.25]" [rotation]="[1.25, -1.25, 0]" />
			}

			@if (copy()) {
				<app-compound-body [isTrigger]="true" [mass]="0" [position]="position" [rotation]="rotation" />
			}
		</ngtc-physics>
	`,
	imports: [NgtArgs, NgtcPhysics, NgtcDebug, Plane, CompoundBody],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'compound-experience' },
})
export class Experience {
	protected Math = Math;

	protected ready = signal(false);
	protected copy = signal(false);

	protected position: Triplet = [0, 0, 0];
	protected rotation: Triplet = [0, 0, 0];

	constructor() {
		afterNextRender(() => {
			setTimeout(() => {
				this.ready.set(true);
			}, 2000);

			setTimeout(() => {
				this.copy.set(true);
			}, 1000);
		});
	}
}
