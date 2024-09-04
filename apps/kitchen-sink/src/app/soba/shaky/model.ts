import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, Signal } from '@angular/core';
import { NgtArgs, NgtVector3 } from 'angular-three';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsMeshReflectorMaterial } from 'angular-three-soba/materials';
import { Color, MeshPhysicalMaterial } from 'three';

injectGLTF.preload(() => './pink-d.glb');

@Component({
	selector: 'app-model',
	standalone: true,
	template: `
		<ngt-group [position]="position()" [rotation]="rotation()">
			<ngt-mesh
				[receiveShadow]="true"
				[position]="[0, 0, 8]"
				[scale]="[2, 2, 1]"
				[rotation]="[-Math.PI / 2, 0, Math.PI]"
			>
				<ngt-plane-geometry *args="[70, 70]" />
				<ngts-mesh-reflector-material
					[options]="{
						resolution: 1024,
						mirror: 0,
						mixBlur: 1,
						mixStrength: 0.3,
						depthScale: 1,
						minDepthThreshold: 0.8,
						maxDepthThreshold: 1,
						metalness: 0.25,
						color: '#eea6b1',
						roughness: 1,
					}"
				/>
			</ngt-mesh>
			@if (gltf(); as gltf) {
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Sphere.geometry"
					[position]="[-1.93, 1, -0.94]"
					[rotation]="[-Math.PI, 0.73, -Math.PI]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Sphere001.geometry"
					[position]="[4.49, 2.34, 3.58]"
					[scale]="[2.33, 2.33, 2.33]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Sphere001.geometry"
					[position]="[-16, 5, 17]"
					[rotation]="[-0.26, 0.04, -0.16]"
					[scale]="[5, 5, 5]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Sphere002.geometry"
					[position]="[-5.28, 4.8, 5.12]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Sphere003.geometry"
					[position]="[-10.13, 1.3, -3.95]"
					[rotation]="[-0.15, 0.01, -0.02]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Sphere004.geometry"
					[position]="[-19.36, 1.05, -2.05]"
					[rotation]="[0, 0, 0.64]"
					[scale]="[-1.33, -1.33, -1.33]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Sphere005.geometry"
					[position]="[-18.17, 0.94, -2.35]"
					[scale]="[0.87, 0.87, 0.87]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Torus.geometry"
					[position]="[-0.36, 1.46, 0.73]"
					[rotation]="[Math.PI, 0.73, -2.64]"
					[scale]="[2, 2, 2]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Cone.geometry"
					[position]="[2.3, 1.91, -4.41]"
					[scale]="[1.86, 1.86, 1.86]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Cone001.geometry"
					[position]="[-4.82, 0.47, -5.51]"
					[rotation]="[2.14, 0, -0.58]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Cube.geometry"
					[position]="[-5.36, 1.94, 5.46]"
					[rotation]="[0, 0.42, 0]"
					[scale]="[1.9, 1.9, 1.9]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Cube001.geometry"
					[position]="[-1.8, 1, -10.04]"
					[rotation]="[0, -0.23, 0]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Cylinder.geometry"
					[position]="[-12.3, 2.41, 1.53]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Cylinder001.geometry"
					[position]="[-10.47, 1.57, -8.75]"
					[rotation]="[Math.PI / 2, 0, -1.87]"
					[scale]="[1.55, 1.55, 1.55]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Cylinder002.geometry"
					[position]="[-1.15, 3.38, 14.39]"
					[rotation]="[0, Math.PI, 0]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Icosphere.geometry"
					[position]="[7.29, 0.6, -5.63]"
					[scale]="[0.64, 0.64, 0.64]"
				/>
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[material]="material"
					[geometry]="gltf.nodes.Icosphere001.geometry"
					[position]="[7.26, 0.98, 12.9]"
					[rotation]="[-0.26, 0.04, -0.16]"
				/>
			}
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtsMeshReflectorMaterial],
})
export class Model {
	protected Math = Math;

	position = input<NgtVector3>([0, 0, 0]);
	rotation = input<NgtVector3>([0, 0, 0]);

	protected gltf = injectGLTF(() => './pink-d.glb') as Signal<any | null>;
	protected material = new MeshPhysicalMaterial({
		color: new Color('#bb86a1').convertSRGBToLinear(),
		roughness: 0,
		clearcoat: 1,
		clearcoatRoughness: 0,
	});
}
