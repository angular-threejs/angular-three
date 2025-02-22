import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectBeforeRender, NgtArgs, NgtThreeElements } from 'angular-three';
import { injectHelper } from 'angular-three-soba/abstractions';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsBVH } from 'angular-three-soba/performances';
import * as THREE from 'three';
import { MeshBVHHelper } from 'three-mesh-bvh';
import { storyDecorators, storyFunction } from '../setup-canvas';

@Component({
	selector: 'torus-bvh',
	template: `
		<ngts-bvh>
			<ngt-mesh
				#mesh
				[position.z]="positionZ()"
				(pointerover)="color.set('#ffff00')"
				(pointerout)="color.set('#ff0000')"
			>
				<ngt-torus-knot-geometry *args="[1, 0.4, 250, 50]" />
				<ngt-mesh-basic-material [color]="color()" />
			</ngt-mesh>
		</ngts-bvh>
	`,
	imports: [NgtsBVH, NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class TorusBVH {
	positionZ = input(0);

	private meshRef = viewChild.required<ElementRef<THREE.Mesh>>('mesh');

	protected color = signal('#ff0000');

	constructor() {
		injectHelper(this.meshRef, () => MeshBVHHelper);
	}
}

const pointDist = 5;
const raycaster = new THREE.Raycaster();
const origVec = new THREE.Vector3();
const dirVec = new THREE.Vector3();

@Component({
	selector: 'raycast-obj',
	template: `
		<ngt-group #obj>
			<ngt-mesh #original>
				<ngt-sphere-geometry *args="[0.1, 20, 20]" />
				<ngt-mesh-basic-material />
			</ngt-mesh>
			<ngt-mesh #hit>
				<ngt-sphere-geometry *args="[0.1, 20, 20]" />
				<ngt-mesh-basic-material />
			</ngt-mesh>
			<ngt-mesh #cylinder>
				<ngt-cylinder-geometry *args="[0.01, 0.01]" />
				<ngt-mesh-basic-material transparent [opacity]="0.25" />
			</ngt-mesh>
		</ngt-group>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class RaycastObj {
	group = input.required<NgtThreeElements['ngt-group']>();

	private objRef = viewChild.required<ElementRef<THREE.Group>>('obj');
	private originalRef = viewChild.required<ElementRef<THREE.Mesh>>('original');
	private hitRef = viewChild.required<ElementRef<THREE.Mesh>>('hit');
	private cylinderRef = viewChild.required<ElementRef<THREE.Mesh>>('cylinder');

	constructor() {
		effect(() => {
			const [obj, originalMesh, hitMesh] = [
				this.objRef().nativeElement,
				this.originalRef().nativeElement,
				this.hitRef().nativeElement,
				this.cylinderRef().nativeElement,
			];
			hitMesh.scale.multiplyScalar(0.5);
			originalMesh.position.set(pointDist, 0, 0);
			obj.rotation.x = Math.random() * 10;
			obj.rotation.y = Math.random() * 10;
		});

		const xDir = Math.random() - 0.5;
		const yDir = Math.random() - 0.5;

		injectBeforeRender(({ delta }) => {
			const [obj, originalMesh, hitMesh, cylinderMesh, group] = [
				this.objRef().nativeElement,
				this.originalRef().nativeElement,
				this.hitRef().nativeElement,
				this.cylinderRef().nativeElement,
				this.group(),
			];

			obj.rotation.x += xDir * delta;
			obj.rotation.y += yDir * delta;

			originalMesh.updateMatrixWorld();
			origVec.setFromMatrixPosition(originalMesh.matrixWorld);
			dirVec.copy(origVec).multiplyScalar(-1).normalize();

			raycaster.set(origVec, dirVec);
			raycaster.firstHitOnly = true;
			const res = raycaster.intersectObject(group as THREE.Group, true);
			const length = res.length ? res[0].distance : pointDist;

			hitMesh.position.set(pointDist - length, 0, 0);
			cylinderMesh.position.set(pointDist - length / 2, 0, 0);
			cylinderMesh.scale.set(1, length, 1);
			cylinderMesh.rotation.z = Math.PI / 2;
		});
	}
}

@Component({
	selector: 'debug-raycast',
	template: `
		@for (i of amount; track $index) {
			<raycast-obj [group]="group()" />
		}
	`,
	imports: [RaycastObj],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DebugRaycast {
	group = input.required<NgtThreeElements['ngt-group']>();
	protected amount = Array.from({ length: 80 }, (_, index) => index);
}

@Component({
	template: `
		<ngt-group #group>
			<torus-bvh [positionZ]="-2" />
			<torus-bvh [positionZ]="0" />
			<torus-bvh [positionZ]="2" />
		</ngt-group>

		<debug-raycast [group]="group" />
		<ngts-orbit-controls [options]="{ enablePan: false, zoomSpeed: 0.5 }" />
	`,
	imports: [TorusBVH, DebugRaycast, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'default-bvh-story' },
})
class DefaultBVHStory {}

export default {
	title: 'Performances/BVH',
	decorators: storyDecorators(),
} as Meta;

export const Default = storyFunction(DefaultBVHStory, {
	controls: false,
});
