import { Directive, afterNextRender, inject, input } from '@angular/core';
import { BodyProps, BodyShapeType, propsToBody } from '@pmndrs/cannon-worker-api';
import { beforeRender, injectStore, is } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { Body, Quaternion as CQuarternion, Vec3, World } from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';

const q = new THREE.Quaternion();
const s = new THREE.Vector3(1, 1, 1);
const v = new THREE.Vector3();
const m = new THREE.Matrix4();

function getMatrix(o: THREE.Object3D) {
	if (is.three<THREE.InstancedMesh>(o, 'isInstancedMesh')) {
		o.getMatrixAt(parseInt(o.uuid.split('/')[1]), m);
		return m;
	}
	return o.matrix;
}

/**
 * Configuration options for the physics debug visualization.
 */
export interface NgtcDebugInputs {
	/**
	 * Whether debug visualization is enabled.
	 * @default true
	 */
	enabled: boolean;
	/**
	 * Color of the debug wireframes.
	 * @default 'black'
	 */
	color: string;
	/**
	 * Custom CannonDebugger implementation to use.
	 * @default CannonDebugger from 'cannon-es-debugger'
	 */
	impl: typeof CannonDebugger;
	/**
	 * Scale factor for debug visualization.
	 * @default 1
	 */
	scale: number;
}

const defaultOptions: NgtcDebugInputs = {
	enabled: true,
	scale: 1,
	color: 'black',
	impl: CannonDebugger,
};

/**
 * Angular directive that adds debug visualization to the physics simulation.
 * Renders wireframe shapes for all physics bodies to help with debugging.
 *
 * Must be used as an attribute on the `ngtc-physics` directive.
 *
 * @example
 * ```html
 * <ngtc-physics
 *   [options]="{ gravity: [0, -9.81, 0] }"
 *   [debug]="{ enabled: true, color: 'red', scale: 1 }"
 * >
 *   <app-physics-scene />
 * </ngtc-physics>
 * ```
 *
 * @example
 * ```html
 * <!-- Toggle debug visualization based on state -->
 * <ngtc-physics
 *   [options]="physicsOptions"
 *   [debug]="{ enabled: isDebugging() }"
 * >
 *   <app-physics-scene />
 * </ngtc-physics>
 * ```
 */
@Directive({ selector: 'ngtc-physics[debug]' })
export class NgtcDebug {
	/**
	 * Debug visualization configuration options.
	 * @see NgtcDebugInputs for available options
	 */
	debug = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private physics = inject(NgtcPhysics);

	private store = injectStore();
	private defaultScene = this.store.scene;

	private debuggerScene = new THREE.Scene();
	private bodies: Body[] = [];
	private bodyMap: Record<string, Body> = {};

	private cannonDebugger!: ReturnType<typeof CannonDebugger>;

	constructor() {
		// NOTE: afterNextRender so we only instantiate once after inputs have been resolved
		afterNextRender(() => {
			this.defaultScene().add(this.debuggerScene);
			this.cannonDebugger = this.debug().impl(this.debuggerScene, { bodies: this.bodies } as World, {
				color: this.debug().color,
				scale: this.debug().scale,
			});
		});

		beforeRender(() => {
			if (!this.cannonDebugger) return;

			const enabled = this.debug().enabled;
			const refs = this.physics.refs;
			for (const uuid in this.bodyMap) {
				const ref = refs[uuid];
				const body = this.bodyMap[uuid];
				if (ref) {
					getMatrix(ref).decompose(v, q, s);
					body.position.copy(v as unknown as Vec3);
					body.quaternion.copy(q as unknown as CQuarternion);
				}
			}

			for (const child of this.debuggerScene.children) child.visible = enabled;
			if (enabled) this.cannonDebugger.update();
		});
	}

	/**
	 * Adds a physics body to the debug visualization.
	 * Called internally when a new body is created in the physics world.
	 *
	 * @param uuid - Unique identifier for the body
	 * @param props - Body properties including shape, position, and rotation
	 * @param type - The shape type of the physics body
	 */
	add(uuid: string, props: BodyProps, type: BodyShapeType) {
		const body = propsToBody({ uuid, props, type });
		this.bodies.push(body);
		this.bodyMap[uuid] = body;
	}

	/**
	 * Removes a physics body from the debug visualization.
	 * Called internally when a body is removed from the physics world.
	 *
	 * @param uuid - Unique identifier for the body to remove
	 */
	remove(uuid: string) {
		const debugBodyIndex = this.bodies.indexOf(this.bodyMap[uuid]);
		if (debugBodyIndex > -1) this.bodies.splice(debugBodyIndex, 1);
		delete this.bodyMap[uuid];
	}
}
