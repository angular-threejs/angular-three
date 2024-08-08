import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsHelper } from 'angular-three-soba/abstractions';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsHTML, NgtsHTMLContent } from 'angular-three-soba/misc';
import { NgtsBBAnchor, NgtsBBAnchorOptions } from 'angular-three-soba/staging';
import { BoxHelper } from 'three';
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

			@if (drawBoundingBox()) {
				<ngts-helper [type]="BoxHelper" [options]="['cyan']" />
			}
		</ngt-mesh>
	`,
	imports: [NgtsBBAnchor, NgtsOrbitControls, NgtArgs, NgtsHelper],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class BBAnchorWrapper {
	protected readonly BoxHelper = BoxHelper;
	options = input.required<NgtsBBAnchorOptions>();
	drawBoundingBox = input(false);
}

@Component({
	standalone: true,
	template: `
		<bb-anchor-wrapper [options]="options()" [drawBoundingBox]="drawBoundingBox()">
			<ngts-html>
				<div [ngtsHTMLContent]="{ center: true, containerStyle: { color: 'white', whiteSpace: 'nowrap' } }">
					HTML content
				</div>
			</ngts-html>
		</bb-anchor-wrapper>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [BBAnchorWrapper, NgtsHTML, NgtsHTMLContent],
})
class WithHTMLBBAnchorStory {
	options = input<NgtsBBAnchorOptions>({ anchor: [1, 1, 1] });
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

export const WithHTML = makeStoryObject(WithHTMLBBAnchorStory, {
	canvasOptions: { camera: { position: [2, 2, 2] }, controls: false },
	argsOptions: {
		drawBoundingBox: true,
		options: {
			anchor: [1, 1, 1],
		},
	},
});
