import { NgTemplateOutlet } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	afterNextRender,
	inject,
	input,
	output,
} from '@angular/core';
import { NgtArgs, NgtMesh, injectStore, omit, pick } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { ColorRepresentation } from 'three';
// @ts-expect-error - no type def
import { Text, preloadFont } from 'troika-three-text';

export interface NgtsTextOptions extends Partial<NgtMesh> {
	characters?: string;
	color?: ColorRepresentation;
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
	outlineColor?: ColorRepresentation;
	outlineOpacity?: number;
	strokeWidth?: number | string;
	strokeColor?: ColorRepresentation;
	strokeOpacity?: number;
	fillOpacity?: number;
	sdfGlyphSize: number;
	debugSDF?: boolean;
}

const defaultOptions: NgtsTextOptions = {
	sdfGlyphSize: 64,
	anchorX: 'center',
	anchorY: 'middle',
	fontSize: 1,
};

@Component({
	selector: 'ngts-text',
	standalone: true,
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
	imports: [NgtArgs, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsText {
	text = input.required<string>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['font', 'fontSize', 'sdfGlyphSize', 'anchorX', 'anchorY', 'characters']);

	synced = output<Text>();

	private autoEffect = injectAutoEffect();
	private store = injectStore();
	private invalidate = this.store.select('invalidate');

	private characters = pick(this.options, 'characters');

	font = pick(this.options, 'font');
	anchorX = pick(this.options, 'anchorX');
	anchorY = pick(this.options, 'anchorY');
	sdfGlyphSize = pick(this.options, 'sdfGlyphSize');
	fontSize = pick(this.options, 'fontSize');

	troikaMesh = new Text();

	constructor() {
		inject(DestroyRef).onDestroy(() => {
			this.troikaMesh.dispose();
		});

		// NOTE: this could be just effect but autoEffect is used for consistency
		this.autoEffect(() => {
			const [font, characters, invalidate] = [this.font(), this.characters(), this.invalidate()];
			if (font) {
				preloadFont({ font, characters }, () => invalidate());
			}
		});

		afterNextRender(() => {
			this.autoEffect(() => {
				const [invalidate] = [this.invalidate(), this.text(), this.options()];
				this.troikaMesh.sync(() => {
					invalidate();
					this.synced.emit(this.troikaMesh);
				});
			});
		});
	}
}
