import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import { NgtArgs, injectNgtRef } from 'angular-three';
import { NgtsHtml } from 'angular-three-soba/misc';
import { NgtsSobaContent } from 'angular-three-soba/utils';
import { Mesh } from 'three';
import { makeDecorators, makeStoryFunction, makeStoryObject, turn } from '../setup-canvas';

@Component({
	selector: 'html-content',
	standalone: true,
	template: `<h4>{{ text }}</h4>`,
})
class HtmlContent {
	@Input({ required: true }) text!: string;
}

@Component({
	selector: 'default-html-story',
	standalone: true,
	template: `
		<ngt-group (beforeRender)="turn($event.object)">
			<ngt-mesh [position]="[3, 6, 4]">
				<ngt-icosahedron-geometry *args="[2, 2]" />
				<ngt-mesh-basic-material [color]="color" [wireframe]="true" />
				<ngts-html [distanceFactor]="distanceFactor" [renderedDivClass]="className" [transform]="transform">
					<div *ngtsSobaContent><html-content text="First" /></div>
				</ngts-html>
			</ngt-mesh>

			<ngt-mesh [position]="[10, 0, 10]">
				<ngt-icosahedron-geometry *args="[2, 2]" />
				<ngt-mesh-basic-material [color]="color" [wireframe]="true" />
				<ngts-html [distanceFactor]="distanceFactor" [renderedDivClass]="className" [transform]="transform">
					<div *ngtsSobaContent><html-content text="Second" /></div>
				</ngts-html>
			</ngt-mesh>

			<ngt-mesh [position]="[-20, 0, -20]">
				<ngt-icosahedron-geometry *args="[2, 2]" />
				<ngt-mesh-basic-material [color]="color" [wireframe]="true" />
				<ngts-html [distanceFactor]="distanceFactor" [renderedDivClass]="className" [transform]="transform">
					<div *ngtsSobaContent><html-content text="Third" /></div>
				</ngts-html>
			</ngt-mesh>

			<ng-content />
		</ngt-group>
	`,
	// NOTE: I think createComponent might work better than createEmbeddedView
	imports: [NgtsHtml, NgtsSobaContent, NgtArgs, HtmlContent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultHtmlStory {
	@Input() color = 'hotpink';
	@Input() distanceFactor = 30;
	@Input() className = 'html-story-block';
	@Input() transform = false;

	turn = turn;
}

@Component({
	standalone: true,
	template: `
		<default-html-story
			color="palegreen"
			className="html-story-block margin300"
			[distanceFactor]="20"
			[transform]="true"
		>
			<ngts-html
				[sprite]="true"
				[transform]="true"
				[distanceFactor]="20"
				[position]="[5, 15, 0]"
				[style]="{ background: 'palegreen', fontSize: '50px', padding: '10px 18px', border: '2px solid black' }"
			>
				<html-content *ngtsSobaContent text="Transform mode" />
			</ngts-html>
		</default-html-story>
	`,
	imports: [DefaultHtmlStory, NgtsHtml, NgtsSobaContent, HtmlContent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class TransformHtmlStory {}

@Component({
	standalone: true,
	template: `
		<ngt-group (beforeRender)="turn($event.object)">
			<ngt-mesh name="pink">
				<ngt-icosahedron-geometry *args="[5, 5]" />
				<ngt-mesh-basic-material color="hotpink" />
				<ngts-html [position]="[0, 0, -6]" renderedDivClass="html-story-label" occlude="blending">
					<span *ngtsSobaContent>Blending</span>
				</ngts-html>
			</ngt-mesh>

			<ngt-mesh name="yellow" [position]="[16, 0, 0]">
				<ngt-icosahedron-geometry *args="[5, 5]" />
				<ngt-mesh-basic-material color="yellow" />
				<ngts-html
					[position]="[0, 0, -6]"
					[transform]="true"
					renderedDivClass="html-story-label html-story-label-B"
					occlude="blending"
				>
					<span *ngtsSobaContent>Blending w/ transform</span>
				</ngts-html>
			</ngt-mesh>

			<ngt-mesh name="orange" [ref]="occluderRef" [position]="[0, 0, 16]">
				<ngt-icosahedron-geometry *args="[5, 5]" />
				<ngt-mesh-basic-material color="orange" />
				<ngts-html
					[position]="[0, 0, -6]"
					[transform]="true"
					renderedDivClass="html-story-label"
					[occlude]="[occluderRef]"
				>
					<span *ngtsSobaContent>Raycast occlusion</span>
				</ngts-html>
			</ngt-mesh>
		</ngt-group>
		<ngt-ambient-light [intensity]="0.8" />
		<ngt-point-light [intensity]="1" [position]="[0, 6, 0]" />
	`,
	imports: [NgtArgs, NgtsHtml, NgtsSobaContent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class OccludeHtmlStory {
	occluderRef = injectNgtRef<Mesh>();
	turn = turn;
}

export default {
	title: 'Misc/HTML',
	decorators: makeDecorators(),
};

export const Default = makeStoryObject(DefaultHtmlStory, {
	canvasOptions: { camera: { position: [-20, 20, -20] } },
	argsOptions: {
		color: 'hotpink',
		distanceFactor: 30,
		className: 'html-story-block',
	},
});

export const Transform = makeStoryObject(TransformHtmlStory, {
	canvasOptions: { camera: { position: [-20, 20, -20] } },
});

export const Occlusion = makeStoryFunction(OccludeHtmlStory, {
	camera: { position: [-20, 20, -20] },
	lights: false,
});
