import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	inject,
	signal,
	viewChild,
} from '@angular/core';
import { RigidBody } from '@dimforge/rapier3d-compat';
import { injectStore, NgtArgs } from 'angular-three';
import {
	beforePhysicsStep,
	filterContactPair,
	NgtrCuboidCollider,
	NgtrPhysics,
	NgtrRigidBody,
} from 'angular-three-rapier';
import * as THREE from 'three';
import { ResetOrbitControls } from '../reset-orbit-controls';

@Component({
	selector: 'app-one-way-platform',
	template: `
		<ngt-group>
			<!-- Ball -->
			<ngt-object3D
				#ballRigidBody="rigidBody"
				rigidBody
				[options]="{ colliders: 'ball' }"
				[position]="[0, -5, 0]"
			>
				<ngt-mesh castShadow receiveShadow>
					<ngt-sphere-geometry />
					<ngt-mesh-physical-material color="red" />
				</ngt-mesh>
			</ngt-object3D>

			<!-- Platform visual -->
			<ngt-mesh>
				<ngt-box-geometry *args="[10, 0.1, 10]" />
				<ngt-mesh-standard-material
					[color]="filteringEnabled() ? 'orange' : 'grey'"
					[opacity]="0.5"
					[transparent]="true"
				/>
			</ngt-mesh>

			<!-- Platform collider -->
			<ngt-object3D #platformRigidBody="rigidBody" rigidBody="fixed">
				<ngt-object3D [cuboidCollider]="[10, 0.1, 10]" />
			</ngt-object3D>
		</ngt-group>
	`,
	imports: [NgtrRigidBody, NgtrCuboidCollider, NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	hostDirectives: [ResetOrbitControls],
	host: { '(document:click)': 'onDocumentClick()' },
})
export default class OneWayPlatform {
	filteringEnabled = signal(true);

	private ballRigidBodyRef = viewChild.required<NgtrRigidBody>('ballRigidBody');
	private platformRigidBodyRef = viewChild.required<NgtrRigidBody>('platformRigidBody');
	private platformColliderRef = viewChild.required(NgtrCuboidCollider);

	private physics = inject(NgtrPhysics);
	private store = injectStore();

	// Cache for storing body states before physics step
	private bodyStateCache = new Map<number, { position: THREE.Vector3; velocity: THREE.Vector3 }>();

	constructor() {
		// Setup camera
		effect(() => {
			const camera = this.store.camera();
			camera.position.set(0, 10, 20);
			camera.lookAt(0, 0, 0);
			camera.updateProjectionMatrix();
		});

		// Update collider activeHooks based on filteringEnabled
		effect(() => {
			const rapier = this.physics.rapier();
			if (!rapier) return;

			const collider = this.platformColliderRef().collider();
			if (!collider) return;

			collider.setActiveHooks(this.filteringEnabled() ? rapier.ActiveHooks.FILTER_CONTACT_PAIRS : 0);
		});

		// Cache body states BEFORE the physics step
		beforePhysicsStep(() => {
			const platformRigidBody = this.platformRigidBodyRef().rigidBody();
			const ballRigidBody = this.ballRigidBodyRef().rigidBody();

			if (!platformRigidBody || !ballRigidBody) return;

			this.cacheBodyState(platformRigidBody);
			this.cacheBodyState(ballRigidBody);
		});

		// Filter contact pairs for one-way platform behavior
		filterContactPair((_c1, _c2, b1, b2) => {
			const rapier = this.physics.rapier();
			if (!rapier) return null;

			// If filtering is disabled, let default collision behavior happen
			if (!this.filteringEnabled()) return null;

			const state1 = this.bodyStateCache.get(b1);
			const state2 = this.bodyStateCache.get(b2);

			if (!state1 || !state2) return null;

			const platformHandle = this.platformRigidBodyRef().rigidBody()?.handle;
			const ballHandle = this.ballRigidBodyRef().rigidBody()?.handle;

			// Determine which is platform and which is ball
			let platformState: { position: THREE.Vector3; velocity: THREE.Vector3 } | undefined;
			let ballState: { position: THREE.Vector3; velocity: THREE.Vector3 } | undefined;

			if (platformHandle === b1 && ballHandle === b2) {
				platformState = state1;
				ballState = state2;
			} else if (platformHandle === b2 && ballHandle === b1) {
				platformState = state2;
				ballState = state1;
			} else {
				return null; // Not our platform/ball pair
			}

			// Allow collision only if the ball is moving downwards and above the platform
			if (ballState.velocity.y < 0 && ballState.position.y > platformState.position.y) {
				return rapier.SolverFlags.COMPUTE_IMPULSE; // Process the collision
			}

			return rapier.SolverFlags.EMPTY; // Ignore the collision (pass through)
		});
	}

	protected onDocumentClick() {
		const ballRigidBody = this.ballRigidBodyRef().rigidBody();
		if (!ballRigidBody) return;
		ballRigidBody.applyImpulse(new THREE.Vector3(0, 50, 0), true);
	}

	private cacheBodyState(rigidBody: RigidBody) {
		const handle = rigidBody.handle;
		const pos = rigidBody.translation();
		const vel = rigidBody.linvel();

		let state = this.bodyStateCache.get(handle);
		if (!state) {
			state = {
				position: new THREE.Vector3(),
				velocity: new THREE.Vector3(),
			};
			this.bodyStateCache.set(handle, state);
		}

		state.position.set(pos.x, pos.y, pos.z);
		state.velocity.set(vel.x, vel.y, vel.z);
	}
}
