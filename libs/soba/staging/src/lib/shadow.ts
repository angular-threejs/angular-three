import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	DOCUMENT,
	inject,
	input,
} from '@angular/core';
import { extend, NgtArgs, NgtColor, NgtThreeElements, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';

export interface NgtsShadowOptions extends Partial<NgtThreeElements['ngt-mesh']> {
	colorStop: number;
	fog: boolean;
	color: NgtColor;
	opacity: number;
	depthWrite: boolean;
}

const defaultShadowOptions: NgtsShadowOptions = {
	fog: false,
	depthWrite: false,
	colorStop: 0.0,
	color: 'black',
	opacity: 0.5,
};

@Component({
	selector: 'ngts-shadow',
	template: `
		<ngt-mesh [renderOrder]="renderOrder()" [rotation.x]="-Math.PI / 2" [parameters]="parameters()">
			<ngt-plane-geometry />
			<ngt-mesh-basic-material
				transparent
				[opacity]="opacity()"
				[fog]="fog()"
				[depthWrite]="depthWrite()"
				[side]="DoubleSide"
			>
				<ngt-canvas-texture *args="[canvas()]" attach="map" />
			</ngt-mesh-basic-material>
			<ng-content />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsShadow {
	protected readonly Math = Math;
	protected readonly DoubleSide = THREE.DoubleSide;

	options = input(defaultShadowOptions, { transform: mergeInputs(defaultShadowOptions) });
	protected parameters = omit(this.options, ['colorStop', 'fog', 'color', 'opacity', 'depthWrite', 'renderOrder']);

	private document = inject(DOCUMENT);

	protected renderOrder = pick(this.options, 'renderOrder');
	protected opacity = pick(this.options, 'opacity');
	protected fog = pick(this.options, 'fog');
	protected depthWrite = pick(this.options, 'depthWrite');

	private color = pick(this.options, 'color');
	private colorStop = pick(this.options, 'colorStop');

	protected canvas = computed(() => {
		const [color, colorStop] = [this.color(), this.colorStop()];

		const canvas = this.document.createElement('canvas');
		canvas.width = 128;
		canvas.height = 128;
		const context = canvas.getContext('2d') as CanvasRenderingContext2D;
		const gradient = context.createRadialGradient(
			canvas.width / 2,
			canvas.height / 2,
			0,
			canvas.width / 2,
			canvas.height / 2,
			canvas.width / 2,
		);
		const colorArgs = Array.isArray(color) ? color : [color];
		gradient.addColorStop(colorStop, new THREE.Color(...colorArgs).getStyle());
		gradient.addColorStop(1, 'rgba(0,0,0,0)');
		context.fillStyle = gradient;
		context.fillRect(0, 0, canvas.width, canvas.height);
		return canvas;
	});

	constructor() {
		extend({ Mesh, PlaneGeometry, MeshBasicMaterial, CanvasTexture });
	}
}
