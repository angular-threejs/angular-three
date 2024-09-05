import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	Directive,
	ElementRef,
	Signal,
	computed,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { Triplet } from '@pmndrs/cannon-worker-api';
import { NgtArgs, injectBeforeRender } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { NgtcBodyPublicApi, injectBox, injectPlane, injectSphere } from 'angular-three-cannon/body';
import { Color, InstancedMesh, Mesh } from 'three';
import niceColors from '../../colors';
import { shape } from './state';

@Component({
	selector: 'app-plane',
	standalone: true,
	template: `
		<ngt-mesh #mesh [receiveShadow]="true">
			<ngt-plane-geometry *args="[10, 10]" />
			<ngt-shadow-material color="#171717" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plane {
	rotation = input<Triplet>([0, 0, 0]);

	private mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		injectPlane(() => ({ rotation: this.rotation() }), this.mesh);
	}
}

@Directive()
export abstract class InstancesInput {
	count = input(200);
	size = input(0.1);
	colors = input.required<Float32Array>();

	abstract bodyApi: Signal<NgtcBodyPublicApi | null>;

	constructor() {
		injectBeforeRender(() => {
			this.bodyApi()
				?.at(Math.floor(Math.random() * this.count()))
				.position.set(0, Math.random() * 2, 0);
		});
	}
}

@Component({
	selector: 'app-boxes',
	standalone: true,
	template: `
		<ngt-instanced-mesh *args="[undefined, undefined, count()]" [receiveShadow]="true" [castShadow]="true" #mesh>
			<ngt-box-geometry *args="args()">
				<ngt-instanced-buffer-attribute attach="attributes.color" *args="[colors(), 3]" />
			</ngt-box-geometry>
			<ngt-mesh-lambert-material [vertexColors]="true" />
		</ngt-instanced-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Boxes extends InstancesInput {
	protected args = computed<Triplet>(() => [this.size(), this.size(), this.size()]);
	private mesh = viewChild<ElementRef<InstancedMesh>>('mesh');

	bodyApi = injectBox(
		() => ({ args: this.args(), mass: 1, position: [Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5] }),
		this.mesh,
	);
}

@Component({
	selector: 'app-spheres',
	standalone: true,
	template: `
		<ngt-instanced-mesh *args="[undefined, undefined, count()]" [receiveShadow]="true" [castShadow]="true" #mesh>
			<ngt-sphere-geometry *args="[size(), 48, 48]">
				<ngt-instanced-buffer-attribute attach="attributes.color" *args="[colors(), 3]" />
			</ngt-sphere-geometry>
			<ngt-mesh-lambert-material [vertexColors]="true" />
		</ngt-instanced-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Spheres extends InstancesInput {
	protected args = computed<Triplet>(() => [this.size(), this.size(), this.size()]);
	private mesh = viewChild<ElementRef<InstancedMesh>>('mesh');

	bodyApi = injectSphere(
		() => ({ args: [this.size()], mass: 1, position: [Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5] }),
		this.mesh,
	);
}

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['lightblue']" />
		<ngt-hemisphere-light [intensity]="0.35 * Math.PI" />
		<ngt-spot-light
			[angle]="0.3"
			[castShadow]="true"
			[decay]="0"
			[intensity]="2 * Math.PI"
			[penumbra]="1"
			[position]="[10, 10, 10]"
		/>

		<ngtc-physics [options]="{ broadphase: 'SAP' }">
			<app-plane [rotation]="[-Math.PI / 2, 0, 0]" />
			@if (shape() === 'box') {
				<app-boxes [count]="count()" [size]="size()" [colors]="colors()" />
			} @else {
				<app-spheres [count]="count()" [size]="size()" [colors]="colors()" />
			}
		</ngtc-physics>
	`,
	imports: [NgtArgs, NgtcPhysics, Plane, Boxes, Spheres],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'cube-heap-experience' },
})
export class Experience {
	protected Math = Math;
	protected shape = shape.asReadonly();

	protected size = signal(0.1);
	protected count = signal(200);
	protected colors = computed(() => {
		const array = new Float32Array(this.count() * 3);
		const color = new Color();
		for (let i = 0; i < this.count(); i++)
			color
				.set(niceColors[Math.floor(Math.random() * 5)])
				.convertSRGBToLinear()
				.toArray(array, i * 3);
		return array;
	});
}
