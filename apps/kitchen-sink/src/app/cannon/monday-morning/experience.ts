import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	Injector,
	inject,
	input,
	signal,
	untracked,
} from '@angular/core';
import { NgtArgs, NgtThreeEvent, extend, injectBeforeRender, injectNgtRef } from 'angular-three';
import { NgtcPhysics, NgtcPhysicsContent } from 'angular-three-cannon';
import { injectBox, injectCompound, injectSphere } from 'angular-three-cannon/body';
import { NgtcConstraintReturn, injectPointToPoint } from 'angular-three-cannon/constraint';
import { NgtcDebug } from 'angular-three-cannon/debug';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { createInjectionToken } from 'ngxtension/create-injection-token';
import * as THREE from 'three';
import { Mesh, Object3D } from 'three';
import { UiPlane } from '../ui/plane';

extend(THREE);

const [injectCursorRef, provideCursorRef] = createInjectionToken(() => signal<ElementRef<Mesh> | null>(null));

function injectDragConstraint(ref: ElementRef<Object3D>) {
	const cursorRef = injectCursorRef();
	const autoEffect = injectAutoEffect();
	const injector = inject(Injector);

	const api = signal<NgtcConstraintReturn<'PointToPoint'>['api']>(null!);

	autoEffect(() => {
		const cursor = cursorRef();
		if (!cursor) return;

		const pointToPoint = injectPointToPoint(cursor, ref, {
			options: { pivotA: [0, 0, 0], pivotB: [0, 0, 0] },
			injector,
			disableOnStart: true,
		});

		untracked(() => {
			api.set(pointToPoint.api);
		});
	});

	function onPointerDown(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		//@ts-expect-error Investigate proper types here.
		event.target.setPointerCapture(event.pointerId);
		api().enable();
	}

	function onPointerUp() {
		api().disable();
	}

	return { onPointerUp, onPointerDown };
}

@Component({
	selector: 'app-box',
	standalone: true,
	template: `
		<ngt-mesh [castShadow]="true" [receiveShadow]="true" [ref]="boxRef()" [position]="position()" [scale]="scale()">
			<ngt-box-geometry *args="args()" />
			<ngt-mesh-standard-material [color]="color()" [opacity]="opacity()" [transparent]="transparent()" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Box {
	boxRef = input(injectNgtRef<Mesh>());
	color = input('white');
	opacity = input(1);
	transparent = input(false);
	args = input([1, 1, 1]);
	position = input([0, 0, 0]);
	scale = input([1, 1, 1]);
}

@Component({
	selector: 'app-chair',
	standalone: true,
	template: `
		<ngt-group
			[ref]="compound.ref"
			(pointerdown)="dragConstraint.onPointerDown($any($event))"
			(pointerup)="dragConstraint.onPointerUp()"
		>
			<app-box [position]="[0, 0, 0]" [scale]="[3, 3, 0.5]" />
			<app-box [position]="[0, -1.75, 1.25]" [scale]="[3, 0.5, 3]" />
			<app-box [position]="[5 + -6.25, -3.5, 0]" [scale]="[0.5, 3, 0.5]" />
			<app-box [position]="[5 + -3.75, -3.5, 0]" [scale]="[0.5, 3, 0.5]" />
			<app-box [position]="[5 + -6.25, -3.5, 2.5]" [scale]="[0.5, 3, 0.5]" />
			<app-box [position]="[5 + -3.75, -3.5, 2.5]" [scale]="[0.5, 3, 0.5]" />
		</ngt-group>
	`,
	imports: [Box],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chair {
	compound = injectCompound(() => ({
		mass: 1,
		position: [-6, 0, 0],
		shapes: [
			{ args: [1.5, 1.5, 0.25], mass: 1, position: [0, 0, 0], type: 'Box' },
			{ args: [1.5, 0.25, 1.5], mass: 1, position: [0, -1.75, 1.25], type: 'Box' },
			{ args: [0.25, 1.5, 0.25], mass: 10, position: [5 + -6.25, -3.5, 0], type: 'Box' },
			{ args: [0.25, 1.5, 0.25], mass: 10, position: [5 + -3.75, -3.5, 0], type: 'Box' },
			{ args: [0.25, 1.5, 0.25], mass: 10, position: [5 + -6.25, -3.5, 2.5], type: 'Box' },
			{ args: [0.25, 1.5, 0.25], mass: 10, position: [5 + -3.75, -3.5, 2.5], type: 'Box' },
		],
		type: 'Dynamic',
	}));
	dragConstraint = injectDragConstraint(this.compound.ref);
}

@Component({
	selector: 'app-cursor',
	standalone: true,
	template: `
		<ngt-mesh [ref]="sphere.ref">
			<ngt-sphere-geometry *args="[0.5, 32, 32]" />
			<ngt-mesh-basic-material [fog]="false" [depthTest]="false" [transparent]="true" [opacity]="0.5" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cursor {
	cursorRef = injectCursorRef();
	sphere = injectSphere<Mesh>(() => ({
		args: [0.5],
		position: [0, 0, 10000],
		type: 'Static',
	}));

	constructor() {
		this.cursorRef.set(this.sphere.ref);
		injectBeforeRender(({ pointer, viewport: { width, height } }) => {
			const x = pointer.x * width;
			const y = (pointer.y * height) / 1.9 + -x / 3.5;
			this.sphere.api.position.set(x / 1.4, y, 0);
		});
	}
}

@Component({
	selector: 'app-lamp',
	standalone: true,
	template: `
		<ngt-mesh
			[ref]="box.ref"
			(pointerdown)="dragConstraint.onPointerDown($any($event))"
			(pointerup)="dragConstraint.onPointerUp()"
		>
			<ngt-cone-geometry *args="[2, 2.5, 32]" />
			<ngt-mesh-standard-material />

			<ngt-point-light [decay]="5" [intensity]="10 * Math.PI" />
			<ngt-spot-light
				[angle]="0.4"
				[decay]="0"
				[penumbra]="1"
				[position]="[0, 20, 0]"
				[intensity]="0.6 * Math.PI"
				[castShadow]="true"
			/>
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lamp {
	Math = Math;
	sphere = injectSphere(() => ({ args: [1], position: [0, 16, 0], type: 'Static' }));
	box = injectBox(() => ({
		angulardamping: 1.99,
		args: [1, 0, 5],
		linearDamping: 0.9,
		mass: 1,
		position: [0, 16, 0],
	}));

	dragConstraint = injectDragConstraint(this.box.ref);

	constructor() {
		injectPointToPoint(this.sphere.ref, this.box.ref, { options: { pivotA: [0, 0, 0], pivotB: [0, 2, 0] } });
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['#171720']" />
		<ngt-fog attach="fog" *args="['#171720', 20, 70]" />
		<ngt-ambient-light [intensity]="0.2 * Math.PI" />
		<ngt-point-light [decay]="0" [position]="[-10, -10, -10]" color="red" [intensity]="1.5 * Math.PI" />

		<ngtc-physics
			[options]="{ iterations: 15, gravity: [0, -200, 0], allowSleep: false }"
			[debug]="{ enabled: false, scale: 1.1, color: 'white' }"
		>
			<ng-template physicsContent>
				<app-cursor />
				<app-ui-plane
					[position]="[0, -5, 0]"
					[rotation]="[-Math.PI / 2, 0, 0]"
					[size]="1000"
					[useShadowMaterial]="false"
				/>
				<app-chair />
				<app-lamp />
			</ng-template>
		</ngtc-physics>
	`,
	imports: [NgtArgs, NgtcPhysics, NgtcPhysicsContent, NgtcDebug, Cursor, Lamp, UiPlane, Chair],
	providers: [provideCursorRef()],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'monday-morning-experience' },
})
export class Experience {
	Math = Math;
}
