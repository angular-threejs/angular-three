import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	DestroyRef,
	Directive,
	effect,
	inject,
	input,
	signal,
	TemplateRef,
	untracked,
} from '@angular/core';
import RAPIER, { ColliderHandle, EventQueue, Rotation, Vector, World } from '@dimforge/rapier3d-compat';
import { injectStore, pick, vector3 } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { MathUtils, Quaternion, Vector3 } from 'three';
import { NgtrDebug } from './debug';
import { NgtrFrameStepper } from './frame-stepper';
import { _matrix4, _position, _rotation, _scale } from './shared';
import {
	NgtrColliderStateMap,
	NgtrCollisionPayload,
	NgtrCollisionSource,
	NgtrEventMap,
	NgtrPhysicsOptions,
	NgtrRigidBodyStateMap,
	NgtrWorldStepCallbackSet,
} from './types';
import { createSingletonProxy, rapierQuaternionToQuaternion } from './utils';

const defaultOptions: NgtrPhysicsOptions = {
	gravity: [0, -9.81, 0],
	allowedLinearError: 0.001,
	numSolverIterations: 4,
	numAdditionalFrictionIterations: 4,
	numInternalPgsIterations: 1,
	predictionDistance: 0.002,
	minIslandSize: 128,
	maxCcdSubsteps: 1,
	contactNaturalFrequency: 30,
	erp: 0.8,
	lengthUnit: 1,
	colliders: 'cuboid',
	updateLoop: 'follow',
	interpolate: true,
	paused: false,
	timeStep: 1 / 60,
	debug: false,
};

@Directive({ selector: 'ng-template[rapierFallback]', standalone: true })
export class NgtrPhysicsFallback {
	static ngTemplateContextGuard(_: NgtrPhysicsFallback, ctx: unknown): ctx is { error: string } {
		return true;
	}
}

@Component({
	selector: 'ngtr-physics',
	standalone: true,
	template: `
		@if (rapierConstruct()) {
			@if (debug()) {
				<ngtr-debug [world]="worldSingleton()?.proxy" />
			}

			<ngtr-frame-stepper
				[ready]="ready()"
				[stepFn]="step.bind(this)"
				[type]="updateLoop()"
				[updatePriority]="updatePriority()"
			/>

			<ng-container [ngTemplateOutlet]="content()" />
		} @else if (rapierError() && !!fallbackContent()) {
			<ng-container [ngTemplateOutlet]="$any(fallbackContent())" [ngTemplateOutletContext]="{ error: rapierError() }" />
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrDebug, NgtrFrameStepper, NgTemplateOutlet],
})
export class NgtrPhysics {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	content = contentChild.required(TemplateRef);
	fallbackContent = contentChild(NgtrPhysicsFallback);

	protected updatePriority = pick(this.options, 'updatePriority');
	protected updateLoop = pick(this.options, 'updateLoop');

	private numSolverIterations = pick(this.options, 'numSolverIterations');
	private numAdditionalFrictionIterations = pick(this.options, 'numAdditionalFrictionIterations');
	private numInternalPgsIterations = pick(this.options, 'numInternalPgsIterations');
	private allowedLinearError = pick(this.options, 'allowedLinearError');
	private minIslandSize = pick(this.options, 'minIslandSize');
	private maxCcdSubsteps = pick(this.options, 'maxCcdSubsteps');
	private predictionDistance = pick(this.options, 'predictionDistance');
	private contactNaturalFrequency = pick(this.options, 'contactNaturalFrequency');
	private lengthUnit = pick(this.options, 'lengthUnit');
	private timeStep = pick(this.options, 'timeStep');
	private interpolate = pick(this.options, 'interpolate');

	paused = pick(this.options, 'paused');
	debug = pick(this.options, 'debug');
	colliders = pick(this.options, 'colliders');

	private gravity = vector3(this.options, 'gravity');

	private store = injectStore();
	private destroyRef = inject(DestroyRef);

	protected rapierConstruct = signal<typeof RAPIER | null>(null);
	protected rapierError = signal<string | null>(null);
	rapier = this.rapierConstruct.asReadonly();

	ready = computed(() => !!this.rapier());
	worldSingleton = computed(() => {
		const rapier = this.rapier();
		if (!rapier) return null;
		return createSingletonProxy<World>(() => new rapier.World(untracked(this.gravity)));
	});

	rigidBodyStates: NgtrRigidBodyStateMap = new Map();
	colliderStates: NgtrColliderStateMap = new Map();
	rigidBodyEvents: NgtrEventMap = new Map();
	colliderEvents: NgtrEventMap = new Map();
	private beforeStepCallbacks: NgtrWorldStepCallbackSet = new Set();
	private afterStepCallbacks: NgtrWorldStepCallbackSet = new Set();

	private eventQueue = computed(() => {
		const rapier = this.rapier();
		if (!rapier) return null;
		return new EventQueue(false);
	});

	private steppingState: {
		accumulator: number;
		previousState: Record<number, { position: Vector; rotation: Rotation }>;
	} = { accumulator: 0, previousState: {} };

	constructor() {
		import('@dimforge/rapier3d-compat')
			.then((rapier) => rapier.init().then(() => rapier))
			.then(this.rapierConstruct.set.bind(this.rapierConstruct))
			.catch((err) => {
				console.error(`[NGT] Failed to load rapier3d-compat`, err);
				this.rapierError.set(err?.message ?? err.toString());
			});

		effect(() => {
			this.updateWorldEffect();
		});

		this.destroyRef.onDestroy(() => {
			const world = this.worldSingleton();
			if (world) {
				world.proxy.free();
				world.reset();
			}
		});
	}

	step(delta: number) {
		if (!this.paused()) {
			this.internalStep(delta);
		}
	}

	private updateWorldEffect() {
		const world = this.worldSingleton();
		if (!world) return;

		world.proxy.gravity = this.gravity();
		world.proxy.integrationParameters.numSolverIterations = this.numSolverIterations();
		world.proxy.integrationParameters.numAdditionalFrictionIterations = this.numAdditionalFrictionIterations();
		world.proxy.integrationParameters.numInternalPgsIterations = this.numInternalPgsIterations();
		world.proxy.integrationParameters.normalizedAllowedLinearError = this.allowedLinearError();
		world.proxy.integrationParameters.minIslandSize = this.minIslandSize();
		world.proxy.integrationParameters.maxCcdSubsteps = this.maxCcdSubsteps();
		world.proxy.integrationParameters.normalizedPredictionDistance = this.predictionDistance();
		world.proxy.integrationParameters.contact_natural_frequency = this.contactNaturalFrequency();
		world.proxy.lengthUnit = this.lengthUnit();
	}

	private internalStep(delta: number) {
		const worldSingleton = this.worldSingleton();
		if (!worldSingleton) return;

		const eventQueue = this.eventQueue();
		if (!eventQueue) return;

		const world = worldSingleton.proxy;
		const [timeStep, interpolate, paused] = [this.timeStep(), this.interpolate(), this.paused()];

		/* Check if the timestep is supposed to be variable. We'll do this here
      once so we don't have to string-check every frame. */
		const timeStepVariable = timeStep === 'vary';

		/**
		 * Fixed timeStep simulation progression.
		 * @see https://gafferongames.com/post/fix_your_timestep/
		 */
		const clampedDelta = MathUtils.clamp(delta, 0, 0.5);

		const stepWorld = (innerDelta: number) => {
			// Trigger beforeStep callbacks
			this.beforeStepCallbacks.forEach((callback) => {
				callback(world);
			});

			world.timestep = innerDelta;
			world.step(eventQueue);

			// Trigger afterStep callbacks
			this.afterStepCallbacks.forEach((callback) => {
				callback(world);
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
				if (rigidBody.isSleeping() && !state.isSleeping) events?.onSleep?.();
				if (!rigidBody.isSleeping() && state.isSleeping) events?.onWake?.();
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
					.compose(previousState.position as Vector3, rapierQuaternionToQuaternion(previousState.rotation), state.scale)
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

		eventQueue.drainCollisionEvents((handle1, handle2, started) => {
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
					source1.rigidBody.events?.onCollisionEnter?.({ ...collisionPayload1, manifold, flipped });
					source2.rigidBody.events?.onCollisionEnter?.({ ...collisionPayload2, manifold, flipped });

					/* Collider events */
					source1.collider.events?.onCollisionEnter?.({ ...collisionPayload1, manifold, flipped });
					source2.collider.events?.onCollisionEnter?.({ ...collisionPayload2, manifold, flipped });
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

		eventQueue.drainContactForceEvents((event) => {
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
			this.store.snapshot.invalidate();
		});
	}

	private getSourceFromColliderHandle(handle: ColliderHandle) {
		const world = this.worldSingleton();
		if (!world) return;

		const collider = world.proxy.getCollider(handle);
		const colEvents = this.colliderEvents.get(handle);
		const colliderState = this.colliderStates.get(handle);

		const rigidBodyHandle = collider.parent()?.handle;
		const rigidBody = rigidBodyHandle !== undefined ? world.proxy.getRigidBody(rigidBodyHandle) : undefined;
		const rigidBodyEvents =
			rigidBody && rigidBodyHandle !== undefined ? this.rigidBodyEvents.get(rigidBodyHandle) : undefined;
		const rigidBodyState = rigidBodyHandle !== undefined ? this.rigidBodyStates.get(rigidBodyHandle) : undefined;

		return {
			collider: { object: collider, events: colEvents, state: colliderState },
			rigidBody: { object: rigidBody, events: rigidBodyEvents, state: rigidBodyState },
		} as NgtrCollisionSource;
	}

	private getCollisionPayloadFromSource(target: NgtrCollisionSource, other: NgtrCollisionSource): NgtrCollisionPayload {
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
		};
	}
}
