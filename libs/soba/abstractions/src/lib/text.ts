import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	computed,
	effect,
	inject,
	input,
	output,
	viewChild,
} from '@angular/core';
import { NgtArgs, NgtObjectEvents, NgtThreeElements, injectStore, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
// @ts-expect-error - no type def
import { Text, preloadFont } from 'troika-three-text';

/**
 * Configuration options for the NgtsText component.
 * Uses troika-three-text for high-quality SDF text rendering.
 */
export interface NgtsTextOptions extends Partial<NgtThreeElements['ngt-mesh']> {
	/**
	 * Characters to pre-render for the font. Improves performance for known character sets.
	 */
	characters?: string;
	/**
	 * Color of the text.
	 */
	color?: THREE.ColorRepresentation;
	/**
	 * Font size in world units.
	 * @default 1
	 */
	fontSize: number;
	/**
	 * Font weight (numeric or string like 'bold').
	 */
	fontWeight?: number | string;
	/**
	 * Font style.
	 */
	fontStyle?: 'italic' | 'normal';
	/**
	 * Maximum width for text wrapping in world units.
	 */
	maxWidth?: number;
	/**
	 * Line height multiplier.
	 */
	lineHeight?: number;
	/**
	 * Letter spacing in world units.
	 */
	letterSpacing?: number;
	/**
	 * Text alignment within the bounding box.
	 */
	textAlign?: 'left' | 'right' | 'center' | 'justify';
	/**
	 * URL to the font file (supports .ttf, .otf, .woff).
	 */
	font?: string;
	/**
	 * Horizontal anchor point for positioning.
	 * @default 'center'
	 */
	anchorX: number | 'left' | 'center' | 'right';
	/**
	 * Vertical anchor point for positioning.
	 * @default 'middle'
	 */
	anchorY: number | 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom';
	/**
	 * Clipping rectangle [minX, minY, maxX, maxY].
	 */
	clipRect?: [number, number, number, number];
	/**
	 * Depth offset for z-fighting prevention.
	 */
	depthOffset?: number;
	/**
	 * Text direction for bidirectional text.
	 */
	direction?: 'auto' | 'ltr' | 'rtl';
	/**
	 * How to handle text overflow and wrapping.
	 */
	overflowWrap?: 'normal' | 'break-word';
	/**
	 * Whitespace handling mode.
	 */
	whiteSpace?: 'normal' | 'overflowWrap' | 'nowrap';
	/**
	 * Width of the text outline.
	 */
	outlineWidth?: number | string;
	/**
	 * Horizontal offset for the outline.
	 */
	outlineOffsetX?: number | string;
	/**
	 * Vertical offset for the outline.
	 */
	outlineOffsetY?: number | string;
	/**
	 * Blur radius for the outline.
	 */
	outlineBlur?: number | string;
	/**
	 * Color of the text outline.
	 */
	outlineColor?: THREE.ColorRepresentation;
	/**
	 * Opacity of the text outline (0-1).
	 */
	outlineOpacity?: number;
	/**
	 * Width of the text stroke.
	 */
	strokeWidth?: number | string;
	/**
	 * Color of the text stroke.
	 */
	strokeColor?: THREE.ColorRepresentation;
	/**
	 * Opacity of the text stroke (0-1).
	 */
	strokeOpacity?: number;
	/**
	 * Opacity of the text fill (0-1).
	 */
	fillOpacity?: number;
	/**
	 * Size of the SDF glyph texture. Higher values improve quality but use more memory.
	 * @default 64
	 */
	sdfGlyphSize: number;
	/**
	 * Enable debug visualization of the SDF texture.
	 */
	debugSDF?: boolean;
	/**
	 * Detail level for glyph geometry.
	 */
	glyphGeometryDetail?: number;
}

const defaultOptions: NgtsTextOptions = {
	sdfGlyphSize: 64,
	anchorX: 'center',
	anchorY: 'middle',
	fontSize: 1,
};

/**
 * A component for rendering high-quality 2D text in 3D scenes using troika-three-text.
 * Supports SDF (Signed Distance Field) rendering for crisp text at any scale.
 *
 * @example
 * ```html
 * <ngts-text text="Hello World" [options]="{ fontSize: 0.5, color: 'white' }" />
 * ```
 *
 * @example
 * ```html
 * <!-- With custom font and styling -->
 * <ngts-text
 *   text="Custom Font"
 *   [options]="{
 *     font: '/fonts/roboto.woff',
 *     fontSize: 1,
 *     color: '#ff0000',
 *     outlineWidth: 0.02,
 *     outlineColor: 'black'
 *   }"
 *   (synced)="onTextReady($event)"
 * />
 * ```
 */
@Component({
	selector: 'ngts-text',
	template: `
		<ngt-primitive
			#textPrimitive
			*args="[troikaMesh]"
			[text]="text()"
			[font]="font()"
			[anchorX]="anchorX()"
			[anchorY]="anchorY()"
			[sdfGlyphSize]="sdfGlyphSize()"
			[fontSize]="fontSize()"
			[parameters]="parameters()"
		>
			<ng-content />
		</ngt-primitive>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	hostDirectives: [
		{
			directive: NgtObjectEvents,
			outputs: [
				'click',
				'dblclick',
				'contextmenu',
				'pointerup',
				'pointerdown',
				'pointerover',
				'pointerout',
				'pointerenter',
				'pointerleave',
				'pointermove',
				'pointermissed',
				'pointercancel',
				'wheel',
			],
		},
	],
})
export class NgtsText {
	/**
	 * The text string to render.
	 */
	text = input.required<string>();

	/**
	 * Configuration options for text appearance and behavior.
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	protected parameters = omit(this.options, ['font', 'fontSize', 'sdfGlyphSize', 'anchorX', 'anchorY', 'characters']);

	/**
	 * Emitted when the text has been synced and is ready for rendering.
	 * Returns the Troika Text mesh instance.
	 */
	synced = output<Text>();

	private objectEvents = inject(NgtObjectEvents, { host: true });
	private store = injectStore();

	private characters = pick(this.options, 'characters');

	protected font = pick(this.options, 'font');
	protected anchorX = pick(this.options, 'anchorX');
	protected anchorY = pick(this.options, 'anchorY');
	protected sdfGlyphSize = pick(this.options, 'sdfGlyphSize');
	protected fontSize = pick(this.options, 'fontSize');

	/**
	 * The underlying Troika Text mesh instance.
	 */
	troikaMesh = new Text();

	// TODO: (chau) we currently need to use this with NgtObjectEvents
	//  to make sure `ngt-primitive` is instantitated before `injectObjectEvents`
	private textPrimitiveRef = viewChild<ElementRef<Text>>('textPrimitive');
	private textPrimitive = computed(() => this.textPrimitiveRef()?.nativeElement);

	constructor() {
		this.objectEvents.ngtObjectEvents.set(this.textPrimitive);

		inject(DestroyRef).onDestroy(() => {
			this.troikaMesh.dispose();
		});

		effect(() => {
			const [font, characters, invalidate] = [this.font(), this.characters(), this.store.invalidate()];
			if (font) {
				preloadFont({ font, characters }, () => invalidate());
			}
		});

		effect(() => {
			const [invalidate] = [this.store.invalidate(), this.text(), this.options()];
			this.troikaMesh.sync(() => {
				invalidate();
				this.synced.emit(this.troikaMesh);
			});
		});
	}
}
