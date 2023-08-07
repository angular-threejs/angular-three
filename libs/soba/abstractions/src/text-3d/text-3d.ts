import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { extend, injectNgtRef, NgtArgs, signalStore, type NgtMesh } from 'angular-three';
import { map, of, switchMap } from 'rxjs';
import { Mesh } from 'three';
import { FontLoader, TextGeometry, TextGeometryParameters } from 'three-stdlib';

declare type Glyph = { _cachedOutline: string[]; ha: number; o: string };

declare type FontData = {
	boundingBox: { yMax: number; yMin: number };
	familyName: string;
	glyphs: { [k: string]: Glyph };
	resolution: number;
	underlineThickness: number;
};

extend({ Mesh, TextGeometry });

export type NgtsText3DState = {
	font: FontData | string;
	text: string;
	bevelSegments?: number;
	smooth?: number;
} & Omit<TextGeometryParameters, 'font'>;

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-mesh
		 * @extends three-stdlib|TextGeometryParameters
		 */
		'ngts-text-3d': NgtsText3DState & NgtMesh;
	}
}

@Component({
	selector: 'ngts-text-3d',
	standalone: true,
	template: `
		<ngt-mesh ngtCompound [ref]="textRef">
			<ngt-text-geometry *args="geometryArgs()" />
			<ng-content />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsText3D {
	private inputs = signalStore<NgtsText3DState>({
		lineHeight: 1,
		letterSpacing: 0,
		size: 1,
		height: 0.2,
		bevelThickness: 0.1,
		bevelSize: 0.01,
		bevelEnabled: false,
		bevelOffset: 0,
		bevelSegments: 4,
		curveSegments: 8,
	});

	@Input() textRef = injectNgtRef<Mesh>();

	@Input({ required: true, alias: 'font' }) set _font(font: FontData | string) {
		this.inputs.set({ font });
	}

	@Input({ required: true, alias: 'text' }) set _text(text: string) {
		this.inputs.set({ text });
	}

	@Input({ alias: 'bevelEnabled' }) set _bevelEnabled(bevelEnabled: boolean) {
		this.inputs.set({ bevelEnabled });
	}

	@Input({ alias: 'bevelOffset' }) set _bevelOffset(bevelOffset: number) {
		this.inputs.set({ bevelOffset });
	}

	@Input({ alias: 'bevelSize' }) set _bevelSize(bevelSize: number) {
		this.inputs.set({ bevelSize });
	}

	@Input({ alias: 'bevelThickness' }) set _bevelThickness(bevelThickness: number) {
		this.inputs.set({ bevelThickness });
	}

	@Input({ alias: 'curveSegments' }) set _curveSegments(curveSegments: number) {
		this.inputs.set({ curveSegments });
	}

	@Input({ alias: 'bevelSegments' }) set _bevelSegments(bevelSegments: number) {
		this.inputs.set({ bevelSegments });
	}

	@Input({ alias: 'height' }) set _height(height: number) {
		this.inputs.set({ height });
	}

	@Input({ alias: 'size' }) set _size(size: number) {
		this.inputs.set({ size });
	}

	@Input({ alias: 'lineHeight' }) set _lineHeight(lineHeight: number) {
		this.inputs.set({ lineHeight });
	}

	@Input({ alias: 'letterSpacing' }) set _letterSpacing(letterSpacing: number) {
		this.inputs.set({ letterSpacing });
	}

	@Input({ alias: 'smooth' }) set _smooth(smooth: number) {
		this.inputs.set({ smooth });
	}

	private fontData = toSignal(
		toObservable(this.inputs.select('font')).pipe(
			switchMap((font) => {
				if (typeof font === 'string') return fetch(font).then((res) => res.json()) as Promise<FontData>;
				return of(font as FontData);
			}),
			map((fontData) => new FontLoader().parse(fontData)),
		),
	);

	private text = this.inputs.select('text');
	private size = this.inputs.select('size');
	private height = this.inputs.select('height');
	private bevelThickness = this.inputs.select('bevelThickness');
	private bevelSize = this.inputs.select('bevelSize');
	private bevelEnabled = this.inputs.select('bevelEnabled');
	private bevelSegments = this.inputs.select('bevelSegments');
	private bevelOffset = this.inputs.select('bevelOffset');
	private curveSegments = this.inputs.select('curveSegments');
	private letterSpacing = this.inputs.select('letterSpacing');
	private lineHeight = this.inputs.select('lineHeight');

	geometryArgs = computed(() => {
		const fontData = this.fontData();
		if (!fontData) return null;

		return [
			this.text(),
			{
				font: fontData,
				size: this.size(),
				height: this.height(),
				bevelThickness: this.bevelThickness(),
				bevelSize: this.bevelSize(),
				bevelSegments: this.bevelSegments(),
				bevelEnabled: this.bevelEnabled(),
				bevelOffset: this.bevelOffset(),
				curveSegments: this.curveSegments(),
				letterSpacing: this.letterSpacing(),
				lineHeight: this.lineHeight(),
			},
		];
	});
}
