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
import { extend, NgtArgs, NgtThreeElement, NgtThreeElements, omit, pick } from 'angular-three';
import { fontResource, type NgtsFontInput } from 'angular-three-soba/loaders';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Mesh } from 'three';
import { mergeVertices, TextGeometry, TextGeometryParameters } from 'three-stdlib';

/**
 * Configuration options for the NgtsText3D component.
 * Controls the geometry generation for 3D extruded text.
 */
export interface NgtsText3DOptions extends Omit<TextGeometryParameters, 'font'> {
	/**
	 * Number of bevel segments for smoother beveled edges.
	 * @default 4
	 */
	bevelSegments: number;
	/**
	 * Threshold for merging vertices to create smooth normals.
	 * When set, vertices closer than this value are merged.
	 */
	smooth?: number;
}

const defaultOptions: Partial<NgtThreeElements['ngt-mesh']> & NgtsText3DOptions = {
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

/**
 * A component for rendering 3D extruded text geometry.
 * Creates text with depth using Three.js TextGeometry with support for beveling and smooth normals.
 *
 * @example
 * ```html
 * <ngts-text-3d
 *   font="/fonts/helvetiker_regular.typeface.json"
 *   text="Hello"
 *   [options]="{ size: 0.5, height: 0.2 }"
 * >
 *   <ngt-mesh-standard-material color="gold" />
 * </ngts-text-3d>
 * ```
 *
 * @example
 * ```html
 * <!-- With beveling and smooth normals -->
 * <ngts-text-3d
 *   font="/fonts/font.json"
 *   text="3D Text"
 *   [options]="{
 *     size: 1,
 *     height: 0.5,
 *     bevelEnabled: true,
 *     bevelSize: 0.02,
 *     smooth: 0.01
 *   }"
 * >
 *   <ngt-mesh-normal-material />
 * </ngts-text-3d>
 * ```
 */
@Component({
	selector: 'ngts-text-3d,ngts-text-3D',
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
	/**
	 * Font source for the text. Can be a URL to a typeface.json file or a preloaded font object.
	 */
	font = input.required<NgtsFontInput>();

	/**
	 * The text string to render as 3D geometry.
	 */
	text = input.required<string>();

	/**
	 * Configuration options for the 3D text appearance.
	 */
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

	/**
	 * Reference to the underlying Mesh Three.js object.
	 */
	meshRef = viewChild.required<ElementRef<THREE.Mesh>>('mesh');

	private textGeometryRef = viewChild<ElementRef<TextGeometry>>('textGeometry');

	private loadedFont = fontResource(this.font);
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

	protected textArgs = computed(() => {
		const font = this.loadedFont.value();
		if (!font) return null;

		const [text, textOptions] = [this.text(), this.textOptions()];
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

/**
 * Type definition for the TextGeometry Three.js element.
 */
export type NgtTextGeometry = NgtThreeElement<typeof TextGeometry>;

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-extrude-geometry
		 * @rawOptions bevelEnabled|bevelOffset|bevelSize|bevelThickness|curveSegments|font|height|size|lineHeight|letterSpacing
		 */
		'ngt-text-geometry': NgtTextGeometry;
	}
}
