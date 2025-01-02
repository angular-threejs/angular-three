import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { extend, NgtArgs, NgtGeometry, NgtMesh, omit, pick } from 'angular-three';
import { injectFont, NgtsFontInput } from 'angular-three-soba/loaders';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Mesh } from 'three';
import { mergeVertices, TextGeometry, TextGeometryParameters } from 'three-stdlib';

export interface NgtsText3DOptions extends Omit<TextGeometryParameters, 'font'> {
	bevelSegments: number;
	smooth?: number;
}

const defaultOptions: Partial<NgtMesh> & NgtsText3DOptions = {
	letterSpacing: 0,
	lineHeight: 1,
	size: 1,
	height: 0.2,
	bevelThickness: 0.1,
	bevelSize: 0.01,
	bevelEnabled: false,
	bevelOffset: 0,
	bevelSegments: 4,
	curveSegments: 8,
};

@Component({
	selector: 'ngts-text-3d',
	template: `
		<ngt-mesh #mesh [parameters]="parameters()">
			<ngt-text-geometry #textGeometry *args="textArgs()" />
			<ng-content />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsText3D {
	font = input.required<NgtsFontInput>();
	text = input.required<string>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
		'letterSpacing',
		'lineHeight',
		'size',
		'height',
		'bevelThickness',
		'bevelSize',
		'bevelEnabled',
		'bevelOffset',
		'bevelSegments',
		'curveSegments',
		'smooth',
	]);

	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');
	private textGeometryRef = viewChild<ElementRef<TextGeometry>>('textGeometry');

	loadedFont = injectFont(this.font);
	private smooth = pick(this.options, 'smooth');
	private textOptions = pick(this.options, [
		'letterSpacing',
		'lineHeight',
		'size',
		'height',
		'bevelThickness',
		'bevelSize',
		'bevelEnabled',
		'bevelOffset',
		'bevelSegments',
		'curveSegments',
	]);

	textArgs = computed(() => {
		const [text, font, textOptions] = [this.text(), this.loadedFont(), this.textOptions()];
		if (!font) return null;
		return [text, { font, ...textOptions }];
	});

	constructor() {
		extend({ Mesh, TextGeometry });

		effect(() => {
			const [mesh, textGeometry, textArgs] = [
				this.meshRef()?.nativeElement,
				this.textGeometryRef()?.nativeElement,
				this.textArgs(),
			];
			if (!textArgs || !textGeometry || !mesh) return;

			const smooth = this.smooth();
			if (smooth) {
				mesh.geometry = mergeVertices(textGeometry, smooth);
				mesh.geometry.computeVertexNormals();
			}
		});
	}
}

export type NgtTextGeometry = NgtGeometry<TextGeometry & TextGeometryParameters, typeof TextGeometry>;

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-extrude-geometry
		 * @rawOptions bevelEnabled|bevelOffset|bevelSize|bevelThickness|curveSegments|font|height|size|lineHeight|letterSpacing
		 */
		'ngt-text-geometry': NgtTextGeometry;
	}
}
