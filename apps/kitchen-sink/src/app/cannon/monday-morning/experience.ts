import { NgTemplateOutlet } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	Injector,
	Signal,
	afterNextRender,
	computed,
	forwardRef,
	inject,
	input,
	output,
	signal,
	untracked,
	viewChild,
} from '@angular/core';
import { ConeTwistConstraintOpts, Triplet } from '@pmndrs/cannon-worker-api';
import { NgtArgs, NgtThreeEvent, extend, injectBeforeRender, injectNgtRef } from 'angular-three';
import { NgtcPhysics, NgtcPhysicsContent } from 'angular-three-cannon';
import { injectBox, injectCompound, injectCylinder, injectSphere } from 'angular-three-cannon/body';
import { NgtcConstraintReturn, injectConeTwist, injectPointToPoint } from 'angular-three-cannon/constraint';
import { NgtcDebug } from 'angular-three-cannon/debug';
import { injectGLTFLoader } from 'angular-three-soba/loaders';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { createInjectionToken, createNoopInjectionToken } from 'ngxtension/create-injection-token';
import * as THREE from 'three';
import { Group, Material, Mesh, Object3D } from 'three';
import { GLTF } from 'three-stdlib';
import { UiPlane } from '../ui/plane';
import { createRagdoll } from './config';

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
		<ngt-mesh
			[castShadow]="true"
			[receiveShadow]="true"
			[ref]="boxRef()"
			[position]="position()"
			[scale]="scale()"
			(pointerdown)="pointerdown.emit($any($event))"
			(pointerup)="pointerup.emit()"
		>
			<ngt-box-geometry *args="args()" />
			<ngt-mesh-standard-material [color]="color()" [opacity]="opacity()" [transparent]="transparent()" />
			<ng-content />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Box {
	boxRef = input(injectNgtRef<Object3D>());
	color = input('white');
	opacity = input(1);
	transparent = input(false);
	args = input([1, 1, 1]);
	position = input([0, 0, 0]);
	scale = input([1, 1, 1]);

	pointerdown = output<NgtThreeEvent<PointerEvent>>();
	pointerup = output<void>();
}

const { joints, shapes } = createRagdoll(4.8, Math.PI / 16, Math.PI / 16, 0);

function double([x, y, z]: Readonly<Triplet>): Triplet {
	return [x * 2, y * 2, z * 2];
}

const [injectParentRef, , ParentRef] = createNoopInjectionToken<ElementRef<Object3D>>('parent body part ref');

@Component({
	selector: 'app-body-part',
	standalone: true,
	template: `
		<app-box
			[castShadow]="true"
			[receiveShadow]="true"
			[scale]="shapeConfig().scale"
			[name]="name()"
			[color]="shapeConfig().color"
			[boxRef]="body.ref"
			[position]="[0, 0, 0]"
			(pointerdown)="dragConstraint.onPointerDown($event)"
			(pointerup)="dragConstraint.onPointerUp()"
		>
			<ng-content select="[body-part-parts]" />
		</app-box>

		<ng-content />
	`,
	providers: [
		{
			provide: ParentRef,
			useFactory: (bodyPart: BodyPart) => bodyPart.body.ref,
			deps: [forwardRef(() => BodyPart)],
		},
	],
	imports: [Box, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BodyPart {
	parentRef = injectParentRef({ skipSelf: true, optional: true });

	name = input.required<keyof typeof shapes>();
	constraintOpts = input<ConeTwistConstraintOpts>();

	shapeConfig = computed(() => {
		const { color, position, args, mass } = shapes[this.name()];
		return { color, position, args, mass, scale: double(args) };
	});

	body = injectBox(() => ({
		args: [...this.shapeConfig().args],
		linearDamping: 0.99,
		mass: this.shapeConfig().mass,
		position: [...this.shapeConfig().position],
	}));

	dragConstraint = injectDragConstraint(this.body.ref);

	constructor() {
		const injector = inject(Injector);
		afterNextRender(() => {
			if (this.parentRef && this.constraintOpts()) {
				injectConeTwist(this.body.ref, this.parentRef, {
					injector,
					options: this.constraintOpts(),
				});
			}
		});
	}
}

@Component({
	selector: 'app-rag-doll',
	standalone: true,
	template: `
		<app-body-part name="upperBody">
			<app-body-part name="head" [constraintOpts]="joints['neckJoint']">
				<ng-container body-part-parts>
					<ngt-group #eyes>
						<app-box
							color="black"
							[args]="[0.3, 0.01, 0.1]"
							[opacity]="0.8"
							[position]="[-0.3, 0.1, 0.5]"
							[transparent]="true"
						/>
						<app-box
							color="black"
							[args]="[0.3, 0.01, 0.1]"
							[opacity]="0.8"
							[position]="[0.3, 0.1, 0.5]"
							[transparent]="true"
						/>
					</ngt-group>
					<app-box
						#mouth
						color="#270000"
						[args]="[0.3, 0.05, 0.1]"
						[opacity]="0.8"
						[position]="[0, -0.2, 0.5]"
						[transparent]="true"
					/>
				</ng-container>
			</app-body-part>

			<app-body-part name="upperLeftArm" [constraintOpts]="joints['leftShoulder']">
				<app-body-part name="lowerLeftArm" [constraintOpts]="joints['leftElbowJoint']" />
			</app-body-part>
			<app-body-part name="upperRightArm" [constraintOpts]="joints['rightShoulder']">
				<app-body-part name="lowerRightArm" [constraintOpts]="joints['rightElbowJoint']" />
			</app-body-part>
			<app-body-part name="pelvis" [constraintOpts]="joints['spineJoint']">
				<app-body-part name="upperLeftLeg" [constraintOpts]="joints['leftHipJoint']">
					<app-body-part name="lowerLeftLeg" [constraintOpts]="joints['leftKneeJoint']" />
				</app-body-part>
				<app-body-part name="upperRightLeg" [constraintOpts]="joints['rightHipJoint']">
					<app-body-part name="lowerRightLeg" [constraintOpts]="joints['rightKneeJoint']" />
				</app-body-part>
			</app-body-part>
		</app-body-part>
	`,
	imports: [Box, BodyPart],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RagDoll {
	joints = joints;

	eyes = viewChild<ElementRef<Group>>('eyes');
	mouth = viewChild('mouth', { read: Box });

	constructor() {
		injectBeforeRender(({ clock }) => {
			const [eyes, mouth] = [this.eyes(), this.mouth()];
			if (eyes && mouth) {
				eyes.nativeElement.position.y = Math.sin(clock.getElapsedTime() * 1) * 0.06;
				mouth.boxRef().nativeElement.scale.y = (1 + Math.sin(clock.getElapsedTime())) * 1.5;
			}
		});
	}
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

interface CupGLTF extends GLTF {
	materials: { default: Material; Liquid: Material };
	nodes: { 'buffer-0-mesh-0': Mesh; 'buffer-0-mesh-0_1': Mesh };
}

@Component({
	selector: 'app-mug',
	standalone: true,
	template: `
		<ngt-group
			[ref]="cylinder.ref"
			(pointerdown)="dragConstraint.onPointerDown($any($event))"
			(pointerup)="dragConstraint.onPointerUp()"
			[dispose]="null"
		>
			<ngt-group [scale]="0.01">
				@if (gltf(); as gltf) {
					<ngt-mesh
						[material]="gltf.materials.default"
						[geometry]="gltf.nodes['buffer-0-mesh-0'].geometry"
						[castShadow]="true"
						[receiveShadow]="true"
					/>
					<ngt-mesh
						[material]="gltf.materials.Liquid"
						[geometry]="gltf.nodes['buffer-0-mesh-0_1'].geometry"
						[castShadow]="true"
						[receiveShadow]="true"
					/>
				}
			</ngt-group>
		</ngt-group>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Mug {
	gltf = injectGLTFLoader(() => './cup.glb') as Signal<CupGLTF | null>;
	cylinder = injectCylinder(() => ({
		args: [0.6, 0.6, 1, 16],
		mass: 1,
		position: [9, 0, 0],
		rotation: [Math.PI / 2, 0, 0],
	}));
	dragConstraint = injectDragConstraint(this.cylinder.ref);
}

@Component({
	selector: 'app-table',
	standalone: true,
	template: `
		<app-box [scale]="[5, 0.5, 5]" [boxRef]="seat.ref" />
		<app-box [scale]="[0.5, 4, 0.5]" [boxRef]="leg1.ref" />
		<app-box [scale]="[0.5, 4, 0.5]" [boxRef]="leg2.ref" />
		<app-box [scale]="[0.5, 4, 0.5]" [boxRef]="leg3.ref" />
		<app-box [scale]="[0.5, 4, 0.5]" [boxRef]="leg4.ref" />
		<app-mug />
	`,
	imports: [NgtArgs, Mug, Box],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Table {
	seat = injectBox(() => ({ args: [2.5, 0.25, 2.5], position: [9, -0.8, 0], type: 'Static' }));
	leg1 = injectBox(() => ({ args: [0.25, 2, 0.25], position: [7.2, -3, 1.8], type: 'Static' }));
	leg2 = injectBox(() => ({ args: [0.25, 2, 0.25], position: [10.8, -3, 1.8], type: 'Static' }));
	leg3 = injectBox(() => ({ args: [0.25, 2, 0.25], position: [7.2, -3, -1.8], type: 'Static' }));
	leg4 = injectBox(() => ({ args: [0.25, 2, 0.25], position: [10.8, -3, -1.8], type: 'Static' }));
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
				<app-rag-doll />
				<app-chair />
				<app-table />
				<app-lamp />
			</ng-template>
		</ngtc-physics>
	`,
	imports: [NgtArgs, NgtcPhysics, NgtcPhysicsContent, NgtcDebug, Cursor, Lamp, UiPlane, Chair, Table, RagDoll],
	providers: [provideCursorRef()],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'monday-morning-experience' },
})
export class Experience {
	Math = Math;
}
