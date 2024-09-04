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
import { NgtArgs, injectBeforeRender } from 'angular-three';
import { NgtsText } from 'angular-three-soba/abstractions';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsContactShadows, NgtsRenderTexture, NgtsRenderTextureContent } from 'angular-three-soba/staging';
import { Mesh } from 'three';

@Component({
	selector: 'app-dodecahedron',
	standalone: true,
	template: `
		<ngt-group [position]="position()" [scale]="scale()">
			<ngt-mesh
				#mesh
				[name]="name()"
				[scale]="meshScale()"
				(click)="onActive()"
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
export class Dodecahedron {
	position = input([0, 0, 0]);
	scale = input(1);
	name = input('');

	protected hover = signal(false);
	protected active = signal(false);

	protected color = computed(() => (this.hover() ? 'hotpink' : '#5de4c7'));
	protected meshScale = computed(() => (this.active() ? 1.5 : 1));

	private mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		injectBeforeRender(() => {
			this.mesh().nativeElement.rotation.x += 0.01;
		});
	}

	onActive() {
		this.active.update((prev) => !prev);
	}
}

@Component({
	selector: 'app-material',
	standalone: true,
	template: `
		<ngt-mesh-standard-material>
			<ngts-render-texture [options]="{ anisotropy: 16 }">
				<ng-template renderTextureContent>
					<ngts-perspective-camera [options]="{ manual: true, makeDefault: true, aspect: 1, position: [0, 0, 5] }" />
					<ngt-color attach="background" *args="['orange']" />
					<ngt-ambient-light [intensity]="0.5" />
					<ngt-directional-light [position]="[10, 10, 5]" />
					<ngts-text
						text="hello"
						[options]="{
							font: 'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff',
							fontSize: 4,
							color: '#555',
						}"
					/>
					<app-dodecahedron />
				</ng-template>
			</ngts-render-texture>
		</ngt-mesh-standard-material>
	`,
	imports: [Dodecahedron, NgtsRenderTexture, NgtsRenderTextureContent, NgtArgs, NgtsPerspectiveCamera, NgtsText],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Material {
	private textRef = viewChild(NgtsText);

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
	selector: 'app-cube',
	standalone: true,
	template: `
		<ngt-mesh name="the-cube">
			<ngt-box-geometry />
			<app-material />
		</ngt-mesh>
	`,
	imports: [Material],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cube {}

@Component({
	standalone: true,
	template: `
		<ngt-color *args="['#cecece']" attach="background" />
		<ngt-ambient-light [intensity]="0.5" />
		<ngt-directional-light [position]="[10, 10, 5]" [intensity]="Math.PI" />
		<app-cube />
		<app-dodecahedron [position]="[0, 1, 0]" [scale]="0.2" name="root" />
		<ngts-contact-shadows [options]="{ frames: 1, position: [0, -0.5, 0], blur: 1, opacity: 0.75 }" />
		<ngts-contact-shadows [options]="{ frames: 1, position: [0, -0.5, 0], blur: 3, color: 'orange' }" />
		<ngts-orbit-controls [options]="{ minPolarAngle: 0, maxPolarAngle: Math.PI / 2.1 }" />
	`,
	imports: [Cube, Dodecahedron, NgtArgs, NgtsOrbitControls, NgtsContactShadows],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'render-texture-experience' },
})
export class Experience {
	protected Math = Math;
}
