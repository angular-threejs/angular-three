import {
	CUSTOM_ELEMENTS_SCHEMA,
	Component,
	DestroyRef,
	EventEmitter,
	Input,
	Output,
	effect,
	inject,
} from '@angular/core';
import { NgtArgs, injectNgtRef, injectNgtStore, signalStore, type NgtMesh } from 'angular-three-old';

// @ts-expect-error: no type def for troika-three-text
import { Text, preloadFont } from 'troika-three-text';

export type NgtsTextState = {
	text: string;
	/** Font size, default: 1 */
	fontSize: number;
	anchorX: number | 'left' | 'center' | 'right';
	anchorY: number | 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom';
	sdfGlyphSize: number;
	font?: string;
	characters?: string;
	color?: THREE.ColorRepresentation;
	maxWidth?: number;
	lineHeight?: number;
	letterSpacing?: number;
	textAlign?: 'left' | 'right' | 'center' | 'justify';
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
	debugSDF?: boolean;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-mesh
		 */
		'ngts-text': NgtsTextState & NgtMesh;
	}
}

@Component({
	selector: 'ngts-text',
	standalone: true,
	template: `
		<ngt-primitive
			ngtCompound
			*args="[troikaText]"
			[ref]="textRef"
			[text]="inputs.state().text"
			[anchorX]="inputs.state().anchorX"
			[anchorY]="inputs.state().anchorY"
			[font]="inputs.state().font"
			[fontSize]="inputs.state().fontSize"
			[sdfGlyphSize]="inputs.state().sdfGlyphSize"
			[characters]="inputs.state().characters"
			[color]="inputs.state().color"
			[maxWidth]="inputs.state().maxWidth"
			[lineHeight]="inputs.state().lineHeight"
			[letterSpacing]="inputs.state().letterSpacing"
			[textAlign]="inputs.state().textAlign"
			[clipRect]="inputs.state().clipRect"
			[depthOffset]="inputs.state().depthOffset"
			[direction]="inputs.state().direction"
			[overflowWrap]="inputs.state().overflowWrap"
			[whiteSpace]="inputs.state().whiteSpace"
			[outlineWidth]="inputs.state().outlineWidth"
			[outlineOffsetX]="inputs.state().outlineOffsetX"
			[outlineOffsetY]="inputs.state().outlineOffsetY"
			[outlineBlur]="inputs.state().outlineBlur"
			[outlineColor]="inputs.state().outlineColor"
			[outlineOpacity]="inputs.state().outlineOpacity"
			[strokeWidth]="inputs.state().strokeWidth"
			[strokeColor]="inputs.state().strokeColor"
			[strokeOpacity]="inputs.state().strokeOpacity"
			[fillOpacity]="inputs.state().fillOpacity"
			[debugSDF]="inputs.state().debugSDF"
		>
			<ng-content />
		</ngt-primitive>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsText {
	protected inputs = signalStore<NgtsTextState>({
		fontSize: 1,
		sdfGlyphSize: 64,
		anchorX: 'center',
		anchorY: 'middle',
	});

	@Input() textRef = injectNgtRef<Text>();

	@Input({ required: true }) set text(text: string) {
		this.inputs.set({ text });
	}

	@Input() set font(font: string) {
		this.inputs.set({ font });
	}

	@Input() set fontSize(fontSize: number) {
		this.inputs.set({ fontSize });
	}

	@Input() set anchorX(anchorX: number | 'left' | 'center' | 'right') {
		this.inputs.set({ anchorX });
	}

	@Input() set anchorY(anchorY: number | 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom') {
		this.inputs.set({ anchorY });
	}

	@Input() set sdfGlyphSize(sdfGlyphSize: number) {
		this.inputs.set({ sdfGlyphSize });
	}

	@Input() set characters(characters: string) {
		this.inputs.set({ characters });
	}

	@Input() set color(color: THREE.ColorRepresentation) {
		this.inputs.set({ color });
	}

	@Input() set maxWidth(maxWidth: number) {
		this.inputs.set({ maxWidth });
	}

	@Input() set lineHeight(lineHeight: number) {
		this.inputs.set({ lineHeight });
	}

	@Input() set letterSpacing(letterSpacing: number) {
		this.inputs.set({ letterSpacing });
	}

	@Input() set textAlign(textAlign: 'left' | 'right' | 'center' | 'justify') {
		this.inputs.set({ textAlign });
	}

	@Input() set clipRect(clipRect: [number, number, number, number]) {
		this.inputs.set({ clipRect });
	}

	@Input() set depthOffset(depthOffset: number) {
		this.inputs.set({ depthOffset });
	}

	@Input() set direction(direction: 'auto' | 'ltr' | 'rtl') {
		this.inputs.set({ direction });
	}

	@Input() set overflowWrap(overflowWrap: 'normal' | 'break-word') {
		this.inputs.set({ overflowWrap });
	}

	@Input() set whiteSpace(whiteSpace: 'normal' | 'overflowWrap' | 'nowrap') {
		this.inputs.set({ whiteSpace });
	}

	@Input() set outlineWidth(outlineWidth: number | string) {
		this.inputs.set({ outlineWidth });
	}

	@Input() set outlineOffsetX(outlineOffsetX: number | string) {
		this.inputs.set({ outlineOffsetX });
	}

	@Input() set outlineOffsetY(outlineOffsetY: number | string) {
		this.inputs.set({ outlineOffsetY });
	}

	@Input() set outlineBlur(outlineBlur: number | string) {
		this.inputs.set({ outlineBlur });
	}

	@Input() set outlineColor(outlineColor: THREE.ColorRepresentation) {
		this.inputs.set({ outlineColor });
	}

	@Input() set outlineOpacity(outlineOpacity: number) {
		this.inputs.set({ outlineOpacity });
	}

	@Input() set strokeWidth(strokeWidth: number | string) {
		this.inputs.set({ strokeWidth });
	}

	@Input() set strokeColor(strokeColor: THREE.ColorRepresentation) {
		this.inputs.set({ strokeColor });
	}

	@Input() set strokeOpacity(strokeOpacity: number) {
		this.inputs.set({ strokeOpacity });
	}

	@Input() set fillOpacity(fillOpacity: number) {
		this.inputs.set({ fillOpacity });
	}

	@Input() set debugSDF(debugSDF: boolean) {
		this.inputs.set({ debugSDF });
	}

	@Output() sync = new EventEmitter<Text>();

	troikaText = new Text();

	private store = injectNgtStore();

	constructor() {
		inject(DestroyRef).onDestroy(() => {
			this.troikaText.dispose();
		});
		this.preloadFont();
		this.syncText();
	}

	private preloadFont() {
		const _font = this.inputs.select('font');
		const _characters = this.inputs.select('characters');

		effect(() => {
			const [font, characters] = [_font(), _characters()];
			const invalidate = this.store.get('invalidate');
			preloadFont({ font, characters }, () => invalidate());
		});
	}

	private syncText() {
		effect(() => {
			const [invalidate] = [this.store.get('invalidate'), this.inputs.state()];
			this.troikaText.sync(() => {
				invalidate();
				if (this.sync.observed) {
					this.sync.emit(this.troikaText);
				}
			});
		});
	}
}
