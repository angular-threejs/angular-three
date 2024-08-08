import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
	signal,
	Signal,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectBeforeRender, injectStore, NgtArgs, NgtHTML } from 'angular-three';
import {
	NgtsScrollCanvas,
	NgtsScrollControls,
	NgtsScrollControlsOptions,
	NgtsScrollHtml,
} from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import { injectAnimations, NgtsIntersect } from 'angular-three-soba/misc';
import { NgtsSky } from 'angular-three-soba/staging';
import { MathUtils, Mesh } from 'three';
import { makeDecorators, makeStoryFunction, makeStoryObject } from '../setup-canvas';

@Component({
	selector: 'scroll-littlest-tokyo',
	standalone: true,
	template: `
		<ngt-primitive *args="[scene()]" [parameters]="{ position: [0, 2.5, 0], scale: 0.02 }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class LittlestTokyo {
	private gltf = injectGLTF(() => './LittlestTokyo-transformed.glb');
	scene = computed(() => {
		const gltf = this.gltf();
		if (!gltf) return null;

		const scene = gltf.scene;

		scene.traverse((node) => {
			if ((node as Mesh).isMesh) {
				node.receiveShadow = node.castShadow = true;
			}
		});

		return scene;
	});

	constructor() {
		const scrollControls = inject(NgtsScrollControls);
		const animations = injectAnimations(this.gltf, this.scene);

		injectBeforeRender(({ delta, camera }) => {
			const action = animations.actions['Take 001'];
			if (!action) return;

			if (!action.paused) {
				action.play().paused = true;
			}

			const offset = 1 - scrollControls.offset;
			action.time = MathUtils.damp(action.time, (action.getClip().duration / 2) * offset, 100, delta);
			camera.position.set(
				Math.sin(offset) * -10,
				Math.atan(offset * Math.PI * 2) * 5,
				Math.cos((offset * Math.PI) / 3) * -10,
			);
			camera.lookAt(0, 0, 0);
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-fog *args="['#ff5020', 5, 18]" attach="fog" />
		<ngt-ambient-light [intensity]="0.03" />
		<ngt-spot-light
			[angle]="0.14"
			color="#ffd0d0"
			[penumbra]="1"
			[position]="[25, 50, -20]"
			[castShadow]="true"
			[intensity]="Math.PI"
			[decay]="0"
		>
			<ngt-value [rawValue]="-0.0001" attach="shadow.bias" />
			<ngt-vector2 *args="[2048, 2048]" attach="shadow.mapSize" />
		</ngt-spot-light>
		<ngts-sky [options]="{ scale: 1000, sunPosition: [2, 0.4, 10] }" />

		<ngts-scroll-controls [options]="{ pages: 3 }">
			<scroll-littlest-tokyo />
		</ngts-scroll-controls>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtArgs, NgtsSky, NgtsScrollControls, LittlestTokyo],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class LittlestTokyoStory {
	protected readonly Math = Math;
}

@Component({
	selector: 'scroll-suzanne',
	standalone: true,
	template: `
		<ngt-group [position]="position()" [scale]="scale()">
			@if (gltf(); as gltf) {
				<ngt-mesh
					#mesh
					[(intersect)]="isIntersect"
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
	imports: [NgtsIntersect],
})
class Suzanne {
	position = input([0, 0, 0]);
	scale = input(1);

	gltf = injectGLTF(() => './suzanne.glb') as Signal<any>;

	hovered = signal(false);
	isIntersect = signal(false);

	meshRef = viewChild<ElementRef<Mesh>>('mesh');

	constructor() {
		injectBeforeRender(({ delta, viewport }) => {
			const mesh = this.meshRef()?.nativeElement;
			if (!mesh) return;
			mesh.rotation.x = MathUtils.damp(mesh.rotation.x, this.isIntersect() ? 0 : -viewport.height / 2 + 1, 4, delta);
		});
	}
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
			<ngt-group ngtsScrollCanvas>
				<scroll-suzanne [scale]="2" />
				<scroll-suzanne [position]="[-viewport().width / 8, -viewport().height, 0]" [scale]="3" />
				<scroll-suzanne [position]="[viewport().width / 4, -viewport().height * 2, 0]" [scale]="1.5" />
			</ngt-group>

			<div ngtsScrollHTML style="width: 100%; color: #ec2d2d">
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

export const Model = makeStoryFunction(LittlestTokyoStory, {
	camera: { position: [0, 0, 10] },
	lights: false,
	controls: false,
});
