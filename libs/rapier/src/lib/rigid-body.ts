import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	Directive,
	effect,
	ElementRef,
	inject,
	input,
	model,
	output,
	untracked,
} from '@angular/core';
import { ActiveEvents, Collider, ColliderDesc, RigidBody, RigidBodyDesc } from '@dimforge/rapier3d-compat';
import {
	applyProps,
	extend,
	getEmitter,
	getLocalState,
	hasListener,
	NgtEuler,
	NgtObject3D,
	NgtQuaternion,
	NgtVector3,
	pick,
} from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Matrix4, Object3D, Vector3 } from 'three';
import { NgtrPhysics } from './physics';
import { _matrix4, _position, _rotation, _scale, _vector3 } from './shared';
import {
	NgtrColliderOptions,
	NgtrColliderShape,
	NgtrColliderState,
	NgtrCollisionEnterPayload,
	NgtrCollisionExitPayload,
	NgtrContactForcePayload,
	NgtrIntersectionEnterPayload,
	NgtrIntersectionExitPayload,
	NgtrRigidBodyOptions,
	NgtrRigidBodyState,
	NgtrRigidBodyType,
} from './types';
import { createColliderOptions } from './utils';

const colliderDefaultOptions: NgtrColliderOptions = {
	contactSkin: 0,
};

@Directive({ selector: 'ngt-object3D[ngtrCollider]' })
export class NgtrAnyCollider {
	position = input<NgtVector3 | undefined>([0, 0, 0]);
	rotation = input<NgtEuler | undefined>([0, 0, 0]);
	scale = input<NgtVector3 | undefined>([1, 1, 1]);
	quaternion = input<NgtQuaternion | undefined>([0, 0, 0, 1]);
	userData = input<NgtObject3D['userData'] | undefined>({});
	name = input<NgtObject3D['name'] | undefined>();
	options = input(colliderDefaultOptions, { transform: mergeInputs(rigidBodyDefaultOptions) });

	private object3DParameters = computed(() => {
		return {
			position: this.position(),
			rotation: this.rotation(),
			scale: this.scale(),
			quaternion: this.quaternion(),
			userData: this.userData(),
			name: this.name(),
		};
	});

	// TODO: change this to input required when Angular allows setting hostDirective input
	shape = model<NgtrColliderShape | undefined>(undefined, { alias: 'ngtrCollider' });
	args = model<unknown[]>([]);

	collisionEnter = output<NgtrCollisionEnterPayload>();
	collisionExit = output<NgtrCollisionExitPayload>();
	intersectionEnter = output<NgtrIntersectionEnterPayload>();
	intersectionExit = output<NgtrIntersectionExitPayload>();
	contactForce = output<NgtrContactForcePayload>();

	private sensor = pick(this.options, 'sensor');
	private collisionGroups = pick(this.options, 'collisionGroups');
	private solverGroups = pick(this.options, 'solverGroups');
	private friction = pick(this.options, 'friction');
	private frictionCombineRule = pick(this.options, 'frictionCombineRule');
	private restitution = pick(this.options, 'restitution');
	private restitutionCombineRule = pick(this.options, 'restitutionCombineRule');
	private activeCollisionTypes = pick(this.options, 'activeCollisionTypes');
	private contactSkin = pick(this.options, 'contactSkin');
	private mass = pick(this.options, 'mass');
	private massProperties = pick(this.options, 'massProperties');
	private density = pick(this.options, 'density');

	private rigidBody = inject(NgtrRigidBody, { optional: true });
	private physics = inject(NgtrPhysics);
	private objectRef = inject<ElementRef<Object3D>>(ElementRef);

	private scaledArgs = computed(() => {
		const [shape, args] = [
			this.shape(),
			this.args() as (number | ArrayLike<number> | { x: number; y: number; z: number })[],
		];

		const cloned = args.slice();

		// Heightfield uses a vector
		if (shape === 'heightfield') {
			const s = cloned[3] as { x: number; y: number; z: number };
			s.x *= this.worldScale.x;
			s.y *= this.worldScale.y;
			s.z *= this.worldScale.z;

			return cloned;
		}

		// Trimesh and convex scale the vertices
		if (shape === 'trimesh' || shape === 'convexHull') {
			cloned[0] = this.scaleVertices(cloned[0] as ArrayLike<number>, this.worldScale);
			return cloned;
		}

		// prefill with some extra
		const scaleArray = [this.worldScale.x, this.worldScale.y, this.worldScale.z, this.worldScale.x, this.worldScale.x];
		return cloned.map((arg, index) => scaleArray[index] * (arg as number));
	});

	private collider = computed(() => {
		const worldSingleton = this.physics.worldSingleton();
		if (!worldSingleton) return null;

		const [shape, args, rigidBody] = [this.shape(), this.scaledArgs(), this.rigidBody?.rigidBody()];

		// @ts-expect-error - we know the type of the data
		const desc = ColliderDesc[shape](...args);
		if (!desc) return null;

		return worldSingleton.proxy.createCollider(desc, rigidBody ?? undefined);
	});

	constructor() {
		extend({ Object3D });

		effect(() => {
			const object3DParameters = this.object3DParameters();
			applyProps(this.objectRef.nativeElement, object3DParameters);
		});

		effect((onCleanup) => {
			const cleanup = this.createColliderStateEffect();
			onCleanup(() => cleanup?.());
		});

		effect((onCleanup) => {
			const cleanup = this.createColliderEventsEffect();
			onCleanup(() => cleanup?.());
		});

		effect(() => {
			this.updateColliderEffect();
			this.updateMassPropertiesEffect();
		});
	}

	get worldScale() {
		return this.objectRef.nativeElement.getWorldScale(new Vector3());
	}

	setShape(shape: NgtrColliderShape) {
		this.shape.set(shape);
	}

	setArgs(args: unknown[]) {
		this.args.set(args);
	}

	private createColliderStateEffect() {
		const collider = this.collider();
		if (!collider) return;

		const worldSingleton = this.physics.worldSingleton();
		if (!worldSingleton) return;

		const localState = getLocalState(this.objectRef.nativeElement);
		if (!localState) return;

		const parent = localState.parent();
		if (!parent || !(parent as Object3D).isObject3D) return;

		const state = this.createColliderState(
			collider,
			this.objectRef.nativeElement,
			this.rigidBody?.objectRef.nativeElement,
		);
		this.physics.colliderStates.set(collider.handle, state);

		return () => {
			this.physics.colliderStates.delete(collider.handle);
			if (worldSingleton.proxy.getCollider(collider.handle)) {
				worldSingleton.proxy.removeCollider(collider, true);
			}
		};
	}

	private createColliderEventsEffect() {
		const collider = this.collider();
		if (!collider) return;

		const worldSingleton = this.physics.worldSingleton();
		if (!worldSingleton) return;

		const collisionEnter = getEmitter(this.collisionEnter);
		const collisionExit = getEmitter(this.collisionExit);
		const intersectionEnter = getEmitter(this.intersectionEnter);
		const intersectionExit = getEmitter(this.intersectionExit);
		const contactForce = getEmitter(this.contactForce);

		const hasCollisionEvent = hasListener(
			this.collisionEnter,
			this.collisionExit,
			this.intersectionEnter,
			this.intersectionExit,
			this.rigidBody?.collisionEnter,
			this.rigidBody?.collisionExit,
			this.rigidBody?.intersectionEnter,
			this.rigidBody?.intersectionExit,
		);
		const hasContactForceEvent = hasListener(this.contactForce, this.rigidBody?.contactForce);

		if (hasCollisionEvent && hasContactForceEvent) {
			collider.setActiveEvents(ActiveEvents.COLLISION_EVENTS | ActiveEvents.CONTACT_FORCE_EVENTS);
		} else if (hasCollisionEvent) {
			collider.setActiveEvents(ActiveEvents.COLLISION_EVENTS);
		} else if (hasContactForceEvent) {
			collider.setActiveEvents(ActiveEvents.CONTACT_FORCE_EVENTS);
		}

		this.physics.colliderEvents.set(collider.handle, {
			onCollisionEnter: collisionEnter,
			onCollisionExit: collisionExit,
			onIntersectionEnter: intersectionEnter,
			onIntersectionExit: intersectionExit,
			onContactForce: contactForce,
		});
		return () => {
			this.physics.colliderEvents.delete(collider.handle);
		};
	}

	private updateColliderEffect() {
		const collider = this.collider();
		if (!collider) return;

		const worldSingleton = this.physics.worldSingleton();
		if (!worldSingleton) return;

		const state = this.physics.colliderStates.get(collider.handle);
		if (!state) return;

		// Update collider position based on the object's position
		const parentWorldScale = state.object.parent!.getWorldScale(_vector3);
		const parentInvertedWorldMatrix = state.worldParent?.matrixWorld.clone().invert();

		state.object.updateWorldMatrix(true, false);

		_matrix4.copy(state.object.matrixWorld);

		if (parentInvertedWorldMatrix) {
			_matrix4.premultiply(parentInvertedWorldMatrix);
		}

		_matrix4.decompose(_position, _rotation, _scale);

		if (collider.parent()) {
			collider.setTranslationWrtParent({
				x: _position.x * parentWorldScale.x,
				y: _position.y * parentWorldScale.y,
				z: _position.z * parentWorldScale.z,
			});
			collider.setRotationWrtParent(_rotation);
		} else {
			collider.setTranslation({
				x: _position.x * parentWorldScale.x,
				y: _position.y * parentWorldScale.y,
				z: _position.z * parentWorldScale.z,
			});
			collider.setRotation(_rotation);
		}

		const [
			sensor,
			collisionGroups,
			solverGroups,
			friction,
			frictionCombineRule,
			restitution,
			restitutionCombineRule,
			activeCollisionTypes,
			contactSkin,
		] = [
			this.sensor(),
			this.collisionGroups(),
			this.solverGroups(),
			this.friction(),
			this.frictionCombineRule(),
			this.restitution(),
			this.restitutionCombineRule(),
			this.activeCollisionTypes(),
			this.contactSkin(),
		];

		if (sensor !== undefined) collider.setSensor(sensor);
		if (collisionGroups !== undefined) collider.setCollisionGroups(collisionGroups);
		if (solverGroups !== undefined) collider.setSolverGroups(solverGroups);
		if (friction !== undefined) collider.setFriction(friction);
		if (frictionCombineRule !== undefined) collider.setFrictionCombineRule(frictionCombineRule);
		if (restitution !== undefined) collider.setRestitution(restitution);
		if (restitutionCombineRule !== undefined) collider.setRestitutionCombineRule(restitutionCombineRule);
		if (activeCollisionTypes !== undefined) collider.setActiveCollisionTypes(activeCollisionTypes);
		if (contactSkin !== undefined) collider.setContactSkin(contactSkin);
	}

	private updateMassPropertiesEffect() {
		const collider = this.collider();
		if (!collider) return;

		const [mass, massProperties, density] = [this.mass(), this.massProperties(), this.density()];

		if (density !== undefined) {
			if (mass !== undefined || massProperties !== undefined) {
				throw new Error('[NGT Rapier] Cannot set mass and massProperties along with density');
			}

			collider.setDensity(density);
			return;
		}

		if (mass !== undefined) {
			if (massProperties !== undefined) {
				throw new Error('[NGT Rapier] Cannot set massProperties along with mass');
			}
			collider.setMass(mass);
			return;
		}

		if (massProperties !== undefined) {
			collider.setMassProperties(
				massProperties.mass,
				massProperties.centerOfMass,
				massProperties.principalAngularInertia,
				massProperties.angularInertiaLocalFrame,
			);
			return;
		}
	}

	private createColliderState(
		collider: Collider,
		object: Object3D,
		rigidBodyObject?: Object3D | null,
	): NgtrColliderState {
		return { collider, worldParent: rigidBodyObject || undefined, object };
	}

	private scaleVertices(vertices: ArrayLike<number>, scale: Vector3) {
		const scaledVerts = Array.from(vertices);

		for (let i = 0; i < vertices.length / 3; i++) {
			scaledVerts[i * 3] *= scale.x;
			scaledVerts[i * 3 + 1] *= scale.y;
			scaledVerts[i * 3 + 2] *= scale.z;
		}

		return scaledVerts;
	}
}

const RIGID_BODY_TYPE_MAP: Record<NgtrRigidBodyType, number> = {
	fixed: 1,
	dynamic: 0,
	kinematicPosition: 2,
	kinematicVelocity: 3,
};

export const rigidBodyDefaultOptions: NgtrRigidBodyOptions = {
	canSleep: true,
	linearVelocity: [0, 0, 0],
	angularVelocity: [0, 0, 0],
	gravityScale: 1,
	dominanceGroup: 0,
	ccd: false,
	softCcdPrediction: 0,
	contactSkin: 0,
};

@Component({
	selector: 'ngt-object3D[ngtrRigidBody]',
	exportAs: 'rigidBody',
	template: `
		<ng-content />
		@for (childColliderOption of childColliderOptions(); track $index) {
			<ngt-object3D
				[ngtrCollider]="childColliderOption.shape"
				[args]="childColliderOption.args"
				[position]="childColliderOption.position"
				[rotation]="childColliderOption.rotation"
				[scale]="childColliderOption.scale"
				[name]="objectRef.nativeElement.name + '-collider-' + $index"
				[options]="childColliderOption.colliderOptions"
			/>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrAnyCollider],
})
export class NgtrRigidBody {
	type = input('dynamic', {
		alias: 'ngtrRigidBody',
		transform: (value: NgtrRigidBodyType | '' | undefined) => {
			if (value === '' || value === undefined) return 'dynamic' as NgtrRigidBodyType;
			return value;
		},
	});
	position = input<NgtVector3 | undefined>([0, 0, 0]);
	rotation = input<NgtEuler | undefined>([0, 0, 0]);
	scale = input<NgtVector3 | undefined>([1, 1, 1]);
	quaternion = input<NgtQuaternion | undefined>([0, 0, 0, 1]);
	userData = input<NgtObject3D['userData'] | undefined>({});
	options = input(rigidBodyDefaultOptions, { transform: mergeInputs(rigidBodyDefaultOptions) });

	private object3DParameters = computed(() => {
		return {
			position: this.position(),
			rotation: this.rotation(),
			scale: this.scale(),
			quaternion: this.quaternion(),
			userData: this.userData(),
		};
	});

	wake = output<void>();
	sleep = output<void>();
	collisionEnter = output<NgtrCollisionEnterPayload>();
	collisionExit = output<NgtrCollisionExitPayload>();
	intersectionEnter = output<NgtrIntersectionEnterPayload>();
	intersectionExit = output<NgtrIntersectionExitPayload>();
	contactForce = output<NgtrContactForcePayload>();

	private canSleep = pick(this.options, 'canSleep');
	private colliders = pick(this.options, 'colliders');
	private transformState = pick(this.options, 'transformState');
	private gravityScale = pick(this.options, 'gravityScale');
	private dominanceGroup = pick(this.options, 'dominanceGroup');
	private ccd = pick(this.options, 'ccd');
	private softCcdPrediction = pick(this.options, 'softCcdPrediction');
	private additionalSolverIterations = pick(this.options, 'additionalSolverIterations');
	private linearDamping = pick(this.options, 'linearDamping');
	private angularDamping = pick(this.options, 'angularDamping');
	private lockRotations = pick(this.options, 'lockRotations');
	private lockTranslations = pick(this.options, 'lockTranslations');
	private enabledRotations = pick(this.options, 'enabledRotations');
	private enabledTranslations = pick(this.options, 'enabledTranslations');
	private angularVelocity = pick(this.options, 'angularVelocity');
	private linearVelocity = pick(this.options, 'linearVelocity');

	objectRef = inject<ElementRef<Object3D>>(ElementRef);
	private physics = inject(NgtrPhysics);

	private bodyType = computed(() => RIGID_BODY_TYPE_MAP[this.type()]);
	private bodyDesc = computed(() => {
		const [canSleep, bodyType] = [this.canSleep(), untracked(this.bodyType), this.colliders()];
		return new RigidBodyDesc(bodyType).setCanSleep(canSleep);
	});
	rigidBody = computed(() => {
		const worldSingleton = this.physics.worldSingleton();
		if (!worldSingleton) return null;
		return worldSingleton.proxy.createRigidBody(this.bodyDesc());
	});

	protected childColliderOptions = computed(() => {
		const colliders = this.colliders();
		// if self colliders is false explicitly, disable auto colliders for this object entirely.
		if (colliders === false) return [];

		const physicsColliders = this.physics.colliders();
		// if physics colliders is false explicitly AND colliders is not set, disable auto colliders for this object entirely.
		if (physicsColliders === false && colliders === undefined) return [];

		const options = untracked(this.options);
		// if colliders on object is not set, use physics colliders
		if (!options.colliders) options.colliders = physicsColliders;

		const objectLocalState = getLocalState(this.objectRef.nativeElement);
		if (!objectLocalState) return [];

		// track object's parent and non-object children
		const [parent] = [objectLocalState.parent(), objectLocalState.nonObjects()];
		if (!parent || !(parent as Object3D).isObject3D) return [];

		return createColliderOptions(this.objectRef.nativeElement, options, true);
	});

	constructor() {
		extend({ Object3D });

		effect(() => {
			const object3DParameters = this.object3DParameters();
			applyProps(this.objectRef.nativeElement, object3DParameters);
		});

		effect((onCleanup) => {
			const cleanup = this.createRigidBodyStateEffect();
			onCleanup(() => cleanup?.());
		});

		effect((onCleanup) => {
			const cleanup = this.createRigidBodyEventsEffect();
			onCleanup(() => cleanup?.());
		});

		effect(() => {
			this.updateRigidBodyEffect();
		});
	}

	private createRigidBodyStateEffect() {
		const worldSingleton = this.physics.worldSingleton();
		if (!worldSingleton) return;

		const body = this.rigidBody();
		if (!body) return;

		const transformState = untracked(this.transformState);

		const localState = getLocalState(this.objectRef.nativeElement);
		if (!localState) return;

		const parent = localState.parent();
		if (!parent || !(parent as Object3D).isObject3D) return;

		const state = this.createRigidBodyState(body, this.objectRef.nativeElement);
		this.physics.rigidBodyStates.set(body.handle, transformState ? transformState(state) : state);

		return () => {
			this.physics.rigidBodyStates.delete(body.handle);
			if (worldSingleton.proxy.getRigidBody(body.handle)) {
				worldSingleton.proxy.removeRigidBody(body);
			}
		};
	}

	private createRigidBodyEventsEffect() {
		const worldSingleton = this.physics.worldSingleton();
		if (!worldSingleton) return;

		const body = this.rigidBody();
		if (!body) return;

		const wake = getEmitter(this.wake);
		const sleep = getEmitter(this.sleep);
		const collisionEnter = getEmitter(this.collisionEnter);
		const collisionExit = getEmitter(this.collisionExit);
		const intersectionEnter = getEmitter(this.intersectionEnter);
		const intersectionExit = getEmitter(this.intersectionExit);
		const contactForce = getEmitter(this.contactForce);

		this.physics.rigidBodyEvents.set(body.handle, {
			onWake: wake,
			onSleep: sleep,
			onCollisionEnter: collisionEnter,
			onCollisionExit: collisionExit,
			onIntersectionEnter: intersectionEnter,
			onIntersectionExit: intersectionExit,
			onContactForce: contactForce,
		});

		return () => {
			this.physics.rigidBodyEvents.delete(body.handle);
		};
	}

	private updateRigidBodyEffect() {
		const worldSingleton = this.physics.worldSingleton();
		if (!worldSingleton) return;

		const body = this.rigidBody();
		if (!body) return;

		const state = this.physics.rigidBodyStates.get(body.handle);
		if (!state) return;

		state.object.updateWorldMatrix(true, false);
		_matrix4.copy(state.object.matrixWorld).decompose(_position, _rotation, _scale);
		body.setTranslation(_position, true);
		body.setRotation(_rotation, true);

		const [
			gravityScale,
			additionalSolverIterations,
			linearDamping,
			angularDamping,
			lockRotations,
			lockTranslations,
			enabledRotations,
			enabledTranslations,
			angularVelocity,
			linearVelocity,
			ccd,
			softCcdPrediction,
			dominanceGroup,
			userData,
			bodyType,
		] = [
			this.gravityScale(),
			this.additionalSolverIterations(),
			this.linearDamping(),
			this.angularDamping(),
			this.lockRotations(),
			this.lockTranslations(),
			this.enabledRotations(),
			this.enabledTranslations(),
			this.angularVelocity(),
			this.linearVelocity(),
			this.ccd(),
			this.softCcdPrediction(),
			this.dominanceGroup(),
			this.userData(),
			this.bodyType(),
		];

		body.setGravityScale(gravityScale, true);
		if (additionalSolverIterations !== undefined) body.setAdditionalSolverIterations(additionalSolverIterations);
		if (linearDamping !== undefined) body.setLinearDamping(linearDamping);
		if (angularDamping !== undefined) body.setAngularDamping(angularDamping);
		body.setDominanceGroup(dominanceGroup);
		if (enabledRotations !== undefined) body.setEnabledRotations(...enabledRotations, true);
		if (enabledTranslations !== undefined) body.setEnabledTranslations(...enabledTranslations, true);
		if (lockRotations !== undefined) body.lockRotations(lockRotations, true);
		if (lockTranslations !== undefined) body.lockTranslations(lockTranslations, true);
		body.setAngvel({ x: angularVelocity[0], y: angularVelocity[1], z: angularVelocity[2] }, true);
		body.setLinvel({ x: linearVelocity[0], y: linearVelocity[1], z: linearVelocity[2] }, true);
		body.enableCcd(ccd);
		body.setSoftCcdPrediction(softCcdPrediction);
		if (userData !== undefined) body.userData = userData;
		if (bodyType !== body.bodyType()) body.setBodyType(bodyType, true);
	}

	private createRigidBodyState(
		rigidBody: RigidBody,
		object: Object3D,
		setMatrix?: (matrix: Matrix4) => void,
		getMatrix?: (matrix: Matrix4) => Matrix4,
		worldScale?: Vector3,
		meshType: NgtrRigidBodyState['meshType'] = 'mesh',
	) {
		object.updateWorldMatrix(true, false);
		const invertedWorldMatrix = object.parent!.matrixWorld.clone().invert();
		return {
			object,
			rigidBody,
			invertedWorldMatrix,
			setMatrix: setMatrix
				? setMatrix
				: (matrix: Matrix4) => {
						object.matrix.copy(matrix);
					},
			getMatrix: getMatrix ? getMatrix : (matrix: Matrix4) => matrix.copy(object.matrix),
			scale: worldScale || object.getWorldScale(_scale).clone(),
			isSleeping: false,
			meshType,
		};
	}
}
