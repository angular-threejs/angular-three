import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { gltfResource } from 'angular-three-soba/loaders';
import { suzanneResource } from '../suzanne';

import {
	NgtrBallCollider,
	NgtrConeCollider,
	NgtrConvexHullCollider,
	NgtrCuboidCollider,
	NgtrRigidBody,
	NgtrTrimeshCollider,
} from 'angular-three-rapier';
import { NgtsHTML } from 'angular-three-soba/misc';
import { ResetOrbitControls } from '../reset-orbit-controls';
import offsetTorusGLB from './offset-torus.glb' with { loader: 'file' };

gltfResource.preload(offsetTorusGLB);

@Component({
	selector: 'app-offset-torus',
	template: `
		@if (gltf.value(); as gltf) {
			<ngt-mesh
				castShadow
				[geometry]="gltf.meshes['Torus'].geometry"
				[material]="gltf.meshes['Torus'].material"
			/>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OffsetTorus {
	protected gltf = gltfResource(() => offsetTorusGLB);
}

@Component({
	selector: 'app-suzanne',
	template: `
		@if (gltf.value(); as gltf) {
			<ngt-mesh castShadow [geometry]="gltf.nodes.Suzanne.geometry" [material]="gltf.nodes.Suzanne.material" />
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Suzanne {
	protected gltf = suzanneResource();
}

@Component({
	selector: 'app-all-shapes-rapier-example',
	template: `
		<ngt-group>
			<ngt-object3D rigidBody [options]="{ colliders: 'cuboid' }">
				<app-suzanne />
				<ngts-html>
					<div htmlContent>Auto Cuboid</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[4, 0, 0]" [options]="{ colliders: 'ball' }">
				<app-suzanne />
				<ngts-html>
					<div htmlContent>Auto Ball</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[8, 0, 0]" [options]="{ colliders: 'hull' }">
				<app-suzanne />
				<ngts-html>
					<div htmlContent>Auto Hull</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[12, 0, 0]" [options]="{ colliders: 'trimesh' }">
				<app-suzanne />
				<ngts-html>
					<div htmlContent>Auto Trimesh</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[0, 4, 0]" [options]="{ colliders: false }">
				<app-suzanne />
				<ngt-object3D [cuboidCollider]="[1, 1, 1]" />
				<ngts-html>
					<div htmlContent>Custom Cuboid</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[4.1, 4, 0]" [options]="{ colliders: false }">
				<app-suzanne />
				<ngt-object3D [ballCollider]="[1]" />
				<ngts-html>
					<div htmlContent>Custom Ball</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[8, 4, 0]" [options]="{ colliders: false }">
				<app-suzanne />
				<ngt-object3D [coneCollider]="[1, 1]" />
				<ngts-html>
					<div htmlContent>Custom Cone</div>
				</ngts-html>
			</ngt-object3D>

			@if (gltf.value(); as gltf) {
				@let geometry = gltf.nodes.Suzanne.geometry;

				<ngt-object3D rigidBody [position]="[5, 8, 0]" [options]="{ colliders: false }">
					<app-suzanne />
					<ngt-object3D
						[trimeshCollider]="[geometry.attributes['position'].array, geometry.index?.array || []]"
						[options]="{ mass: 1 }"
					/>
					<ngts-html>
						<div htmlContent>Custom Trimesh</div>
					</ngts-html>
				</ngt-object3D>

				<ngt-object3D rigidBody [position]="[0, 8, 0]" [options]="{ colliders: false }">
					<app-suzanne />
					<ngt-object3D [convexHullCollider]="[geometry.attributes['position'].array]" />
					<ngts-html>
						<div htmlContent>Custom Convex Hull</div>
					</ngts-html>
				</ngt-object3D>
			}

			<ngt-object3D rigidBody [position]="[8, 8, 0]" [options]="{ colliders: false }">
				<app-suzanne />
				<ngt-object3D [cuboidCollider]="[0.5, 0.5, 0.5]" [position]="[1, 1, 1]" />
				<ngt-object3D [ballCollider]="[0.5]" [position]="[-1, -1, 1]" />
				<ngts-html>
					<div htmlContent>Custom Combound shape</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-object3D rigidBody [position]="[4, 10, 0]" [options]="{ colliders: 'ball' }">
				<app-suzanne />
				<ngt-object3D [cuboidCollider]="[0.5, 0.5, 0.5]" [position]="[1, 1, 1]" />
				<ngt-object3D [ballCollider]="[0.5]" [position]="[-1, -1, 1]" />
				<ngts-html>
					<div htmlContent>Auto and Custom Combound shape</div>
				</ngts-html>
			</ngt-object3D>

			<ngt-group [scale]="1.5" [position]="[5, 10, 0]">
				<ngt-object3D rigidBody [options]="{ colliders: 'ball' }">
					<ngt-group [position]="-2" [scale]="1.2">
						<app-offset-torus />
					</ngt-group>
					<ngts-html>
						<div htmlContent>Mesh with offset geometry</div>
					</ngts-html>
				</ngt-object3D>
			</ngt-group>
		</ngt-group>
	`,
	hostDirectives: [ResetOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		NgtrRigidBody,
		Suzanne,
		NgtsHTML,
		NgtrCuboidCollider,
		NgtrBallCollider,
		NgtrConeCollider,
		NgtrTrimeshCollider,
		NgtrConvexHullCollider,
		OffsetTorus,
	],
})
export default class AllShapesExample {
	protected gltf = suzanneResource();
}
