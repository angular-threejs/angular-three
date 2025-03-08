import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	effect,
	inject,
	input,
	output,
} from '@angular/core';
import { NgtArgs, NgtObjectEvents, NgtThreeElements, injectStore, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
// @ts-expect-error - no type def
import { Text, preloadFont } from 'troika-three-text';

export interface NgtsTextOptions extends Partial<NgtThreeElements['ngt-mesh']> {
	characters?: string;
	color?: THREE.ColorRepresentation;
	/** Font size, default: 1 */
	fontSize: number;
	fontWeight?: number | string;
	fontStyle?: 'italic' | 'normal';
	maxWidth?: number;
	lineHeight?: number;
	letterSpacing?: number;
	textAlign?: 'left' | 'right' | 'center' | 'justify';
	font?: string;
	anchorX: number | 'left' | 'center' | 'right';
	anchorY: number | 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom';
	clipRect?: [number, number, number, number];
	depthOffset?: number;
	direction?: 'auto' | 'ltr' | 'rtl';
	overflowWrap?: 'normal' | 'break-word';
	whiteSpace?: 'normal' | 'overflowWrap' | 'nowrap';
	outlineWidth?: number | string;
	outlineOffsetX?: number | string;
	outlineOffsetY?: number | string;
	outlineBlur?: number | string;
	outlineColor?: THREE.ColorRepresentation;
	outlineOpacity?: number;
	strokeWidth?: number | string;
	strokeColor?: THREE.ColorRepresentation;
	strokeOpacity?: number;
	fillOpacity?: number;
	sdfGlyphSize: number;
	debugSDF?: boolean;
	glyphGeometryDetail?: number;
}

const defaultOptions: NgtsTextOptions = {
	sdfGlyphSize: 64,
	anchorX: 'center',
	anchorY: 'middle',
	fontSize: 1,
};

@Component({
	selector: 'ngts-text',
	template: `
		<ngt-primitive
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
	text = input.required<string>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['font', 'fontSize', 'sdfGlyphSize', 'anchorX', 'anchorY', 'characters']);

	synced = output<Text>();

	private objectEvents = inject(NgtObjectEvents, { host: true });
	private store = injectStore();

	private characters = pick(this.options, 'characters');

	protected font = pick(this.options, 'font');
	protected anchorX = pick(this.options, 'anchorX');
	protected anchorY = pick(this.options, 'anchorY');
	protected sdfGlyphSize = pick(this.options, 'sdfGlyphSize');
	protected fontSize = pick(this.options, 'fontSize');

	troikaMesh = new Text();

	constructor() {
		this.objectEvents.ngtObjectEvents.set(this.troikaMesh);

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
