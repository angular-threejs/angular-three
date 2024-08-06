import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, Signal } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtAnyRecord, NgtArgs } from 'angular-three';
import { NgtsGrid } from 'angular-three-soba/abstractions';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsAccumulativeShadows, NgtsCenter, NgtsEnvironment, NgtsRandomizedLights } from 'angular-three-soba/staging';
import { Mesh } from 'three';
import { GLTF } from 'three-stdlib';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

type SuzanneGLTF = GLTF & {
	nodes: { Suzanne: Mesh };
	materials: NgtAnyRecord;
};

@Component({
	selector: 'grid-suzi',
	standalone: true,
	template: `
		@if (gltf(); as gltf) {
			<ngt-mesh
				[geometry]="gltf.nodes.Suzanne.geometry"
				[castShadow]="true"
				[receiveShadow]="true"
				[rotation]="rotation()"
				[scale]="scale()"
			>
				<ngt-mesh-standard-material color="#9d4b4b" />
			</ngt-mesh>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Suzi {
	gltf = injectGLTF(
		() => 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/suzanne-high-poly/model.gltf',
	) as Signal<SuzanneGLTF | null>;

	rotation = input([0, 0, 0]);
	scale = input(1);
}

@Component({
	selector: 'grid-shadows',
	standalone: true,
	template: `
		<ngts-accumulative-shadows
			[options]="{ temporal: true, frames: 100, color: '#9d4b4b', colorBlend: 0.5, alphaTest: 0.75, scale: 20 }"
		>
			<ngts-randomized-lights [options]="{ amount: 8, radius: 4, position: [5, 5, -10] }" />
		</ngts-accumulative-shadows>
	`,
	imports: [NgtsAccumulativeShadows, NgtsRandomizedLights],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Shadows {}

@Component({
	standalone: true,
	template: `
		<ngt-group [position]="[0, -0.5, 0]">
			<ngts-center [options]="{ top: true }">
				<grid-suzi [rotation]="[-0.63, 0, 0]" [scale]="2" />
			</ngts-center>

			<ngts-center [options]="{ top: true, position: [-2, 0, 2] }">
				<ngt-mesh [castShadow]="true">
					<ngt-sphere-geometry *args="[0.5, 64, 64]" />
					<ngt-mesh-standard-material color="#9d4b4b" />
				</ngt-mesh>
			</ngts-center>

			<ngts-center [options]="{ top: true, position: [2.5, 0, 1] }">
				<ngt-mesh [castShadow]="true" [rotation]="[0, Math.PI / 4, 0]">
					<ngt-box-geometry *args="[0.7, 0.7, 0.7]" />
					<ngt-mesh-standard-material color="#9d4b4b" />
				</ngt-mesh>
			</ngts-center>

			<grid-shadows />

			<ngts-grid
				[options]="{
					planeArgs: [10.5, 10.5],
					position: [0, -0.01, 0],
					cellSize: 0.6,
					cellThickness: 1,
					cellColor: '#6f6f6f',
					sectionSize: 3.3,
					sectionThickness: 1.5,
					sectionColor: '#9d4b4b',
					fadeDistance: 25,
					fadeStrength: 1,
					followCamera: false,
					infiniteGrid: true,
				}"
			/>
		</ngt-group>
		<ngts-orbit-controls [options]="{ makeDefault: true }" />
		<ngts-environment [options]="{ preset: 'city' }" />
	`,
	imports: [Suzi, Shadows, NgtsOrbitControls, NgtsEnvironment, NgtsCenter, NgtArgs, NgtsGrid],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultGridStory {
	Math = Math;
}

export default {
	title: 'Abstractions/Grid',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryFunction(DefaultGridStory, {
	camera: { position: [10, 12, 12], fov: 25 },
	lights: false,
	controls: false,
	background: '#303035',
});
