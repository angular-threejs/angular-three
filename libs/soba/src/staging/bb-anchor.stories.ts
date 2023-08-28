import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsHtml } from 'angular-three-soba/misc';
import { NgtsBBAnchor, type NgtsBBAnchorState } from 'angular-three-soba/staging';
import { NgtsSobaContent } from 'angular-three-soba/utils';
import { makeCanvasOptions, makeDecorators, makeStoryObject, number } from '../setup-canvas';

@Component({
	selector: 'bb-anchor-scene',
	standalone: true,
	template: `
		<ngts-orbit-controls [autoRotate]="true" />
		<ngt-mesh #mesh>
			<ngt-icosahedron-geometry />
			<ngt-mesh-basic-material color="hotpink" [wireframe]="true" />
			<ngts-bb-anchor [anchor]="anchor">
				<ng-content />
			</ngts-bb-anchor>
		</ngt-mesh>
		<ng-container *ngIf="drawBoundingBox">
			<ngt-box-helper *args="[mesh, 'cyan']" />
		</ng-container>
	`,
	imports: [NgtsOrbitControls, NgtsBBAnchor, NgIf, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class BBAnchorScene {
	@Input() anchor: NgtsBBAnchorState['anchor'] = [1, 1, 1];
	@Input() drawBoundingBox = true;
}

@Component({
	standalone: true,
	template: `
		<bb-anchor-scene [anchor]="[anchorX, anchorY, anchorZ]" [drawBoundingBox]="drawBoundingBox">
			<ngt-mesh [position]="-0.1">
				<ngt-sphere-geometry *args="[0.25]" />
				<ngt-mesh-basic-material color="lime" />
			</ngt-mesh>
		</bb-anchor-scene>
	`,
	imports: [NgtArgs, BBAnchorScene],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class MeshBBAnchorStory {
	@Input() anchorX = 1;
	@Input() anchorY = 1;
	@Input() anchorZ = 1;
	@Input() drawBoundingBox = true;
}

@Component({
	standalone: true,
	template: `
		<bb-anchor-scene [anchor]="[anchorX, anchorY, anchorZ]" [drawBoundingBox]="drawBoundingBox">
			<ngts-html [center]="true" [style]="{ color: 'white', whiteSpace: 'nowrap' }">
				<ng-container *ngtsSobaContent>Html element</ng-container>
			</ngts-html>
		</bb-anchor-scene>
	`,
	imports: [NgtsHtml, NgtsSobaContent, BBAnchorScene],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class HtmlBBAnchorStory {
	@Input() anchorX = 1;
	@Input() anchorY = 1;
	@Input() anchorZ = 1;
	@Input() drawBoundingBox = true;
}

export default {
	title: 'Staging/BBAnchor',
	decorators: makeDecorators(),
};

const canvasOptions = makeCanvasOptions({
	camera: { position: [2, 2, 2] },
	controls: false,
});

const argsOptions = {
	drawBoundingBox: true,
	anchorX: number(1, { range: true, min: -1, max: 1, step: 0.1 }),
	anchorY: number(1, { range: true, min: -1, max: 1, step: 0.1 }),
	anchorZ: number(1, { range: true, min: -1, max: 1, step: 0.1 }),
};

export const WithHTML = makeStoryObject(HtmlBBAnchorStory, { canvasOptions, argsOptions });
export const WithMesh = makeStoryObject(MeshBBAnchorStory, { canvasOptions, argsOptions });
