import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { NgtArgs, NgtThreeElements, NgtVector3 } from 'angular-three';
import {
	NgtrBallCollider,
	NgtrCapsuleCollider,
	NgtrConeCollider,
	NgtrCuboidCollider,
	NgtrCylinderCollider,
	NgtrHeightfieldCollider,
	NgtrRigidBody,
	NgtrRoundConeCollider,
	NgtrRoundCuboidCollider,
	NgtrRoundCylinderCollider,
} from 'angular-three-rapier';
import { NgtsHTML } from 'angular-three-soba/misc';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';
import { ResetOrbitControls } from '../reset-orbit-controls';
import { suzanneResource } from '../suzanne';

@Component({
	selector: 'app-cute-box',
	template: `
		<ngt-mesh castShadow receiveShadow [parameters]="options()">
			<ngt-box-geometry />
			<ngt-mesh-physical-material color="orange" />
		</ngt-mesh>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CuteBox {
	options = input({} as Partial<NgtThreeElements['ngt-mesh']>);
}

@Component({
	selector: 'app-rigid-body-box',
	template: `
		<ngt-object3D rigidBody [position]="position()">
			<ngt-mesh castShadow receiveShadow>
				<ngt-box-geometry />
				<ngt-mesh-physical-material color="orange" />
			</ngt-mesh>
		</ngt-object3D>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtrRigidBody],
})
export class RigidBodyBox {
	position = input<NgtVector3>([0, 0, 0]);
}

@Component({
	selector: 'app-suzanne',
	template: `
		<ngt-primitive *args="[scene()]" [parameters]="{ castShadow: true, receiveShadow: true, visible: visible() }" />
	`,
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Suzanne {
	visible = input(true);

	private suzanne = suzanneResource();
	protected scene = computed(() => {
		const suzanne = this.suzanne.value();
		if (!suzanne) return null;
		return suzanne.nodes.Suzanne.clone();
	});
}

@Component({
	selector: 'app-all-colliders-rapier',
	template: `
		<ngt-group>
			<ngt-object3D rigidBody [options]="{ colliders: false }">
				<app-cute-box />
				<ngt-object3D [cuboidCollider]="[0.5, 0.5, 0.5]" />
				<ngts-html>
					<div htmlContent>CuboidCollider</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[2, 0, 0]" [options]="{ colliders: false }">
				<ngt-mesh [geometry]="roundBoxGeometry" castShadow receiveShadow>
					<ngt-mesh-physical-material color="orange" />
				</ngt-mesh>
				<ngt-object3D [roundCuboidCollider]="[0.5, 0.5, 0.5, 0.2]" />
				<ngts-html>
					<div htmlContent>RoundCuboidCollider</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[4, 0, 0]" [options]="{ colliders: false }">
				<ngt-mesh castShadow receiveShadow [scale]="0.5">
					<ngt-sphere-geometry />
					<ngt-mesh-physical-material color="orange" />
				</ngt-mesh>
				<ngt-object3D [ballCollider]="[0.5]" />
				<ngts-html>
					<div htmlContent>BallCollider</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[6, 0, 0]" [options]="{ colliders: false }">
				<ngt-mesh castShadow receiveShadow>
					<ngt-capsule-geometry *args="[0.5, 1, 4, 8]" />
					<ngt-mesh-physical-material color="orange" />
				</ngt-mesh>
				<ngt-object3D [capsuleCollider]="[0.5, 0.5]" />
				<ngts-html>
					<div htmlContent>CapsuleCollider</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[15, 0, 0]" [options]="{ colliders: false }">
				<ngt-mesh castShadow receiveShadow>
					<ngt-cylinder-geometry *args="[0.5, 0.5, 2]" />
					<ngt-mesh-physical-material color="orange" />
				</ngt-mesh>
				<ngt-object3D [cylinderCollider]="[1, 0.5]" />
				<ngts-html>
					<div htmlContent>CylinderCollider</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[8, 0, 0]" [options]="{ colliders: 'trimesh' }">
				<app-suzanne />
				<ngts-html>
					<div htmlContent>TrimeshCollider</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[11, 0, 0]" [options]="{ colliders: 'hull' }">
				<app-suzanne />
				<ngts-html>
					<div htmlContent>HullCollider</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[-5, 0, 0]" [options]="{ colliders: 'hull', includeInvisible: true }">
				<ngt-object3D>
					<app-suzanne [visible]="false" />
				</ngt-object3D>

				<ngts-html>
					<div htmlContent>Invisible Collider</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [options]="{ colliders: false }">
				<ngt-mesh castShadow receiveShadow>
					<ngt-cone-geometry *args="[0.5, 2]" />
					<ngt-mesh-physical-material color="orange" />
				</ngt-mesh>
				<ngt-object3D [coneCollider]="[1, 0.5]" />
				<ngts-html>
					<div htmlContent>ConeCollider</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[0, 3, 0]" [options]="{ colliders: false }">
				<ngt-mesh castShadow receiveShadow>
					<ngt-cone-geometry *args="[0.5, 2]" />
					<ngt-mesh-physical-material color="orange" />
				</ngt-mesh>
				<ngt-object3D [roundConeCollider]="[1, 0.5, 0.1]" />
				<ngts-html>
					<div htmlContent>RoundConeCollider</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[3, 3, 0]" [options]="{ colliders: false }">
				<ngt-mesh castShadow receiveShadow>
					<ngt-cylinder-geometry *args="[0.5, 0.5, 2]" />
					<ngt-mesh-physical-material color="orange" />
				</ngt-mesh>
				<ngt-object3D [roundCylinderCollider]="[1, 0.4, 0.1]" />
				<ngts-html>
					<div htmlContent>RoundCylinderCollider</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[0, -8, 0]" [options]="{ colliders: false }">
				<ngt-mesh castShadow receiveShadow [geometry]="heightFieldGeometry">
					<ngt-mesh-physical-material color="orange" [side]="DoubleSide" />
				</ngt-mesh>
				<ngt-object3D
					[heightfieldCollider]="[
						heightFieldWidth - 1,
						heightFieldHeight - 1,
						heightField,
						{ x: heightFieldWidth, y: 1, z: heightFieldHeight },
					]"
				/>
				<ngts-html>
					<div htmlContent>HeightfieldCollider</div>
				</ngts-html>
			</ngt-object3D>

			<app-rigid-body-box [position]="[4, 10, 2]" />
		</ngt-group>
	`,
	imports: [
		NgtrRigidBody,
		RigidBodyBox,
		CuteBox,
		Suzanne,
		NgtrCuboidCollider,
		NgtrRoundCuboidCollider,
		NgtrBallCollider,
		NgtrCapsuleCollider,
		NgtrCylinderCollider,
		NgtrConeCollider,
		NgtrRoundConeCollider,
		NgtrRoundCylinderCollider,
		NgtrHeightfieldCollider,
		NgtsHTML,
		NgtArgs,
	],
	hostDirectives: [ResetOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class AllCollidersExample {
	protected readonly DoubleSide = THREE.DoubleSide;

	protected heightFieldHeight = 10;
	protected heightFieldWidth = 10;
	protected heightField = Array.from({ length: this.heightFieldHeight * this.heightFieldWidth }, () => Math.random());
	protected heightFieldGeometry = new THREE.PlaneGeometry(
		this.heightFieldWidth,
		this.heightFieldHeight,
		this.heightFieldWidth - 1,
		this.heightFieldHeight - 1,
	);

	protected roundBoxGeometry = new RoundedBoxGeometry(1.4, 1.4, 1.4, 8, 0.2);

	constructor() {
		this.heightField.forEach((v, index) => {
			this.heightFieldGeometry.attributes['position'].array[index * 3 + 2] = v;
		});
		this.heightFieldGeometry.scale(1, -1, 1);
		this.heightFieldGeometry.rotateX(-Math.PI / 2);
		this.heightFieldGeometry.rotateY(-Math.PI / 2);
		this.heightFieldGeometry.computeVertexNormals();
	}
}
