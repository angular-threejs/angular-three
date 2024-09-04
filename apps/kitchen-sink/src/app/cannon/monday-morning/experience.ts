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
	inject,
	input,
	output,
	viewChild,
} from '@angular/core';
import { ConeTwistConstraintOpts, Triplet } from '@pmndrs/cannon-worker-api';
import { NgtArgs, NgtThreeEvent, NgtVector3, injectBeforeRender, injectObjectEvents } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { injectBox, injectCompound, injectCylinder, injectSphere } from 'angular-three-cannon/body';
import { NgtcConstraintApi, injectConeTwist, injectPointToPoint } from 'angular-three-cannon/constraint';
import { NgtcDebug } from 'angular-three-cannon/debug';
import { NgtsRoundedBox } from 'angular-three-soba/abstractions';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsSpotLight } from 'angular-three-soba/staging';
import { Group, Material, Mesh, Object3D } from 'three';
import { GLTF } from 'three-stdlib';
import { UiPlane } from '../ui/plane';
import { createRagdoll } from './config';

function injectDragConstraint(ref: Signal<ElementRef<Object3D> | undefined>) {
	const cursorRef = inject(Cursor);
	const injector = inject(Injector);

	let pointToPoint: Signal<NgtcConstraintApi | null>;
	afterNextRender(() => {
		pointToPoint = injectPointToPoint(cursorRef.mesh, ref, {
			injector,
			options: { pivotA: [0, 0, 0], pivotB: [0, 0, 0] },
			disableOnStart: true,
		});
	});

	function onPointerDown(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		//@ts-expect-error Investigate proper types here.
		event.target.setPointerCapture(event.pointerId);
		pointToPoint()?.enable();
	}

	function onPointerUp() {
		pointToPoint()?.disable();
	}

	return { onPointerUp, onPointerDown };
}

@Component({
	selector: 'app-box',
	standalone: true,
	template: `
		<ngts-rounded-box
			[options]="{
				width: width(),
				height: height(),
				depth: depth(),
				castShadow: true,
				receiveShadow: true,
				position: position(),
				scale: scale(),
			}"
		>
			<ngt-mesh-standard-material [color]="color()" [opacity]="opacity()" [transparent]="transparent()" />
			<ng-content />
		</ngts-rounded-box>
	`,
	imports: [NgtArgs, NgtsRoundedBox],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Box {
	width = input(1);
	height = input(1);
	depth = input(1);
	color = input('white');
	opacity = input(1);
	transparent = input(false);
	args = input([1, 1, 1]);
	position = input<NgtVector3>([0, 0, 0]);
	scale = input<NgtVector3>([1, 1, 1]);

	pointerdown = output<NgtThreeEvent<PointerEvent>>();
	pointerup = output<void>();

	private roundedBoxRef = viewChild.required(NgtsRoundedBox);
	meshRef = computed(() => this.roundedBoxRef().meshRef());

	constructor() {
		injectObjectEvents(this.meshRef, {
			pointerdown: (event) => {
				this.pointerdown.emit(event as NgtThreeEvent<PointerEvent>);
			},
			pointerup: () => {
				this.pointerup.emit();
			},
		});
	}
}

const { joints, shapes } = createRagdoll(4.8, Math.PI / 16, Math.PI / 16, 0);

function double([x, y, z]: Readonly<Triplet>): Triplet {
	return [x * 2, y * 2, z * 2];
}

@Component({
	selector: 'app-body-part',
	standalone: true,
	template: `
		<app-box
			[scale]="shapeConfig().scale"
			[color]="shapeConfig().color"
			[position]="[0, 0, 0]"
			(pointerdown)="dragConstraint.onPointerDown($event)"
			(pointerup)="dragConstraint.onPointerUp()"
		>
			<ng-content select="[body-part-parts]" />
		</app-box>

		<ng-content />
	`,
	imports: [Box, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BodyPart {
	name = input.required<keyof typeof shapes>();
	constraintOpts = input<ConeTwistConstraintOpts>();

	protected shapeConfig = computed(() => {
		const { color, position, args, mass } = shapes[this.name()];
		return { color, position, args, mass, scale: double(args) };
	});

	private box = viewChild.required(Box);

	private body = computed(() => this.box().meshRef());
	protected dragConstraint = injectDragConstraint(this.body);

	constructor() {
		const injector = inject(Injector);
		const parent = inject(BodyPart, { skipSelf: true, optional: true });

		injectBox(
			() => ({
				args: [...this.shapeConfig().args],
				linearDamping: 0.99,
				mass: this.shapeConfig().mass,
				position: [...this.shapeConfig().position],
			}),
			this.body,
		);

		afterNextRender(() => {
			if (parent && this.constraintOpts()) {
				injectConeTwist(this.body, parent.body, {
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
							[width]="0.2"
							[height]="0.1"
							[depth]="0.1"
							[args]="[0.3, 0.01, 0.1]"
							[opacity]="0.8"
							[position]="[-0.3, 0.1, 0.5]"
							[transparent]="true"
						/>
						<app-box
							color="black"
							[width]="0.2"
							[height]="0.1"
							[depth]="0.1"
							[args]="[0.3, 0.01, 0.1]"
							[opacity]="0.8"
							[position]="[0.3, 0.1, 0.5]"
							[transparent]="true"
						/>
					</ngt-group>
					<app-box
						#mouth
						[width]="0.3"
						[height]="0.05"
						[depth]="0.1"
						color="#700000"
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
	protected joints = joints;

	private eyes = viewChild<ElementRef<Group>>('eyes');
	private mouth = viewChild('mouth', { read: Box });

	constructor() {
		injectBeforeRender(({ clock }) => {
			const [eyes, mouth] = [this.eyes(), this.mouth()];
			if (eyes && mouth) {
				eyes.nativeElement.position.y = Math.sin(clock.getElapsedTime() * 1) * 0.06;
				mouth.meshRef().nativeElement.scale.y = (1 + Math.sin(clock.getElapsedTime())) * 0.6;
			}
		});
	}
}

@Component({
	selector: 'app-chair',
	standalone: true,
	template: `
		<ngt-group
			#group
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
	private group = viewChild.required<ElementRef<Group>>('group');
	protected dragConstraint = injectDragConstraint(this.group);

	constructor() {
		injectCompound(
			() => ({
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
			}),
			this.group,
		);
	}
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
			#group
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
	protected gltf = injectGLTF(() => './cup.glb') as Signal<CupGLTF | null>;
	private group = viewChild.required<ElementRef<Group>>('group');

	protected dragConstraint = injectDragConstraint(this.group);

	constructor() {
		injectCylinder(
			() => ({ args: [0.6, 0.6, 1, 16], mass: 1, position: [9, 0, 0], rotation: [Math.PI / 2, 0, 0] }),
			this.group,
		);
	}
}

@Component({
	selector: 'app-table',
	standalone: true,
	template: `
		<app-box #seat [scale]="[5, 0.5, 5]" />
		<app-box #leg1 [scale]="[0.5, 4, 0.5]" />
		<app-box #leg2 [scale]="[0.5, 4, 0.5]" />
		<app-box #leg3 [scale]="[0.5, 4, 0.5]" />
		<app-box #leg4 [scale]="[0.5, 4, 0.5]" />
		<app-mug />
	`,
	imports: [NgtArgs, Mug, Box],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Table {
	private seatRef = viewChild('seat', { read: Box });
	private leg1Ref = viewChild('leg1', { read: Box });
	private leg2Ref = viewChild('leg2', { read: Box });
	private leg3Ref = viewChild('leg3', { read: Box });
	private leg4Ref = viewChild('leg4', { read: Box });

	constructor() {
		injectBox(
			() => ({ args: [2.5, 0.25, 2.5], position: [9, -0.8, 0], type: 'Static' }),
			computed(() => this.seatRef()?.meshRef()),
		);
		injectBox(
			() => ({ args: [0.25, 2, 0.25], position: [7.2, -3, 1.8], type: 'Static' }),
			computed(() => this.leg1Ref()?.meshRef()),
		);
		injectBox(
			() => ({ args: [0.25, 2, 0.25], position: [10.8, -3, 1.8], type: 'Static' }),
			computed(() => this.leg2Ref()?.meshRef()),
		);
		injectBox(
			() => ({ args: [0.25, 2, 0.25], position: [7.2, -3, -1.8], type: 'Static' }),
			computed(() => this.leg3Ref()?.meshRef()),
		);
		injectBox(
			() => ({ args: [0.25, 2, 0.25], position: [10.8, -3, -1.8], type: 'Static' }),
			computed(() => this.leg4Ref()?.meshRef()),
		);
	}
}

@Component({
	selector: 'app-cursor',
	standalone: true,
	template: `
		<ngt-mesh #mesh>
			<ngt-sphere-geometry *args="[0.5, 32, 32]" />
			<ngt-mesh-basic-material [fog]="false" [depthTest]="false" [transparent]="true" [opacity]="0.5" />
		</ngt-mesh>
		<ng-content />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cursor {
	mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		const sphereApi = injectSphere<Mesh>(() => ({ args: [0.5], position: [0, 0, 10000], type: 'Static' }), this.mesh);
		injectBeforeRender(({ pointer, viewport: { width, height } }) => {
			const x = pointer.x * width;
			const y = (pointer.y * height) / 1.9 + -x / 3.5;
			sphereApi()?.position.set(x / 1.4, y, 0);
		});
	}
}

@Component({
	selector: 'app-lamp',
	standalone: true,
	template: `
		<ngt-mesh
			#mesh
			(pointerdown)="dragConstraint.onPointerDown($any($event))"
			(pointerup)="dragConstraint.onPointerUp()"
		>
			<ngt-cone-geometry *args="[2, 2.5, 32]" />
			<ngt-mesh-standard-material />

			<!--			<ngt-point-light [decay]="5" [intensity]="10 * Math.PI" />-->
			<ngts-spot-light
				[options]="{
					intensity: Math.PI,
					angle: 0.45,
					distance: 80,
					radiusTop: 0.4,
					radiusBottom: 40,
					penumbra: 0.2,
					anglePower: 5,
					opacity: 0.2,
					color: 'white',
					castShadow: true,
					target: $any(target),
					decay: 0,
				}"
			/>

			<ngt-object3D #target [position]="[0, -1, 0]" />
		</ngt-mesh>
	`,

	imports: [NgtArgs, NgtsSpotLight],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lamp {
	protected Math = Math;

	private mesh = viewChild.required<ElementRef<Mesh>>('mesh');
	protected dragConstraint = injectDragConstraint(this.mesh);

	constructor() {
		const obj = new Object3D();
		injectSphere(() => ({ args: [1], position: [0, 16, 0], type: 'Static' }), obj);
		injectBox(
			() => ({ angulardamping: 1.99, args: [1, 0, 5], linearDamping: 0.9, mass: 1, position: [0, 16, 0] }),
			this.mesh,
		);
		injectPointToPoint(obj, this.mesh, { options: { pivotA: [0, 0, 0], pivotB: [0, 2, 0] } });
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
			<app-cursor>
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
			</app-cursor>
		</ngtc-physics>
	`,
	imports: [NgtArgs, NgtcPhysics, NgtcDebug, Cursor, Lamp, UiPlane, Chair, Table, RagDoll],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'monday-morning-experience' },
})
export class Experience {
	protected Math = Math;
}
