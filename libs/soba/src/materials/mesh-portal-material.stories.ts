import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { beforeRender, NgtArgs } from 'angular-three';
import { NgtsCameraControls } from 'angular-three-soba/controls';
import { gltfResource } from 'angular-three-soba/loaders';
import { NgtsMeshPortalMaterial } from 'angular-three-soba/materials';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import { BufferGeometry, ColorRepresentation, Mesh, MeshStandardMaterial } from 'three';
import { GLTF } from 'three-stdlib';
import { storyDecorators, storyFunction } from '../setup-canvas';

type AOBoxGLTF = GLTF & {
	nodes: { Cube: Mesh<BufferGeometry, MeshStandardMaterial> };
};

@Component({
	selector: 'portal-material-side',
	template: `
		<ngts-mesh-portal-material [attach]="attach()">
			<ng-template>
				<!-- Everything in here is inside the portal and isolated from the canvas -->
				<ngt-ambient-light [intensity]="0.5 * Math.PI" />
				<ngts-environment [options]="{ preset: 'city' }" />

				<!-- A box with baked AO -->
				@if (gltf.value(); as gltf) {
					<ngt-mesh castShadow receiveShadow [rotation]="rotation()" [geometry]="gltf.nodes.Cube.geometry">
						<ngt-mesh-standard-material
							[aoMapIntensity]="1"
							[aoMap]="gltf.nodes.Cube.material.aoMap"
							[color]="bg()"
						/>
						<ngt-spot-light
							castShadow
							[color]="bg()"
							[intensity]="2 * Math.PI"
							[position]="[10, 10, 10]"
							[angle]="0.15"
							[penumbra]="1"
							[decay]="0"
						>
							<ngt-value [rawValue]="0.05" attach="shadow.normalBias" />
							<ngt-value [rawValue]="0.0001" attach="shadow.bias" />
						</ngt-spot-light>
					</ngt-mesh>
				}

				<!-- The shape -->
				<ngt-mesh #shape castShadow receiveShadow>
					<ng-content />
					<ngt-mesh-standard-material [color]="bg()" />
				</ngt-mesh>
			</ng-template>
		</ngts-mesh-portal-material>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsMeshPortalMaterial, NgtsEnvironment],
})
class Side {
	protected readonly Math = Math;

	rotation = input([0, 0, 0]);
	bg = input.required<ColorRepresentation>();
	index = input.required<number>();
	attach = computed(() => ['material', this.index()]);

	gltf = gltfResource<AOBoxGLTF>(() => './aobox-transformed.glb');
	shapeRef = viewChild<ElementRef<Mesh>>('shape');

	constructor() {
		beforeRender(({ delta }) => {
			const shape = this.shapeRef()?.nativeElement;
			if (!shape) return;
			shape.rotation.x = shape.rotation.y += delta;
		});
	}
}

@Component({
	template: `
		<ngt-mesh castShadow receiveShadow>
			<ngt-box-geometry *args="[2, 2, 2]" />

			<portal-material-side [rotation]="[0, 0, 0]" bg="orange" [index]="0">
				<ngt-torus-geometry *args="[0.65, 0.3, 64]" />
			</portal-material-side>

			<portal-material-side [rotation]="[0, Math.PI, 0]" bg="lightblue" [index]="1">
				<ngt-torus-knot-geometry *args="[0.55, 0.2, 128, 32]" />
			</portal-material-side>

			<portal-material-side [rotation]="[0, Math.PI / 2, Math.PI / 2]" bg="lightgreen" [index]="2">
				<ngt-box-geometry *args="[1.15, 1.15, 1.15]" />
			</portal-material-side>

			<portal-material-side [rotation]="[0, Math.PI / 2, -Math.PI / 2]" bg="aquamarine" [index]="3">
				<ngt-octahedron-geometry />
			</portal-material-side>

			<portal-material-side [rotation]="[0, -Math.PI / 2, 0]" bg="indianred" [index]="4">
				<ngt-icosahedron-geometry />
			</portal-material-side>

			<portal-material-side [rotation]="[0, Math.PI / 2, 0]" bg="hotpink" [index]="5">
				<ngt-dodecahedron-geometry />
			</portal-material-side>
		</ngt-mesh>
		<ngts-camera-controls [options]="{ makeDefault: true }" />
	`,

	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, Side, NgtsCameraControls],
})
class DefaultMeshPortalMaterialStory {
	protected readonly Math = Math;
}

export default {
	title: 'Materials/MeshPortalMaterial',
	decorators: storyDecorators(),
} as Meta;

export const Default = storyFunction(DefaultMeshPortalMaterialStory, {
	camera: { position: [-3, 0.5, 3] },
});
