import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsBBAnchor, NgtsBBAnchorOptions } from 'angular-three-soba/staging';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

@Component({
	selector: 'bb-anchor-mesh-object',
	standalone: true,
	template: `
		<ngt-mesh>
			<ngt-sphere-geometry *args="[0.25]" />
			<ngt-mesh-basic-material color="lime" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class MeshObject {}

@Component({
	selector: 'bb-anchor-wrapper',
	standalone: true,
	template: `
		<ngts-orbit-controls [options]="{ autoRotate: true }" />
		<ngt-mesh #mesh>
			<ngt-icosahedron-geometry />
			<ngt-mesh-basic-material color="hotpink" [wireframe]="true" />
			<ngts-bb-anchor [options]="options()">
				<ng-content />
			</ngts-bb-anchor>
		</ngt-mesh>

		@if (drawBoundingBox()) {
			<ngt-box-helper *args="[mesh, 'cyan']" />
		}
	`,
	imports: [NgtsBBAnchor, NgtsOrbitControls, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class BBAnchorWrapper {
	options = input.required<NgtsBBAnchorOptions>();
	drawBoundingBox = input(false);
}

@Component({
	standalone: true,
	template: `
		<bb-anchor-wrapper [options]="options()" [drawBoundingBox]="drawBoundingBox()">
			<bb-anchor-mesh-object />
		</bb-anchor-wrapper>
	`,
	imports: [BBAnchorWrapper, MeshObject],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class WithMeshBBAnchorStory {
	options = input<NgtsBBAnchorOptions>({ anchor: [1, 1, 1] });
	drawBoundingBox = input(false);
}

export default {
	title: 'Staging/BB Anchor',
	decorators: makeDecorators(),
} as Meta;

export const WithMesh = makeStoryObject(WithMeshBBAnchorStory, {
	canvasOptions: { camera: { position: [2, 2, 2] }, controls: false },
	argsOptions: {
		drawBoundingBox: true,
		options: {
			anchor: [1, 1, 1],
		},
	},
});
