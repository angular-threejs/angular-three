import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, viewChild } from '@angular/core';
import { extend, injectBeforeRender, NgtAfterAttach, NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import * as THREE from 'three/webgpu';

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-color *args="['#c1c1c1']" attach="background" />

		<ngt-group #group static>
			@for (obj of objects; track $index) {
				<ngt-mesh
					[geometry]="obj.geometry"
					[frustumCulled]="false"
					[userData]="obj.userData"
					(attached)="onAttached($event)"
				>
					<ngt-mesh-toon-material [color]="obj.color" [side]="DoubleSide" />
				</ngt-mesh>
			}
		</ngt-group>

		<ngt-directional-light [intensity]="Math.PI" />

		<ngts-orbit-controls [options]="{ autoRotate: true, enableZoom: false, autoRotateSpeed: 1 }" />
	`,
	imports: [NgtArgs, NgtsOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SceneGraph {
	protected readonly Math = Math;
	protected readonly DoubleSide = THREE.DoubleSide;

	protected readonly geometries = [
		new THREE.ConeGeometry(1.0, 2.0, 3, 1),
		new THREE.BoxGeometry(2.0, 2.0, 2.0),
		new THREE.PlaneGeometry(2.0, 2, 1, 1),
		new THREE.CapsuleGeometry(),
		new THREE.CircleGeometry(1.0, 3),
		new THREE.CylinderGeometry(1.0, 1.0, 2.0, 3, 1),
		new THREE.DodecahedronGeometry(1.0, 0),
		new THREE.IcosahedronGeometry(1.0, 0),
		new THREE.OctahedronGeometry(1.0, 0),
		new THREE.PolyhedronGeometry([0, 0, 0], [0, 0, 0], 1, 0),
		new THREE.RingGeometry(1.0, 1.5, 3),
		new THREE.SphereGeometry(1.0, 3, 2),
		new THREE.TetrahedronGeometry(1.0, 0),
		new THREE.TorusGeometry(1.0, 0.5, 3, 3),
		new THREE.TorusKnotGeometry(1.0, 0.5, 20, 3, 1, 1),
	];

	protected readonly objects = Array.from({ length: 3000 }, (_, i) => {
		const color = Math.random() * 0xffffff;
		const geometry = this.geometries[i % this.geometries.length];
		const rotationSpeed = this.randomizeRotationSpeed(new THREE.Euler());

		return {
			color,
			geometry,
			userData: { rotationSpeed },
		};
	});

	private groupRef = viewChild.required<ElementRef<THREE.Group>>('group');

	private position = new THREE.Vector3();
	private rotation = new THREE.Euler();
	private quaternion = new THREE.Quaternion();
	private scale = new THREE.Vector3();

	constructor() {
		extend(THREE);

		injectBeforeRender(() => {
			const group = this.groupRef().nativeElement;
			for (const child of group.children) {
				const { rotationSpeed } = child.userData;
				child.rotation.set(
					child.rotation.x + rotationSpeed.x,
					child.rotation.y + rotationSpeed.y,
					child.rotation.z + rotationSpeed.z,
				);
			}
		});
	}

	protected onAttached(event: NgtAfterAttach<THREE.Mesh>) {
		this.randomizeMatrix(event.node.matrix);
		event.node.matrix.decompose(event.node.position, event.node.quaternion, event.node.scale);
	}

	private randomizeMatrix(matrix: THREE.Matrix4) {
		this.position.x = Math.random() * 80 - 40;
		this.position.y = Math.random() * 80 - 40;
		this.position.z = Math.random() * 80 - 40;
		this.rotation.x = Math.random() * 2 * Math.PI;
		this.rotation.y = Math.random() * 2 * Math.PI;
		this.rotation.z = Math.random() * 2 * Math.PI;
		this.quaternion.setFromEuler(this.rotation);
		const factorScale = 1;
		this.scale.x = this.scale.y = this.scale.z = 0.35 * factorScale + Math.random() * 0.5 * factorScale;
		return matrix.compose(this.position, this.quaternion, this.scale);
	}

	private randomizeRotationSpeed(rotation: THREE.Euler) {
		rotation.x = Math.random() * 0.05;
		rotation.y = Math.random() * 0.05;
		rotation.z = Math.random() * 0.05;
		return rotation;
	}
}
