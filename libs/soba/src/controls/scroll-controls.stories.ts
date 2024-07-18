import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, signal, Signal } from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectStore, NgtHTML } from 'angular-three';
import {
	NgtsScrollCanvas,
	NgtsScrollControls,
	NgtsScrollControlsOptions,
	NgtsScrollHtml,
} from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

@Component({
	selector: 'scroll-suzanne',
	standalone: true,
	template: `
		<ngt-group [position]="position()" [scale]="scale()">
			@if (gltf(); as gltf) {
				<ngt-mesh
					[geometry]="gltf.nodes.Suzanne.geometry"
					(pointerover)="hovered.set(true)"
					(pointerout)="hovered.set(false)"
				>
					<ngt-mesh-standard-material [color]="hovered() ? 'hotpink' : 'orange'" />
				</ngt-mesh>
			}
		</ngt-group>
	`,

	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Suzanne {
	position = input([0, 0, 0]);
	scale = input(1);

	gltf = injectGLTF(() => './suzanne.glb') as Signal<any>;

	hovered = signal(false);
}

@Component({
	selector: 'scroll-html-content',
	standalone: true,
	template: `
		<h1
			[style]="{ position: 'absolute', top: canvasSize().height * 0.1 + 'px', right: canvasSize().width * 0.2 + 'px' }"
		>
			Scroll down!
		</h1>
		<h1
			[style]="{
				position: 'absolute',
				top: canvasSize().height + 'px',
				right: canvasSize().width * 0.2 + 'px',
				fontSize: '25em',
				transform: 'translate3d(0,-100%,0)',
			}"
		>
			all
		</h1>
		<h1
			[style]="{ position: 'absolute', top: canvasSize().height * 1.8 + 'px', left: canvasSize().width * 0.1 + 'px' }"
		>
			hail
		</h1>
		<h1
			[style]="{ position: 'absolute', top: canvasSize().height * 2.6 + 'px', right: canvasSize().width * 0.1 + 'px' }"
		>
			thee,
		</h1>
		<h1
			[style]="{ position: 'absolute', top: canvasSize().height * 3.5 + 'px', left: canvasSize().width * 0.1 + 'px' }"
		>
			thoth
		</h1>
		<h1
			[style]="{ position: 'absolute', top: canvasSize().height * 4.5 + 'px', right: canvasSize().width * 0.1 + 'px' }"
		>
			her
			<br />
			mes.
		</h1>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class HtmlContent extends NgtHTML {
	canvasSize = this.store.select('size');
}

@Component({
	standalone: true,
	template: `
		<ngts-scroll-controls [(progress)]="progress" [options]="options()">
			<ngt-group ngts-scroll-canvas>
				<scroll-suzanne [scale]="2" />
				<scroll-suzanne [position]="[-viewport().width / 8, -viewport().height, 0]" [scale]="3" />
				<scroll-suzanne [position]="[viewport().width / 4, -viewport().height * 2, 0]" [scale]="1.5" />
			</ngt-group>

			<div ngts-scroll-html style="width: 100%; color: #ec2d2d">
				<scroll-html-content />
			</div>
		</ngts-scroll-controls>
	`,

	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsScrollControls, NgtsScrollCanvas, Suzanne, NgtsScrollHtml, HtmlContent],
})
class DefaultScrollControlsStory {
	progress = signal(0);
	options = input({} as NgtsScrollControlsOptions);

	private store = injectStore();
	viewport = this.store.select('viewport');
	canvasSize = this.store.select('size');
}

export default {
	title: 'Controls/ScrollControls',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultScrollControlsStory, {
	canvasOptions: { orthographic: true, camera: { zoom: 80 }, controls: false },
	argsOptions: {
		options: {
			pages: 3, // Each page takes 100% of the height of the canvas
			distance: 1, // A factor that increases scroll bar travel (default: 1)
			damping: 2, // Friction, higher is faster (default: 4)
			horizontal: false, // Can also scroll horizontally (default: false)
			infinite: false, // Can also scroll infinitely (default: false)
		},
	},
});

export const InsideAContainer = makeStoryObject(DefaultScrollControlsStory, {
	templateFn: (base) => `
    <div style="margin: 50px; padding: 50px; height: calc(100vh - 200px); position: relative;">
      ${base}
    </div>
  `,
	canvasOptions: { orthographic: true, camera: { zoom: 80 }, controls: false },
	argsOptions: {
		options: {
			pages: 3, // Each page takes 100% of the height of the canvas
			distance: 1, // A factor that increases scroll bar travel (default: 1)
			damping: 2, // Friction, higher is faster (default: 4)
			horizontal: false, // Can also scroll horizontally (default: false)
			infinite: false, // Can also scroll infinitely (default: false)
		},
	},
});
