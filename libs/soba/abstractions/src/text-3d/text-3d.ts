import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { extend, NgtArgs, NgtSignalStore, type NgtMesh } from 'angular-three';
import { map, of, switchMap } from 'rxjs';
import { Mesh } from 'three';
import { FontLoader, TextGeometry } from 'three-stdlib';

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
    letterSpacing: number;
    lineHeight: number;
    size: number;
    height: number;
    bevelThickness: number;
    bevelSize: number;
    bevelEnabled: boolean;
    bevelOffset: number;
    bevelSegments: number;
    curveSegments: number;
};

declare global {
    interface HTMLElementTagNameMap {
        'ngts-text-3d': NgtsText3DState & NgtMesh;
    }
}

@Component({
    selector: 'ngts-text-3d',
    standalone: true,
    template: `
        <ngt-mesh ngtCompound>
            <ngt-text-geometry *args="geometryArgs()" />
            <ng-content />
        </ngt-mesh>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsText3D extends NgtSignalStore<NgtsText3DState> {
    @Input({ required: true }) set font(font: FontData | string) {
        this.set({ font });
    }

    @Input({ required: true }) set text(text: string) {
        this.set({ text });
    }

    @Input() set bevelEnabled(bevelEnabled: boolean) {
        this.set({ bevelEnabled });
    }

    @Input() set bevelOffset(bevelOffset: number) {
        this.set({ bevelOffset });
    }

    @Input() set bevelSize(bevelSize: number) {
        this.set({ bevelSize });
    }

    @Input() set bevelThickness(bevelThickness: number) {
        this.set({ bevelThickness });
    }

    @Input() set curveSegments(curveSegments: number) {
        this.set({ curveSegments });
    }

    @Input() set bevelSegments(bevelSegments: number) {
        this.set({ bevelSegments });
    }

    @Input() set height(height: number) {
        this.set({ height });
    }

    @Input() set size(size: number) {
        this.set({ size });
    }

    @Input() set lineHeight(lineHeight: number) {
        this.set({ lineHeight });
    }

    @Input() set letterSpacing(letterSpacing: number) {
        this.set({ letterSpacing });
    }

    constructor() {
        super({
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
    }

    readonly #fontData = toSignal(
        toObservable(this.select('font')).pipe(
            switchMap((font) => {
                if (typeof font === 'string') return fetch(font).then((res) => res.json()) as Promise<FontData>;
                return of(font as FontData);
            }),
            map((fontData) => new FontLoader().parse(fontData))
        )
    );

    readonly geometryArgs = computed(() => {
        const fontData = this.#fontData();
        if (!fontData) return null;
        const text = this.select('text');
        const size = this.select('size');
        const height = this.select('height');
        const bevelThickness = this.select('bevelThickness');
        const bevelSize = this.select('bevelSize');
        const bevelEnabled = this.select('bevelEnabled');
        const bevelSegments = this.select('bevelSegments');
        const bevelOffset = this.select('bevelOffset');
        const curveSegments = this.select('curveSegments');
        const letterSpacing = this.select('letterSpacing');
        const lineHeight = this.select('lineHeight');

        return [
            text(),
            {
                font: fontData,
                size: size(),
                height: height(),
                bevelThickness: bevelThickness(),
                bevelSize: bevelSize(),
                bevelSegments: bevelSegments(),
                bevelEnabled: bevelEnabled(),
                bevelOffset: bevelOffset(),
                curveSegments: curveSegments(),
                letterSpacing: letterSpacing(),
                lineHeight: lineHeight(),
            },
        ] as const;
    });
}
