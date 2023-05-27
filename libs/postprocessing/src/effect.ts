import { Directive, Input, computed, effect, inject } from '@angular/core';
import {
    NgtAnyRecord,
    NgtSignalStore,
    NgtStore,
    getLocalState,
    injectNgtRef,
    requestAnimationFrameInInjectionContext,
} from 'angular-three';
import { BlendFunction, Effect } from 'postprocessing';

@Directive()
export abstract class NgtpEffect<T extends Effect> extends NgtSignalStore<{
    blendFunction?: BlendFunction;
    opacity?: number;
}> {
    @Input() effectRef = injectNgtRef<T>();

    @Input() set blendFunction(blendFunction: BlendFunction) {
        this.set({ blendFunction });
    }

    @Input() set opacity(opacity: number) {
        this.set({ opacity });
    }

    protected defaultBlendFunction = BlendFunction.NORMAL;
    protected nativeArgs = () => [];

    readonly effectBlendFunction = this.select('blendFunction');
    readonly effectOpacity = this.select('opacity');

    protected readonly store = inject(NgtStore);
    protected readonly camera = this.store.select('camera');

    #previousProps?: NgtAnyRecord;
    readonly #nativeProps = computed(
        () => {
            const effect = this.effectRef.nativeElement;
            if (!effect) return this.#previousProps || null;
            const localState = getLocalState(effect);
            if (!localState) return this.#previousProps || null;
            const nativeProps = localState.nativeProps.select()();
            delete nativeProps['__ngt_dummy_state__'];
            if ('camera' in nativeProps) {
                delete nativeProps['camera'];
            }
            return (this.#previousProps = nativeProps);
        },
        { equal: Object.is }
    );

    protected readonly args = computed(() => {
        const nativeProps = this.#nativeProps();
        const nativeArgs = this.nativeArgs();
        if (nativeProps) return [...nativeArgs, ...[{ ...nativeProps }]];
        return [...nativeArgs];
    });

    constructor() {
        super();
        requestAnimationFrameInInjectionContext(() => {
            this.#setBlendMode();
        });
    }

    #setBlendMode() {
        const trigger = computed(() => ({
            blendFunction: this.effectBlendFunction(),
            opacity: this.effectOpacity(),
            effect: this.effectRef.nativeElement,
        }));
        effect(() => {
            const { effect, blendFunction, opacity } = trigger();
            if (!effect) return;
            const invalidate = this.store.get('invalidate');
            effect.blendMode.blendFunction =
                !blendFunction && blendFunction !== 0 ? this.defaultBlendFunction : blendFunction;
            if (opacity !== undefined) effect.blendMode.opacity.value = opacity;
            invalidate();
        });
    }
}
