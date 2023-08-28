import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, type Signal } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsGLTFLoader, type NgtsGLTF } from 'angular-three-soba/loaders';
import { NgtsAdaptiveDpr, NgtsAdaptiveEvents } from 'angular-three-soba/performances';
import { makeCanvasOptions, makeDecorators, makeStoryFunction } from '../setup-canvas';

type ArcherGLTF = NgtsGLTF<{
	materials: { material_0: THREE.Material };
	nodes: Record<'mesh_0' | 'mesh_1' | 'mesh_2', THREE.Mesh>;
}>;

@Component({
	selector: 'adaptive-archer',
	standalone: true,
	template: `
		<ngt-group [dispose]="null">
			<ngt-group [rotation]="[-Math.PI / 2, 0, 0]">
				<ngt-group [position]="[0, 0, 2]">
					<ng-container *ngIf="archerGltf() as archer">
						<ngt-mesh
							[castShadow]="true"
							[receiveShadow]="true"
							[material]="archer.materials.material_0"
							[geometry]="archer.nodes.mesh_0.geometry"
						/>

						<ngt-mesh
							[castShadow]="true"
							[receiveShadow]="true"
							[material]="archer.materials.material_0"
							[geometry]="archer.nodes.mesh_1.geometry"
						/>

						<ngt-mesh
							[castShadow]="true"
							[receiveShadow]="true"
							[material]="archer.materials.material_0"
							[geometry]="archer.nodes.mesh_2.geometry"
						/>
					</ng-container>
				</ngt-group>
			</ngt-group>
		</ngt-group>
	`,
	imports: [NgIf],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Archer {
	Math = Math;
	archerGltf = injectNgtsGLTFLoader(() => 'soba/archer.glb') as Signal<ArcherGLTF>;
}

@Component({
	standalone: true,
	template: `
		<adaptive-archer />
		<ngt-directional-light [intensity]="0.2 * Math.PI" [position]="[10, 10, 5]" [castShadow]="true">
			<ngt-vector2 *args="[64, 64]" attach="shadow.mapSize" />
			<ngt-value [rawValue]="-0.001" attach="shadow.bias" />
		</ngt-directional-light>

		<ngts-adaptive-dpr [pixelated]="true" />
		<ngts-adaptive-events />
		<ngts-orbit-controls [regress]="true" />
	`,
	imports: [Archer, NgtArgs, NgtsAdaptiveDpr, NgtsAdaptiveEvents, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultAdaptiveStory {
	Math = Math;
}

export default {
	title: 'Performance/Adaptive',
	decorators: makeDecorators(),
};

const canvasOptions = makeCanvasOptions({
	camera: { position: [0, 0, 30], fov: 50 },
	controls: false,
	lights: false,
	performance: { min: 0.2 },
});

export const Default = makeStoryFunction(DefaultAdaptiveStory, canvasOptions);
