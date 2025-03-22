import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { gltfResource } from 'angular-three-soba/loaders';
import { NgtsAdaptiveDpr, NgtsAdaptiveEvents } from 'angular-three-soba/performances';
import { Material, Mesh } from 'three';
import { GLTF } from 'three-stdlib';
import { storyDecorators, storyObject } from '../setup-canvas';

interface ArcherGLTF extends GLTF {
	materials: { material_0: Material };
	nodes: Record<'mesh_0' | 'mesh_1' | 'mesh_2', Mesh>;
}

@Component({
	selector: 'adaptive-archer',
	template: `
		@if (gltf.value(); as gltf) {
			<ngt-group [dispose]="null">
				<ngt-group [rotation]="[-Math.PI / 2, 0, 0]">
					<ngt-group [position]="[0, 0, 2]">
						<ngt-mesh
							castShadow
							receiveShadow
							[material]="gltf.materials.material_0"
							[geometry]="gltf.nodes.mesh_0.geometry"
						/>
						<ngt-mesh
							castShadow
							receiveShadow
							[geometry]="gltf.nodes.mesh_1.geometry"
							[material]="gltf.materials.material_0"
						/>
						<ngt-mesh
							castShadow
							receiveShadow
							[material]="gltf.materials.material_0"
							[geometry]="gltf.nodes.mesh_2.geometry"
						/>
					</ngt-group>
				</ngt-group>
			</ngt-group>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Archer {
	protected readonly Math = Math;

	gltf = gltfResource<ArcherGLTF>(() => './archer.glb');
}

@Component({
	template: `
		<adaptive-archer />
		<ngt-directional-light [intensity]="0.2 * Math.PI" [position]="[10, 10, 5]" castShadow>
			<ngt-vector2 *args="[64, 64]" attach="shadow.mapSize" />
			<ngt-value [rawValue]="-0.001" attach="shadow.bias" />
		</ngt-directional-light>
		<ngts-adaptive-dpr [pixelated]="pixelated()" />
		<ngts-adaptive-events />
		<ngts-orbit-controls [options]="{ regress: true }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [Archer, NgtArgs, NgtsAdaptiveDpr, NgtsAdaptiveEvents, NgtsOrbitControls],
})
class DefaultAdaptiveStory {
	protected readonly Math = Math;
	pixelated = input(true);
}

export default {
	title: 'Performances/Adaptive',
	decorators: storyDecorators(),
} as Meta;

export const Default = storyObject(DefaultAdaptiveStory, {
	camera: { position: [0, 0, 30], fov: 50 },
	lights: false,
	controls: false,
	performance: { min: 0.2 },
	argsOptions: {
		pixelated: true,
	},
});
