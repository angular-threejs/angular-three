import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed, effect, inject } from '@angular/core';
import {
    NgtArgs,
    NgtSignalStore,
    NgtStore,
    injectNgtRef,
    requestAnimationFrameInInjectionContext,
} from 'angular-three';
import { BlendFunction, LUT3DEffect } from 'postprocessing';

export interface NgtpLUTState {
    lut: THREE.Texture;
    blendFunction?: BlendFunction;
    tetrahedralInterpolation?: boolean;
}

@Component({
    selector: 'ngtp-lut',
    standalone: true,
    template: ` <ngt-primitive *args="[effect()]" [ref]="effectRef" /> `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpLUT extends NgtSignalStore<NgtpLUTState> {
    @Input() effectRef = injectNgtRef<LUT3DEffect>();

    @Input({ required: true }) set lut(lut: THREE.Texture) {
        this.set({ lut });
    }

    @Input() set blendFunction(blendFunction: BlendFunction) {
        this.set({ blendFunction });
    }

    @Input() set tetrahedralInterpolation(tetrahedralInterpolation: boolean) {
        this.set({ tetrahedralInterpolation });
    }

    readonly #lut = this.select('lut');
    readonly #tetrahedralInterpolation = this.select('tetrahedralInterpolation');
    readonly #blendFunction = this.select('blendFunction');

    readonly #store = inject(NgtStore);
    readonly #invalidate = this.#store.select('invalidate');

    readonly effect = computed(
        () =>
            new LUT3DEffect(this.#lut(), {
                blendFunction: this.#blendFunction(),
                tetrahedralInterpolation: this.#tetrahedralInterpolation(),
            })
    );

    constructor() {
        super();
        requestAnimationFrameInInjectionContext(() => {
            this.#setProps();
        });
    }

    #setProps() {
        const trigger = computed(() => ({
            effect: this.effect(),
            invalidate: this.#invalidate(),
            lut: this.#lut(),
            tetrahedralInterpolation: this.#tetrahedralInterpolation(),
        }));
        effect(() => {
            const { effect, lut, invalidate, tetrahedralInterpolation } = trigger();
            if (!effect) return;
            if (tetrahedralInterpolation) effect.tetrahedralInterpolation = tetrahedralInterpolation;
            if (lut) effect.lut = lut;
            invalidate();
        });
    }
}
