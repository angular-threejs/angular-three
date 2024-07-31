import { DOCUMENT } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	Directive,
	ElementRef,
	inject,
	signal,
	viewChild,
} from '@angular/core';
import { extend, getLocalState, injectBeforeRender, injectObjectEvents, NgtCanvas } from 'angular-three';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import * as THREE from 'three';
import { type Mesh, Object3D } from 'three';

extend(THREE);

@Directive({ selector: '[cursor]', standalone: true })
export class Cursor {
	constructor() {
		const elementRef = inject<ElementRef<Object3D>>(ElementRef);
		const nativeElement = elementRef.nativeElement;

		if (!nativeElement.isObject3D) return;

		const localState = getLocalState(nativeElement);
		if (!localState) return;

		const document = inject(DOCUMENT);

		injectObjectEvents(() => nativeElement, {
			pointerover: () => {
				document.body.style.cursor = 'pointer';
			},
			pointerout: () => {
				document.body.style.cursor = 'default';
			},
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-spot-light [position]="[5, 5, 5]" [intensity]="Math.PI" [decay]="0" />
		<ngt-point-light [position]="[-10, -10, -10]" [decay]="0" />

		<ngt-mesh #mesh cursor (pointerover)="hovered.set(true)" (pointerout)="hovered.set(false)">
			<ngt-box-geometry />
			<ngt-mesh-standard-material [color]="hovered() ? 'mediumpurple' : 'maroon'" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [Cursor, NgtsEnvironment],
})
export class SceneGraph {
	hovered = signal(false);

	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		injectBeforeRender(() => {
			const mesh = this.meshRef().nativeElement;
			mesh.rotation.x += 0.01;
			mesh.rotation.y += 0.01;
		});
	}

	protected readonly Math = Math;
}

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="sceneGraph" [camera]="{ position: [0, 0, 2] }" />
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'cursor-scene' },
})
export default class CursorScene {
	sceneGraph = SceneGraph;
}
