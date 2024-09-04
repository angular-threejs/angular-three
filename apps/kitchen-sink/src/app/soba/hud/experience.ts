import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	computed,
	inject,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { NgtArgs, NgtPortal, NgtPortalContent, injectBeforeRender, injectStore } from 'angular-three';
import { NgtsText } from 'angular-three-soba/abstractions';
import { NgtsOrthographicCamera, NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsEnvironment, NgtsRenderTexture, NgtsRenderTextureContent } from 'angular-three-soba/staging';
import { Matrix4, Mesh, Scene } from 'three';

@Component({
	selector: 'app-torus',
	standalone: true,
	template: `
		<ngt-mesh [scale]="scale()" (pointerover)="hovered.set(true)" (pointerout)="hovered.set(false)">
			<ngt-torus-geometry *args="[1, 0.25, 32, 100]" />
			<ngt-mesh-standard-material [color]="color()" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Torus {
	scale = input(1);

	protected hovered = signal(false);
	protected color = computed(() => (this.hovered() ? 'hotpink' : 'orange'));
}

@Component({
	selector: 'app-face-material',
	standalone: true,
	template: `
		<ngt-mesh-standard-material [attach]="['material', index()]" [color]="color()">
			<ngts-render-texture [options]="{ frames: 6, anisotropy: 16 }">
				<ng-template renderTextureContent>
					<ngt-color *args="['white']" attach="background" />
					<ngts-orthographic-camera
						[options]="{ makeDefault: true, left: -1, right: 1, top: 1, bottom: -1, position: [0, 0, 10], zoom: 0.5 }"
					/>
					<ngts-text
						[text]="text()"
						[options]="{ color: 'black', font: 'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff' }"
					/>
				</ng-template>
			</ngts-render-texture>
		</ngt-mesh-standard-material>
	`,
	imports: [NgtsText, NgtsRenderTexture, NgtsOrthographicCamera, NgtArgs, NgtsRenderTextureContent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaceMaterial {
	index = input.required<number>();
	text = input.required<string>();

	private box = inject(Box);
	protected color = computed(() => (this.box.hovered() === this.index() ? 'hotpink' : 'orange'));
}

@Component({
	selector: 'app-box',
	standalone: true,
	template: `
		<ngt-mesh
			#mesh
			[position]="position()"
			[scale]="scale()"
			(click)="clicked.set(!clicked())"
			(pointermove)="$event.stopPropagation(); hovered.set($any($event).face.materialIndex)"
			(pointerout)="hovered.set(-1)"
		>
			<ngt-box-geometry />
			@for (face of faces; track face) {
				<app-face-material [index]="$index" [text]="face" />
			}
		</ngt-mesh>
	`,
	imports: [FaceMaterial],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Box {
	position = input([0, 0, 0]);

	mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	hovered = signal(-1);
	protected clicked = signal(false);
	protected scale = computed(() => (this.clicked() ? 1.5 : 1));

	protected faces = ['front', 'back', 'top', 'bottom', 'left', 'right'];

	constructor() {
		injectBeforeRender(({ delta }) => {
			this.mesh().nativeElement.rotation.x += delta;
		});
	}
}

@Component({
	selector: 'app-view-cube',
	standalone: true,
	template: `
		<ngt-portal [container]="scene()" [autoRender]="true">
			<ng-template portalContent>
				<ngt-ambient-light [intensity]="Math.PI / 2" />
				<ngt-spot-light [position]="[10, 10, 10]" [angle]="0.15" [penumbra]="0" [decay]="0" [intensity]="Math.PI" />
				<ngt-point-light [position]="[-10, -10, -10]" [decay]="0" [intensity]="Math.PI" />
				<ngts-perspective-camera [options]="{ makeDefault: true, position: [0, 0, 10] }" />
				<app-box [position]="boxPosition()" />
				<ngt-ambient-light [intensity]="1" />
				<ngt-point-light [position]="[200, 200, 100]" [intensity]="0.5" />
			</ng-template>
		</ngt-portal>
	`,
	imports: [Box, NgtPortal, NgtPortalContent, NgtsPerspectiveCamera],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewCube {
	protected Math = Math;

	private store = injectStore();
	private camera = this.store.select('camera');
	private viewport = this.store.select('viewport');

	private box = viewChild(Box);

	protected boxPosition = computed(() => [this.viewport().width / 2 - 1, this.viewport().height / 2 - 1, 0]);
	protected scene = computed(() => {
		const scene = new Scene();
		scene.name = 'hud-view-cube-virtual-scene';
		return scene;
	});

	constructor() {
		const matrix = new Matrix4();
		injectBeforeRender(() => {
			const box = this.box()?.mesh().nativeElement;
			if (box) {
				matrix.copy(this.camera().matrix).invert();
				box.quaternion.setFromRotationMatrix(matrix);
			}
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-color *args="['#dcdcdc']" attach="background" />
		<ngt-ambient-light [intensity]="0.5 * Math.PI" />

		<app-torus [scale]="1.75" />
		<app-view-cube />

		<ngts-orbit-controls />
		<ngts-environment [options]="{ preset: 'city' }" />
	`,
	imports: [NgtsOrbitControls, NgtsEnvironment, Torus, ViewCube, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'hud-experience' },
})
export class Experience {
	protected Math = Math;
}
