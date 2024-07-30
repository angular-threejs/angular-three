import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	computed,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs, injectBeforeRender, injectStore } from 'angular-three';
import { NgtsText } from 'angular-three-soba/abstractions';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsContactShadows, NgtsRenderTexture, NgtsRenderTextureContent } from 'angular-three-soba/staging';
import { Mesh } from 'three';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	selector: 'render-texture-dodecahedron',
	standalone: true,
	template: `
		<ngt-group [position]="position()" [scale]="scale()">
			<ngt-mesh
				#mesh
				[scale]="meshScale()"
				(click)="active.set(!active())"
				(pointerover)="hover.set(true)"
				(pointerout)="hover.set(false)"
			>
				<ngt-dodecahedron-geometry *args="[0.75]" />
				<ngt-mesh-standard-material [color]="color()" />
			</ngt-mesh>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Dodecahedron {
	position = input([0, 0, 0]);
	scale = input(1);

	hover = signal(false);
	active = signal(false);

	color = computed(() => (this.hover() ? 'hotpink' : '#5de4c7'));
	meshScale = computed(() => (this.active() ? 1.5 : 1));

	mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		injectBeforeRender(() => {
			this.mesh().nativeElement.rotation.x += 0.01;
		});
	}
}

@Component({
	selector: 'render-texture-cube',
	standalone: true,
	template: `
		<ngt-mesh>
			<ngt-box-geometry />
			<ngt-mesh-standard-material>
				<ngts-render-texture [options]="{ anisotropy: 16 }">
					<ng-template renderTextureContent>
						<ngts-perspective-camera [options]="cameraOptions" />
						<ngt-color attach="background" *args="['orange']" />
						<ngt-ambient-light [intensity]="0.5 * Math.PI" />
						<ngt-directional-light [position]="[10, 10, 5]" [intensity]="Math.PI" />
						<ngts-text text="hello" [options]="textOptions" />
						<render-texture-dodecahedron />
					</ng-template>
				</ngts-render-texture>
			</ngt-mesh-standard-material>
		</ngt-mesh>
	`,
	imports: [Dodecahedron, NgtsRenderTexture, NgtArgs, NgtsPerspectiveCamera, NgtsText, NgtsRenderTextureContent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Cube {
	Math = Math;

	cameraOptions = {
		manual: true,
		makeDefault: true,
		aspect: 1,
		position: [0, 0, 5],
	};
	textOptions = {
		font: 'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff',
		fontSize: 4,
		color: '#555',
	};

	textRef = viewChild(NgtsText);

	constructor() {
		injectBeforeRender(({ clock }) => {
			const text = this.textRef()?.troikaMesh;
			if (text) {
				text.position.x = Math.sin(clock.elapsedTime) * 2;
			}
		});
	}
}

@Component({
	standalone: true,
	template: `
		<render-texture-cube />
		<render-texture-dodecahedron [position]="[0, 1, 0]" [scale]="0.2" />
		<ngts-contact-shadows [options]="{ frames: 1, position: [0, -0.5, 0], blur: 1, opacity: 0.75 }" />
		<ngts-contact-shadows [options]="{ frames: 1, position: [0, -0.5, 0], blur: 3, color: 'orange' }" />
		<ngts-orbit-controls [options]="{ minPolarAngle: 0, maxPolarAngle: Math.PI / 2.1 }" />
	`,
	imports: [NgtsContactShadows, NgtsOrbitControls, Cube, Dodecahedron],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultRenderTextureStory {
	Math = Math;

	store = injectStore();

	constructor() {}
}

export default {
	title: 'Staging/Render Texture',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryFunction(DefaultRenderTextureStory, {
	background: 'white',
	camera: { position: [5, 5, 5], fov: 25 },
});
