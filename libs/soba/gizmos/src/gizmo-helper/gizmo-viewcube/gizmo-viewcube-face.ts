import { DOCUMENT } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Input, signal } from '@angular/core';
import { extend, injectNgtStore, signalStore, type NgtThreeEvent } from 'angular-three';
import { Repeat } from 'ngxtension/repeat';
import { BoxGeometry, CanvasTexture, Mesh, MeshLambertMaterial } from 'three';
import { injectNgtsGizmoHelperApi } from '../gizmo-helper';
import { colors, defaultFaces } from './constants';
import { NgtsGizmoViewcubeInput } from './gizmo-viewcube-input';

extend({ MeshLambertMaterial, Mesh, BoxGeometry });

@Component({
	selector: 'ngts-gizmo-viewcube-face-material',
	standalone: true,
	template: `
		<ngt-mesh-lambert-material
			[attach]="['material', index()]"
			[map]="texture()"
			[color]="hover() ? viewcubeInput.hoverColor() : viewcubeInput.color()"
			[opacity]="viewcubeInput.opacity()"
			[transparent]="true"
		>
			<ngt-value [rawValue]="gl().capabilities.getMaxAnisotropy() || 1" attach="map.anisotrophy" />
		</ngt-mesh-lambert-material>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoViewcubeFaceMaterial {
	private inputs = signalStore<{ index: number; hover: boolean }>();
	private document = inject(DOCUMENT);
	private store = injectNgtStore();
	gl = this.store.select('gl');

	viewcubeInput = inject(NgtsGizmoViewcubeInput);

	@Input({ required: true, alias: 'index' }) set _index(index: number) {
		this.inputs.set({ index });
	}

	@Input({ required: true, alias: 'hover' }) set _hover(hover: boolean) {
		this.inputs.set({ hover });
	}

	index = this.inputs.select('index');
	hover = this.inputs.select('hover');

	texture = computed(() => {
		const [index, color, font, faces, textColor, strokeColor] = [
			this.index(),
			this.viewcubeInput.color(),
			this.viewcubeInput.font(),
			this.viewcubeInput.faces(),
			this.viewcubeInput.textColor(),
			this.viewcubeInput.strokeColor(),
		];

		const canvas = this.document.createElement('canvas');
		canvas.width = 128;
		canvas.height = 128;
		const context = canvas.getContext('2d')!;
		context.fillStyle = color!;
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.strokeStyle = strokeColor;
		context.strokeRect(0, 0, canvas.width, canvas.height);
		context.font = font!;
		context.textAlign = 'center';
		context.fillStyle = textColor;
		context.fillText(faces[index].toUpperCase(), 64, 76);

		return new CanvasTexture(canvas);
	});

	constructor() {
		this.viewcubeInput.inputs.patch({
			color: colors.bg,
			font: '20px Inter var, Arial, sans-serif',
			faces: defaultFaces,
			hoverColor: colors.hover,
			textColor: colors.text,
			strokeColor: colors.stroke,
			opacity: 1,
		});
	}
}

@Component({
	selector: 'ngts-gizmo-viewcube-face-cube',
	standalone: true,
	template: `
		<ngt-mesh
			(pointermove)="onPointerMove($any($event))"
			(pointerout)="onPointerOut($any($event))"
			(click)="onClick($any($event))"
		>
			<ngt-box-geometry />
			<ngts-gizmo-viewcube-face-material *ngFor="let i; repeat: 6" [hover]="hover() === i" [index]="i" />
		</ngt-mesh>
	`,
	imports: [NgtsGizmoViewcubeFaceMaterial, Repeat],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoViewcubeFaceCube {
	private gizmoApi = injectNgtsGizmoHelperApi();
	private viewcubeInput = inject(NgtsGizmoViewcubeInput);

	hover = signal(-1);

	onPointerMove(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		this.hover.set(Math.floor(event.faceIndex! / 2));
	}

	onPointerOut(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		this.hover.set(-1);
	}

	onClick(event: NgtThreeEvent<MouseEvent>) {
		if (this.viewcubeInput.viewcubeClick.observed) {
			this.viewcubeInput.viewcubeClick.emit(event);
		} else {
			event.stopPropagation();
			this.gizmoApi.tweenCamera(event.face!.normal);
		}
	}
}
