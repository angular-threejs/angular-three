import { DOCUMENT } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	inject,
	input,
	untracked,
} from '@angular/core';
import { extend, injectStore, NgtArgs, NgtAttachable, NgtThreeElements, omit } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { CanvasTexture } from 'three';

export interface NgtsGradientTextureOptions extends Partial<Omit<NgtThreeElements['ngt-canvas-texture'], 'type'>> {
	size: number;
	width: number;
	type: 'linear' | 'radial';
	innerCircleRadius: number;
	outerCircleRadius: string | number;
}

const defaultOptions: NgtsGradientTextureOptions = {
	size: 1024,
	width: 16,
	type: 'linear',
	innerCircleRadius: 0,
	outerCircleRadius: 'auto',
};

@Component({
	selector: 'ngts-gradient-texture',
	template: `
		<ngt-canvas-texture
			*args="[canvas()]"
			[attach]="attach()"
			[colorSpace]="outputColorSpace()"
			[parameters]="parameters()"
		>
			<ng-content />
		</ngt-canvas-texture>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsGradientTexture {
	attach = input<NgtAttachable>('map');
	stops = input.required<Array<number>>();
	colors = input.required<Array<THREE.ColorRepresentation>>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['size', 'width', 'type', 'innerCircleRadius', 'outerCircleRadius']);

	private document = inject(DOCUMENT);
	private store = injectStore();
	protected outputColorSpace = this.store.gl.outputColorSpace;

	protected canvas = computed(() => {
		const canvas = this.document.createElement('canvas');
		const context = canvas.getContext('2d')!;
		const [{ width, size, type, outerCircleRadius, innerCircleRadius }, stops, colors] = [
			untracked(this.options),
			this.stops(),
			this.colors(),
		];
		canvas.width = width;
		canvas.height = size;

		let gradient: CanvasGradient;

		if (type === 'linear') {
			gradient = context.createLinearGradient(0, 0, 0, size);
		} else {
			const canvasCenterX = canvas.width / 2;
			const canvasCenterY = canvas.height / 2;
			const radius =
				outerCircleRadius !== 'auto'
					? Math.abs(Number(outerCircleRadius))
					: Math.sqrt(canvasCenterX ** 2 + canvasCenterY ** 2);
			gradient = context.createRadialGradient(
				canvasCenterX,
				canvasCenterY,
				Math.abs(innerCircleRadius),
				canvasCenterX,
				canvasCenterY,
				radius,
			);
		}

		const tempColor = new THREE.Color(); // reuse instance for performance

		let i = stops.length;
		while (i--) {
			gradient.addColorStop(stops[i], tempColor.set(colors[i]).getStyle());
		}

		context.save();
		context.fillStyle = gradient;
		context.fillRect(0, 0, width, size);
		context.restore();

		return canvas;
	});

	constructor() {
		extend({ CanvasTexture });
	}
}
