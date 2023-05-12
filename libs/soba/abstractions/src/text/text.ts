import {
    CUSTOM_ELEMENTS_SCHEMA,
    Component,
    DestroyRef,
    EventEmitter,
    Input,
    Output,
    computed,
    effect,
    inject,
} from '@angular/core';
import { NgtArgs, NgtSignalStore, NgtStore, injectNgtRef, type NgtMesh } from 'angular-three';

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
            [text]="state().text"
            [anchorX]="state().anchorX"
            [anchorY]="state().anchorY"
            [font]="state().font"
            [fontSize]="state().fontSize"
            [sdfGlyphSize]="state().sdfGlyphSize"
            [characters]="state().characters"
            [color]="state().color"
            [maxWidth]="state().maxWidth"
            [lineHeight]="state().lineHeight"
            [letterSpacing]="state().letterSpacing"
            [textAlign]="state().textAlign"
            [clipRect]="state().clipRect"
            [depthOffset]="state().depthOffset"
            [direction]="state().direction"
            [overflowWrap]="state().overflowWrap"
            [whiteSpace]="state().whiteSpace"
            [outlineWidth]="state().outlineWidth"
            [outlineOffsetX]="state().outlineOffsetX"
            [outlineOffsetY]="state().outlineOffsetY"
            [outlineBlur]="state().outlineBlur"
            [outlineColor]="state().outlineColor"
            [outlineOpacity]="state().outlineOpacity"
            [strokeWidth]="state().strokeWidth"
            [strokeColor]="state().strokeColor"
            [strokeOpacity]="state().strokeOpacity"
            [fillOpacity]="state().fillOpacity"
            [debugSDF]="state().debugSDF"
        >
            <ng-content />
        </ngt-primitive>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsText extends NgtSignalStore<NgtsTextState> {
    @Input() textRef = injectNgtRef<Text>();

    @Input({ required: true }) set text(text: string) {
        this.set({ text });
    }

    @Input() set font(font: string) {
        this.set({ font });
    }

    @Input() set fontSize(fontSize: number) {
        this.set({ fontSize });
    }

    @Input() set anchorX(anchorX: number | 'left' | 'center' | 'right') {
        this.set({ anchorX });
    }

    @Input() set anchorY(anchorY: number | 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom') {
        this.set({ anchorY });
    }

    @Input() set sdfGlyphSize(sdfGlyphSize: number) {
        this.set({ sdfGlyphSize });
    }

    @Input() set characters(characters: string) {
        this.set({ characters });
    }

    @Input() set color(color: THREE.ColorRepresentation) {
        this.set({ color });
    }

    @Input() set maxWidth(maxWidth: number) {
        this.set({ maxWidth });
    }

    @Input() set lineHeight(lineHeight: number) {
        this.set({ lineHeight });
    }

    @Input() set letterSpacing(letterSpacing: number) {
        this.set({ letterSpacing });
    }

    @Input() set textAlign(textAlign: 'left' | 'right' | 'center' | 'justify') {
        this.set({ textAlign });
    }

    @Input() set clipRect(clipRect: [number, number, number, number]) {
        this.set({ clipRect });
    }

    @Input() set depthOffset(depthOffset: number) {
        this.set({ depthOffset });
    }

    @Input() set direction(direction: 'auto' | 'ltr' | 'rtl') {
        this.set({ direction });
    }

    @Input() set overflowWrap(overflowWrap: 'normal' | 'break-word') {
        this.set({ overflowWrap });
    }

    @Input() set whiteSpace(whiteSpace: 'normal' | 'overflowWrap' | 'nowrap') {
        this.set({ whiteSpace });
    }

    @Input() set outlineWidth(outlineWidth: number | string) {
        this.set({ outlineWidth });
    }

    @Input() set outlineOffsetX(outlineOffsetX: number | string) {
        this.set({ outlineOffsetX });
    }

    @Input() set outlineOffsetY(outlineOffsetY: number | string) {
        this.set({ outlineOffsetY });
    }

    @Input() set outlineBlur(outlineBlur: number | string) {
        this.set({ outlineBlur });
    }

    @Input() set outlineColor(outlineColor: THREE.ColorRepresentation) {
        this.set({ outlineColor });
    }

    @Input() set outlineOpacity(outlineOpacity: number) {
        this.set({ outlineOpacity });
    }

    @Input() set strokeWidth(strokeWidth: number | string) {
        this.set({ strokeWidth });
    }

    @Input() set strokeColor(strokeColor: THREE.ColorRepresentation) {
        this.set({ strokeColor });
    }

    @Input() set strokeOpacity(strokeOpacity: number) {
        this.set({ strokeOpacity });
    }

    @Input() set fillOpacity(fillOpacity: number) {
        this.set({ fillOpacity });
    }

    @Input() set debugSDF(debugSDF: boolean) {
        this.set({ debugSDF });
    }

    @Output() sync = new EventEmitter<Text>();

    readonly troikaText = new Text();

    readonly #store = inject(NgtStore);

    readonly state = this.select();

    constructor() {
        super({ fontSize: 1, sdfGlyphSize: 64, anchorX: 'center', anchorY: 'middle' });
        inject(DestroyRef).onDestroy(() => {
            this.troikaText.dispose();
        });
        this.#preloadFont();
        this.#syncText();
    }

    #preloadFont() {
        const font = this.select('font');
        const characters = this.select('characters');
        const trigger = computed(() => ({ font: font(), characters: characters() }));

        effect(() => {
            const { font, characters } = trigger();
            const invalidate = this.#store.get('invalidate');
            preloadFont({ font, characters }, () => invalidate());
        });
    }

    #syncText() {
        const state = this.select();
        effect(() => {
            state();
            const invalidate = this.#store.get('invalidate');
            this.troikaText.sync(() => {
                invalidate();
                if (this.sync.observed) {
                    this.sync.emit(this.troikaText);
                }
            });
        });
    }
}
