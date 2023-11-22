import { NgIf } from '@angular/common';
import { Component, Input, computed, effect, signal, untracked } from '@angular/core';
import {
	EventQueue,
	type Collider,
	type ColliderHandle,
	type RigidBody,
	type RigidBodyHandle,
	type World,
} from '@dimforge/rapier3d-compat';
import { createApiToken, injectNgtStore, signalStore } from 'angular-three-old';
import { createSingletonProxy } from 'ngxtension/singleton-proxy';
import { MathUtils, Quaternion, type Matrix4, type Object3D, type Vector3 } from 'three';
import { NgtrDebug } from './debug';
import { NgtrFrameStepper } from './frame-stepper';
import type {
	CollisionEnterHandler,
	CollisionExitHandler,
	CollisionPayload,
	ContactForceHandler,
	IntersectionEnterHandler,
	IntersectionExitHandler,
	RigidBodyAutoCollider,
	Vector3Tuple,
} from './types';
import { _matrix4, _position, _rotation, _scale, rapierQuaternionToQuaternion, vectorArrayToVector3 } from './utils';

export type WorldStepCallback = (world: World) => void;
export type WorldStepCallbackSet = Set<{ current: WorldStepCallback }>;

export interface RigidBodyState {
	meshType: 'instancedMesh' | 'mesh';
	rigidBody: RigidBody;
	object: Object3D;
	invertedWorldMatrix: Matrix4;
	setMatrix: (matrix: Matrix4) => void;
	getMatrix: (matrix: Matrix4) => Matrix4;
	/**
	 * Required for instanced rigid bodies.
	 */
	scale: Vector3;
	isSleeping: boolean;
}

export type RigidBodyStateMap = Map<RigidBody['handle'], RigidBodyState>;

export interface ColliderState {
	collider: Collider;
	object: Object3D;

	/**
	 * The parent of which this collider needs to base its
	 * world position on, can be empty
	 */
	worldParent?: Object3D;
}

export type ColliderStateMap = Map<Collider['handle'], ColliderState>;

export type EventMapValue = {
	onSleep?(): void;
	onWake?(): void;
	onCollisionEnter?: CollisionEnterHandler;
	onCollisionExit?: CollisionExitHandler;
	onIntersectionEnter?: IntersectionEnterHandler;
	onIntersectionExit?: IntersectionExitHandler;
	onContactForce?: ContactForceHandler;
};

export type EventMap = Map<ColliderHandle | RigidBodyHandle, EventMapValue>;

export type NgtrPhysicsState = {
	/**
	 * Set the gravity of the physics world
	 * @defaultValue [0, -9.81, 0]
	 */
	gravity: Vector3Tuple;

	/**
	 * The maximum velocity iterations the velocity-based constraint solver can make to attempt
	 * to remove the energy introduced by constraint stabilization.
	 *
	 * @defaultValue 1
	 */
	maxStabilizationIterations: number;

	/**
	 * The maximum velocity iterations the velocity-based friction constraint solver can make.
	 *
	 * The greater this value is, the most realistic friction will be.
	 * However a greater number of iterations is more computationally intensive.
	 *
	 * @defaultValue 8
	 */
	maxVelocityFrictionIterations: number;

	/**
	 * The maximum velocity iterations the velocity-based force constraint solver can make.
	 *
	 * The greater this value is, the most rigid and realistic the physics simulation will be.
	 * However a greater number of iterations is more computationally intensive.
	 *
	 * @defaultValue 4
	 */
	maxVelocityIterations: number;

	/**
	 * The maximal distance separating two objects that will generate predictive contacts
	 *
	 * @defaultValue 0.002
	 *
	 */
	predictionDistance: number;

	/**
	 * The Error Reduction Parameter in between 0 and 1, is the proportion of the positional error to be corrected at each time step
	 * @defaultValue 0.8
	 */
	erp: number;

	/**
	 * Set the base automatic colliders for this physics world
	 * All Meshes inside RigidBodies will generate a collider
	 * based on this value, if not overridden.
	 */
	colliders: RigidBodyAutoCollider;

	/**
	 * Set the timestep for the simulation.
	 * Setting this to a number (eg. 1/60) will run the
	 * simulation at that framerate. Alternatively, you can set this to
	 * "vary", which will cause the simulation to always synchronize with
	 * the current frame delta times.
	 *
	 * @defaultValue 1/60
	 */
	timeStep: number | 'vary';

	/**
	 * Pause the physics simulation
	 *
	 * @defaultValue false
	 */
	paused: boolean;

	/**
	 * Interpolate the world transform using the frame delta times.
	 * Has no effect if timeStep is set to "vary".
	 *
	 * @defaultValue true
	 **/
	interpolate: boolean;

	/**
	 * The update priority at which the physics simulation should run.
	 * Only used when `updateLoop` is set to "follow".
	 *
	 * @see https://docs.pmnd.rs/react-three-fiber/api/hooks#taking-over-the-render-loop
	 * @defaultValue undefined
	 */
	updatePriority: number;

	/**
	 * Set the update loop strategy for the physics world.
	 *
	 * If set to "follow", the physics world will be stepped
	 * in a `useFrame` callback, managed by @react-three/fiber.
	 * You can use `updatePriority` prop to manage the scheduling.
	 *
	 * If set to "independent", the physics world will be stepped
	 * in a separate loop, not tied to the render loop.
	 * This is useful when using the "demand" `frameloop` strategy for the
	 * @react-three/fiber `<Canvas />`.
	 *
	 * @see https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance#on-demand-rendering
	 * @defaultValue "follow"
	 */
	updateLoop: 'follow' | 'independent';

	/**
	 * Enable debug rendering of the physics world.
	 * @defaultValue false
	 */
	debug: boolean;
};

type CollisionSource = {
	collider: { object: Collider; events?: EventMapValue; state?: ColliderState };
	rigidBody: { object?: RigidBody; events?: EventMapValue; state?: RigidBodyState };
};

export const [injectNgtrPhysicsApi, provideNgtrPhysicsApi] = createApiToken(() => NgtrPhysics);

@Component({
	selector: 'ngtr-physics',
	standalone: true,
	imports: [NgtrFrameStepper, NgtrDebug, NgIf],
	template: `
		<ngtr-frame-stepper [type]="updateLoop()" [updatePriority]="updatePriority()" (step)="onStep($event)" />
		<ngtr-debug *ngIf="debug()" />
		<ng-content />
	`,
	providers: [provideNgtrPhysicsApi()],
})
export class NgtrPhysics {
	private inputs = signalStore<NgtrPhysicsState>({
		colliders: 'cuboid',
		timeStep: 1 / 60,
		paused: false,
		interpolate: true,
		updateLoop: 'follow',
		debug: false,
		gravity: [0, -9.81, 0],
		maxStabilizationIterations: 1,
		maxVelocityFrictionIterations: 8,
		maxVelocityIterations: 4,
		predictionDistance: 0.002,
		erp: 0.8,
		updatePriority: 0,
	});

	@Input({ alias: 'colliders' }) set _colliders(colliders: NgtrPhysicsState['colliders']) {
		this.inputs.set({ colliders });
	}

	@Input({ alias: 'timeStep' }) set _timeStep(timeStep: NgtrPhysicsState['timeStep']) {
		this.inputs.set({ timeStep });
	}

	@Input({ alias: 'paused' }) set _paused(paused: NgtrPhysicsState['paused']) {
		this.inputs.set({ paused });
	}

	@Input({ alias: 'interpolate' }) set _interpolate(interpolate: NgtrPhysicsState['interpolate']) {
		this.inputs.set({ interpolate });
	}

	@Input({ alias: 'updateLoop' }) set _updateLoop(updateLoop: NgtrPhysicsState['updateLoop']) {
		this.inputs.set({ updateLoop });
	}

	@Input({ alias: 'debug' }) set _debug(debug: NgtrPhysicsState['debug']) {
		this.inputs.set({ debug });
	}

	@Input({ alias: 'gravity' }) set _gravity(gravity: NgtrPhysicsState['gravity']) {
		this.inputs.set({ gravity });
	}

	@Input({ alias: 'maxStabilizationIterations' }) set _maxStabilizationIterations(
		maxStabilizationIterations: NgtrPhysicsState['maxStabilizationIterations'],
	) {
		this.inputs.set({ maxStabilizationIterations });
	}

	@Input({ alias: 'maxVelocityFrictionIterations' }) set _maxVelocityFrictionIterations(
		maxVelocityFrictionIterations: NgtrPhysicsState['maxVelocityFrictionIterations'],
	) {
		this.inputs.set({ maxVelocityFrictionIterations });
	}

	@Input({ alias: 'maxVelocityIterations' }) set _maxVelocityIterations(
		maxVelocityIterations: NgtrPhysicsState['maxVelocityIterations'],
	) {
		this.inputs.set({ maxVelocityIterations });
	}

	@Input({ alias: 'predictionDistance' }) set _predictionDistance(
		predictionDistance: NgtrPhysicsState['predictionDistance'],
	) {
		this.inputs.set({ predictionDistance });
	}

	@Input({ alias: 'erp' }) set _erp(erp: NgtrPhysicsState['erp']) {
		this.inputs.set({ erp });
	}

	@Input({ alias: 'updatePriority' }) set _updatePriority(updatePriority: NgtrPhysicsState['updatePriority']) {
		this.inputs.set({ updatePriority });
	}

	private store = injectNgtStore();
	private invalidate = this.store.select('invalidate');

	updatePriority = this.inputs.select('updatePriority');
	updateLoop = this.inputs.select('updateLoop');
	debug = this.inputs.select('debug');

	private colliders = this.inputs.select('colliders');
	private gravity = this.inputs.select('gravity');
	private paused = this.inputs.select('paused');
	private maxStabilizationIterations = this.inputs.select('maxStabilizationIterations');
	private maxVelocityFrictionIterations = this.inputs.select('maxVelocityFrictionIterations');
	private maxVelocityIterations = this.inputs.select('maxVelocityIterations');
	private predictionDistance = this.inputs.select('predictionDistance');
	private erp = this.inputs.select('erp');

	private rapier = signal<typeof import('@dimforge/rapier3d-compat')>(null!);
	private worldProxy = computed(() => {
		const rapier = this.rapier();
		if (!rapier) return null;
		return createSingletonProxy<World>(() => new rapier.World(vectorArrayToVector3(this.inputs.get('gravity'))));
	});
	private physicsOptions = computed(() => {
		const [gravity, colliders] = [this.gravity(), this.colliders()];
		return { gravity, colliders };
	});

	private rigidBodyStates: RigidBodyStateMap = new Map();
	private colliderStates: ColliderStateMap = new Map();
	private rigidBodyEvents: EventMap = new Map();
	private colliderEvents: EventMap = new Map();
	private eventQueue = new EventQueue(false);
	private beforeStepCallbacks: WorldStepCallbackSet = new Set();
	private afterStepCallbacks: WorldStepCallbackSet = new Set();

	private steppingState: { previousState: Record<string, any>; accumulator: number } = {
		previousState: {},
		accumulator: 0,
	};

	api = {
		worldProxy: this.worldProxy,
		rapier: this.rapier,
		physicsOptions: this.physicsOptions,
		isPaused: this.paused,
		isDebug: this.debug,
		rigidBodyStates: this.rigidBodyStates,
		colliderStates: this.colliderStates,
		rigidBodyEvents: this.rigidBodyEvents,
		colliderEvents: this.colliderEvents,
		beforeStepCallbacks: this.beforeStepCallbacks,
		afterStepCallbacks: this.afterStepCallbacks,
	};

	constructor() {
		this.initRapier();
		this.freeWorld();
		this.updateMutableProperties();
	}

	onStep(dt: number) {
		if (!untracked(this.paused)) {
			this.step(dt);
		}
	}

	private initRapier() {
		effect(() => {
			import('@dimforge/rapier3d-compat').then((rapier) => {
				rapier.init().then(() => {
					this.rapier.set(rapier);
				});
			});
		});
	}

	private updateMutableProperties() {
		effect(() => {
			const worldProxy = this.worldProxy();
			if (!worldProxy) return;
			const [
				gravity,
				maxStabilizationIterations,
				maxVelocityFrictionIterations,
				maxVelocityIterations,
				predictionDistance,
				erp,
			] = [
				this.gravity(),
				this.maxStabilizationIterations(),
				this.maxVelocityFrictionIterations(),
				this.maxVelocityIterations(),
				this.predictionDistance(),
				this.erp(),
			];

			worldProxy.proxy.gravity = vectorArrayToVector3(gravity);
			worldProxy.proxy.integrationParameters.maxStabilizationIterations = maxStabilizationIterations;
			worldProxy.proxy.integrationParameters.maxVelocityFrictionIterations = maxVelocityFrictionIterations;
			worldProxy.proxy.integrationParameters.maxVelocityIterations = maxVelocityIterations;
			worldProxy.proxy.integrationParameters.predictionDistance = predictionDistance;
			worldProxy.proxy.integrationParameters.erp = erp;
		});
	}

	private freeWorld() {
		effect((onCleanup) => {
			const [worldProxy] = [this.worldProxy()];
			if (worldProxy) {
				onCleanup(() => {
					worldProxy.proxy.free();
					worldProxy.reset();
				});
			}
		});
	}

	private getSourceFromColliderHandle(handle: ColliderHandle) {
		const worldProxy = untracked(this.worldProxy);
		const collider = worldProxy?.proxy.getCollider(handle);
		const colEvents = this.colliderEvents.get(handle);
		const colliderState = this.colliderStates.get(handle);

		const rigidBodyHandle = collider?.parent()?.handle;
		const rigidBody = rigidBodyHandle !== undefined ? worldProxy?.proxy.getRigidBody(rigidBodyHandle) : undefined;
		const rbEvents =
			rigidBody && rigidBodyHandle !== undefined ? this.rigidBodyEvents.get(rigidBodyHandle) : undefined;
		const rigidBodyState = rigidBodyHandle !== undefined ? this.rigidBodyStates.get(rigidBodyHandle) : undefined;

		const source: CollisionSource = {
			collider: {
				object: collider!,
				events: colEvents,
				state: colliderState,
			},
			rigidBody: {
				object: rigidBody,
				events: rbEvents,
				state: rigidBodyState,
			},
		};

		return source;
	}

	private getCollisionPayloadFromSource(target: CollisionSource, other: CollisionSource): CollisionPayload {
		return {
			target: {
				rigidBody: target.rigidBody.object,
				collider: target.collider.object,
				colliderObject: target.collider.state?.object,
				rigidBodyObject: target.rigidBody.state?.object,
			},

			other: {
				rigidBody: other.rigidBody.object,
				collider: other.collider.object,
				colliderObject: other.collider.state?.object,
				rigidBodyObject: other.rigidBody.state?.object,
			},

			rigidBody: other.rigidBody.object,
			collider: other.collider.object,
			colliderObject: other.collider.state?.object,
			rigidBodyObject: other.rigidBody.state?.object,
		};
	}

	private step(dt: number) {
		const worldProxy = this.worldProxy();
		if (!worldProxy) return;

		const { proxy: world } = worldProxy;
		const [timeStep, interpolate, paused] = [
			this.inputs.get('timeStep'),
			this.inputs.get('interpolate'),
			this.inputs.get('paused'),
		];

		/* Check if the timestep is supposed to be variable. We'll do this here
        once so we don't have to string-check every frame. */
		const timeStepVariable = timeStep === 'vary';

		/**
		 * Fixed timeStep simulation progression
		 * @see https://gafferongames.com/post/fix_your_timestep/
		 */

		const clampedDelta = MathUtils.clamp(dt, 0, 0.5);

		const stepWorld = (delta: number) => {
			// Trigger beforeStep callbacks
			this.beforeStepCallbacks.forEach((callback) => {
				callback.current(world);
			});

			world.timestep = delta;
			world.step(this.eventQueue);

			// Trigger afterStep callbacks
			this.afterStepCallbacks.forEach((callback) => {
				callback.current(world);
			});
		};

		if (timeStepVariable) {
			stepWorld(clampedDelta);
		} else {
			// don't step time forwards if paused
			// Increase accumulator
			this.steppingState.accumulator += clampedDelta;

			while (this.steppingState.accumulator >= timeStep) {
				// Set up previous state
				// needed for accurate interpolations if the world steps more than once
				if (interpolate) {
					this.steppingState.previousState = {};
					world.forEachRigidBody((body) => {
						this.steppingState.previousState[body.handle] = {
							position: body.translation(),
							rotation: body.rotation(),
						};
					});
				}

				stepWorld(timeStep);

				this.steppingState.accumulator -= timeStep;
			}
		}

		const interpolationAlpha =
			timeStepVariable || !interpolate || paused ? 1 : this.steppingState.accumulator / timeStep;

		// Update meshes
		this.rigidBodyStates.forEach((state, handle) => {
			const rigidBody = world.getRigidBody(handle);

			const events = this.rigidBodyEvents.get(handle);
			if (events?.onSleep || events?.onWake) {
				if (rigidBody.isSleeping() && !state.isSleeping) {
					events?.onSleep?.();
				}
				if (!rigidBody.isSleeping() && state.isSleeping) {
					events?.onWake?.();
				}
				state.isSleeping = rigidBody.isSleeping();
			}

			if (!rigidBody || (rigidBody.isSleeping() && !('isInstancedMesh' in state.object)) || !state.setMatrix) {
				return;
			}

			// New states
			let t = rigidBody.translation() as Vector3;
			let r = rigidBody.rotation() as Quaternion;

			let previousState = this.steppingState.previousState[handle];

			if (previousState) {
				// Get previous simulated world position
				_matrix4
					.compose(previousState.position, rapierQuaternionToQuaternion(previousState.rotation), state.scale)
					.premultiply(state.invertedWorldMatrix)
					.decompose(_position, _rotation, _scale);

				// Apply previous tick position
				if (state.meshType == 'mesh') {
					state.object.position.copy(_position);
					state.object.quaternion.copy(_rotation);
				}
			}

			// Get new position
			_matrix4
				.compose(t, rapierQuaternionToQuaternion(r), state.scale)
				.premultiply(state.invertedWorldMatrix)
				.decompose(_position, _rotation, _scale);

			if (state.meshType == 'instancedMesh') {
				state.setMatrix(_matrix4);
			} else {
				// Interpolate to new position
				state.object.position.lerp(_position, interpolationAlpha);
				state.object.quaternion.slerp(_rotation, interpolationAlpha);
			}
		});

		this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
			const source1 = this.getSourceFromColliderHandle(handle1);
			const source2 = this.getSourceFromColliderHandle(handle2);

			// Collision Events
			if (!source1?.collider.object || !source2?.collider.object) {
				return;
			}

			const collisionPayload1 = this.getCollisionPayloadFromSource(source1, source2);
			const collisionPayload2 = this.getCollisionPayloadFromSource(source2, source1);

			if (started) {
				world.contactPair(source1.collider.object, source2.collider.object, (manifold, flipped) => {
					/* RigidBody events */
					source1.rigidBody.events?.onCollisionEnter?.({
						...collisionPayload1,
						manifold,
						flipped,
					});

					source2.rigidBody.events?.onCollisionEnter?.({
						...collisionPayload2,
						manifold,
						flipped,
					});

					/* Collider events */
					source1.collider.events?.onCollisionEnter?.({
						...collisionPayload1,
						manifold,
						flipped,
					});

					source2.collider.events?.onCollisionEnter?.({
						...collisionPayload2,
						manifold,
						flipped,
					});
				});
			} else {
				source1.rigidBody.events?.onCollisionExit?.(collisionPayload1);
				source2.rigidBody.events?.onCollisionExit?.(collisionPayload2);
				source1.collider.events?.onCollisionExit?.(collisionPayload1);
				source2.collider.events?.onCollisionExit?.(collisionPayload2);
			}

			// Sensor Intersections
			if (started) {
				if (world.intersectionPair(source1.collider.object, source2.collider.object)) {
					source1.rigidBody.events?.onIntersectionEnter?.(collisionPayload1);

					source2.rigidBody.events?.onIntersectionEnter?.(collisionPayload2);

					source1.collider.events?.onIntersectionEnter?.(collisionPayload1);

					source2.collider.events?.onIntersectionEnter?.(collisionPayload2);
				}
			} else {
				source1.rigidBody.events?.onIntersectionExit?.(collisionPayload1);
				source2.rigidBody.events?.onIntersectionExit?.(collisionPayload2);
				source1.collider.events?.onIntersectionExit?.(collisionPayload1);
				source2.collider.events?.onIntersectionExit?.(collisionPayload2);
			}
		});

		this.eventQueue.drainContactForceEvents((event) => {
			const source1 = this.getSourceFromColliderHandle(event.collider1());
			const source2 = this.getSourceFromColliderHandle(event.collider2());

			// Collision Events
			if (!source1?.collider.object || !source2?.collider.object) {
				return;
			}

			const collisionPayload1 = this.getCollisionPayloadFromSource(source1, source2);
			const collisionPayload2 = this.getCollisionPayloadFromSource(source2, source1);

			source1.rigidBody.events?.onContactForce?.({
				...collisionPayload1,
				totalForce: event.totalForce(),
				totalForceMagnitude: event.totalForceMagnitude(),
				maxForceDirection: event.maxForceDirection(),
				maxForceMagnitude: event.maxForceMagnitude(),
			});

			source2.rigidBody.events?.onContactForce?.({
				...collisionPayload2,
				totalForce: event.totalForce(),
				totalForceMagnitude: event.totalForceMagnitude(),
				maxForceDirection: event.maxForceDirection(),
				maxForceMagnitude: event.maxForceMagnitude(),
			});

			source1.collider.events?.onContactForce?.({
				...collisionPayload1,
				totalForce: event.totalForce(),
				totalForceMagnitude: event.totalForceMagnitude(),
				maxForceDirection: event.maxForceDirection(),
				maxForceMagnitude: event.maxForceMagnitude(),
			});

			source2.collider.events?.onContactForce?.({
				...collisionPayload2,
				totalForce: event.totalForce(),
				totalForceMagnitude: event.totalForceMagnitude(),
				maxForceDirection: event.maxForceDirection(),
				maxForceMagnitude: event.maxForceMagnitude(),
			});
		});

		world.forEachActiveRigidBody(() => {
			this.invalidate();
		});
	}
}
