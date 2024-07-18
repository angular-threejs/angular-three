import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	InjectionToken,
	Injector,
	Signal,
	afterNextRender,
	computed,
	inject,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CylinderArgs, Triplet } from '@pmndrs/cannon-worker-api';
import { NgtArgs, extend, injectBeforeRender, injectStore } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { injectBox, injectCylinder, injectSphere } from 'angular-three-cannon/body';
import { injectConeTwist } from 'angular-three-cannon/constraint';
import { NgtcDebug } from 'angular-three-cannon/debug';
import * as THREE from 'three';
import { Color, ColorRepresentation, Mesh, Object3D } from 'three';

extend(THREE);

const Parent = new InjectionToken<{ position: Signal<Triplet>; ref: Signal<ElementRef<Object3D>> }>('PARENT');

@Component({
	selector: 'app-chain-link',
	standalone: true,
	template: `
		<ngt-mesh #mesh>
			<ngt-cylinder-geometry *args="args()" />
			<ngt-mesh-standard-material [roughness]="0.3" [color]="color()" />
		</ngt-mesh>
		<ng-content />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: Parent,
			useFactory: (chainLink: ChainLink) => ({ ref: chainLink.mesh, position: chainLink.position }),
			deps: [ChainLink],
		},
	],
})
export class ChainLink {
	parent = inject(Parent, { skipSelf: true });

	maxMultiplier = input<number>();
	color = input<ColorRepresentation>('#575757');
	args = input<CylinderArgs>([0.5, 0.5, 2, 16]);

	height = computed(() => this.args()[2] ?? 2);
	position = computed<Triplet>(() => {
		const [[x, y, z], height] = [this.parent.position(), this.height()];
		return [x, y - height, z];
	});

	mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	cylinder = injectCylinder(
		() => ({ mass: 1, args: this.args(), linearDamping: 0.8, position: this.position() }),
		this.mesh,
	);

	constructor() {
		const injector = inject(Injector);
		// NOTE: we want to run this in afterNextRender because we want the input to resolve
		afterNextRender(() => {
			injectConeTwist(this.parent.ref, this.mesh, {
				injector,
				options: {
					angle: Math.PI / 8,
					axisA: [0, 1, 0],
					axisB: [0, 1, 0],
					maxMultiplier: this.maxMultiplier(),
					pivotA: [0, -this.height() / 2, 0],
					pivotB: [0, this.height() / 2, 0],
					twistAngle: 0,
				},
			});
		});
	}
}

function notUndefined<T>(value: T | undefined): value is T {
	return value !== undefined;
}

const maxMultiplierExamples = [0, 500, 1000, 1500, undefined] as const;

@Component({
	selector: 'app-chain',
	standalone: true,
	template: `
		@if (length() > 0) {
			<app-chain-link [color]="color()" [maxMultiplier]="maxMultiplier()">
				<app-chain [length]="length() - 1" [maxMultiplier]="maxMultiplier()" />
			</app-chain-link>
		}
	`,
	imports: [ChainLink],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Chain {
	length = input.required<number>();
	maxMultiplier = input<number>();

	color = computed(() => {
		const maxMultiplier = this.maxMultiplier();
		if (maxMultiplier === undefined) return '#575757';

		const maxExample = Math.max(...maxMultiplierExamples.filter(notUndefined));
		const red = Math.floor(Math.min(100, (maxMultiplier / maxExample) * 100));

		return new Color(`rgb(${red}%, 0%, ${100 - red}%)`);
	});
}

@Component({
	selector: 'app-pointer-handle',
	standalone: true,
	template: `
		<ngt-group>
			<ngt-mesh #mesh>
				<ngt-box-geometry *args="args()" />
				<ngt-mesh-standard-material [roughness]="0.3" color="#575757" />
			</ngt-mesh>
			<ng-content />
		</ngt-group>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: Parent,
			useFactory: (handle: PointerHandle) => ({ ref: handle.mesh, position: () => handle.position }),
			deps: [PointerHandle],
		},
	],
})
export class PointerHandle {
	size = input.required<number>();
	args = computed<Triplet>(() => [this.size(), this.size(), this.size() * 2]);

	position: Triplet = [0, 0, 0];
	mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	boxApi = injectBox(() => ({ args: this.args(), position: this.position, type: 'Kinematic' }), this.mesh);

	constructor() {
		injectBeforeRender(({ pointer: { x, y }, viewport: { width, height } }) => {
			this.boxApi()?.position.set((x * width) / 2, (y * height) / 2, 0);
		});
	}
}

@Component({
	selector: 'app-static-handle',
	standalone: true,
	template: `
		<ngt-group>
			<ngt-mesh #mesh>
				<ngt-sphere-geometry *args="[radius(), 64, 64]" />
				<ngt-mesh-standard-material [roughness]="0.3" color="#575757" />
			</ngt-mesh>
			<ng-content />
		</ngt-group>
	`,
	imports: [NgtArgs],
	providers: [
		{
			provide: Parent,
			useFactory: (handle: StaticHandle) => ({ ref: handle.mesh, position: handle.position }),
			deps: [StaticHandle],
		},
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaticHandle {
	position = input.required<Triplet>();
	radius = input.required<number>();
	mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	sphere = injectSphere(() => ({ args: [this.radius()], position: this.position(), type: 'Static' }), this.mesh);
}

@Component({
	standalone: true,
	template: `
		<ngt-color *args="['#171720']" attach="background" />
		<ngt-ambient-light [intensity]="0.5 * Math.PI" />
		<ngt-point-light [position]="[-10, -10, -10]" [intensity]="Math.PI" [decay]="0" />
		<ngt-spot-light
			[position]="[10, 10, 10]"
			[angle]="0.8"
			[penumbra]="1"
			[intensity]="Math.PI"
			[decay]="0"
			[castShadow]="true"
		/>

		<ngtc-physics [options]="{ gravity: [0, -40, 0], allowSleep: false }">
			<app-pointer-handle [size]="1.5">
				<app-chain [length]="7" />
			</app-pointer-handle>

			@for (maxMultiplier of maxMultiplierExamples(); track maxMultiplier.key) {
				<app-static-handle [radius]="1.5" [position]="maxMultiplier.position">
					<app-chain [maxMultiplier]="maxMultiplier.value" [length]="8" />
				</app-static-handle>
			}
		</ngtc-physics>
	`,
	imports: [NgtcPhysics, NgtcDebug, NgtArgs, PointerHandle, Chain, StaticHandle],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'chain-experience' },
})
export class Experience {
	Math = Math;

	private store = injectStore();

	resetCount = signal(0);
	maxMultiplierExamples = computed(() =>
		maxMultiplierExamples.map((value, index, array) => ({
			value,
			key: `${value}-${this.resetCount()}`,
			position: [(array.length * -4) / 2 + index * 4, 8, 0] as Triplet,
		})),
	);

	constructor() {
		this.store
			.get('pointerMissed$')
			.pipe(takeUntilDestroyed())
			.subscribe(() => {
				this.resetCount.update((prev) => prev + 1);
			});
	}
}
