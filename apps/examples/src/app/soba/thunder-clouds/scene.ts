import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { beforeRender, NgtVector3 } from 'angular-three';
import {
	NgtrAnyCollider,
	NgtrBallCollider,
	NgtrContactForcePayload,
	NgtrCuboidCollider,
	NgtrPhysics,
	NgtrRigidBody,
} from 'angular-three-rapier';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import {
	NgtsCameraShake,
	NgtsCloud,
	NgtsClouds,
	NgtsContactShadows,
	NgtsEnvironment,
} from 'angular-three-soba/staging';
import { CameraShake } from 'angular-three-soba/vanilla-exports';
import { random } from 'maath';
import * as THREE from 'three';

@Component({
	selector: 'app-puffy-cloud',
	template: `
		<ngt-object3D
			rigidBody
			[options]="{ colliders: false, linearDamping: 4, angularDamping: 1, friction: 0.1 }"
			[userData]="{ cloud: true }"
			[position]="position()"
			(contactForce)="onContactForce($event)"
		>
			<ngt-object3D [ballCollider]="[4]" />
			<ngts-cloud
				[options]="{
					seed: seed(),
					fade: 30,
					speed: 0.1,
					growth: 4,
					segments: 40,
					volume: 6,
					opacity: 0.6,
					bounds: [4, 3, 1],
				}"
			/>
			<ngts-cloud
				[options]="{
					seed: seed() + 1,
					fade: 30,
					position: [0, 1, 0],
					speed: 0.5,
					growth: 4,
					volume: 10,
					opacity: 1,
					bounds: [6, 2, 1],
				}"
			/>
			<ngt-point-light #light [position.z]="0.5" color="blue" />
		</ngt-object3D>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtrRigidBody, NgtrBallCollider, NgtsCloud],
})
export class PuffyCloud {
	seed = input.required<number>();
	position = input.required<NgtVector3>();
	cameraShake = input.required<CameraShake>();

	private lightRef = viewChild.required<ElementRef<THREE.PointLight>>('light');
	private rigidBody = viewChild.required(NgtrRigidBody);

	private vec = new THREE.Vector3();
	private flash = new random.FlashGen({ count: 10, minDuration: 40, maxDuration: 200 });

	constructor() {
		beforeRender(({ clock, delta }) => {
			const impulse = this.flash.update(clock.elapsedTime, delta);
			this.lightRef().nativeElement.intensity = impulse * 15000;
			if (impulse === 1) {
				this.cameraShake().intensity = 1;
			}

			const rigidBody = this.rigidBody().rigidBody();
			if (!rigidBody) return;

			rigidBody.applyImpulse(this.vec.copy(rigidBody.translation()).negate().multiplyScalar(10), true);
		});
	}

	protected onContactForce(payload: NgtrContactForcePayload) {
		if (payload.other.rigidBodyObject?.userData?.['cloud'] && payload.totalForceMagnitude / 1000 > 100) {
			this.flash.burst();
		}
	}
}

@Component({
	selector: 'app-pointer',
	template: `
		<ngt-object3D rigidBody="kinematicPosition" [options]="{ colliders: false }" [userData]="{ cloud: true }">
			<ngt-object3D [ballCollider]="[4]" />
		</ngt-object3D>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrAnyCollider, NgtrRigidBody, NgtrBallCollider],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Pointer {
	private rigidBodyRef = viewChild.required(NgtrRigidBody);

	private vec = new THREE.Vector3();
	private dir = new THREE.Vector3();

	constructor() {
		beforeRender(({ pointer, camera }) => {
			this.vec.set(pointer.x, pointer.y, 0.5).unproject(camera);
			this.dir.copy(this.vec).sub(camera.position).normalize();
			this.vec.add(this.dir.multiplyScalar(camera.position.length()));
			this.rigidBodyRef().rigidBody()?.setNextKinematicTranslation(this.vec);
		});
	}
}

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-ambient-light [intensity]="Math.PI / 2" />

		<ngts-perspective-camera
			[options]="{ makeDefault: true, position: [0, -4, 18], fov: 90 }"
			(updated)="$event.lookAt(0, 0, 0)"
		>
			<ngt-spot-light
				[position]="[0, 40, 2]"
				[angle]="0.5"
				[decay]="1"
				[distance]="45"
				[penumbra]="1"
				[intensity]="2000"
			/>
			<ngt-spot-light
				color="red"
				[position]="[-19, 0, -8]"
				[angle]="0.25"
				[decay]="0.75"
				[distance]="185"
				[penumbra]="-1"
				[intensity]="400"
			/>
		</ngts-perspective-camera>

		<ngts-camera-shake
			#shake="cameraShake"
			[options]="{
				decay: true,
				decayRate: 0.95,
				maxYaw: 0.05,
				maxPitch: 0.01,
				yawFrequency: 4,
				pitchFrequency: 2,
				rollFrequency: 2,
				intensity: 0.5,
			}"
		/>

		<ngts-clouds [options]="{ limit: 400 }">
			<ngtr-physics [options]="{ gravity: [0, 0, 0] }">
				<ng-template>
					@let cameraShake = shake.cameraShaker();
					<app-pointer />
					<app-puffy-cloud [seed]="10" [position]="[50, 0, 0]" [cameraShake]="cameraShake" />
					<app-puffy-cloud [seed]="20" [position]="[0, 50, 0]" [cameraShake]="cameraShake" />
					<app-puffy-cloud [seed]="30" [position]="[50, 0, 50]" [cameraShake]="cameraShake" />
					<app-puffy-cloud [seed]="40" [position]="[0, 0, -50]" [cameraShake]="cameraShake" />
					<ngt-object3D [cuboidCollider]="[400, 10, 400]" [position]="[0, -15, 0]" />
				</ng-template>
			</ngtr-physics>
		</ngts-clouds>

		<ngt-mesh [scale]="200">
			<ngt-sphere-geometry />
			<ngt-mesh-standard-material color="#999" [roughness]="0.7" [side]="BackSide" />
		</ngt-mesh>

		<ngts-contact-shadows
			[options]="{ opacity: 0.25, color: 'black', position: [0, -10, 0], scale: 50, blur: 2.5, far: 40 }"
		/>

		<ngts-orbit-controls
			[options]="{
				makeDefault: true,
				autoRotate: true,
				enableZoom: false,
				enablePan: false,
				minPolarAngle: Math.PI / 1.7,
				maxPolarAngle: Math.PI / 1.7,
			}"
		/>

		<ngts-environment
			[options]="{ files: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/blue_lagoon_night_1k.hdr' }"
		/>
	`,

	imports: [
		NgtsPerspectiveCamera,
		NgtsContactShadows,
		NgtsOrbitControls,
		NgtsEnvironment,
		NgtsCameraShake,
		NgtsClouds,
		NgtrPhysics,
		Pointer,
		PuffyCloud,
		NgtrCuboidCollider,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneGraph {
	protected readonly Math = Math;
	protected readonly BackSide = THREE.BackSide;
}
