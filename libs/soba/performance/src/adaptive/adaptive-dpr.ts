import { Directive, effect, inject, Input, signal, untracked } from '@angular/core';
import { NgtStore } from 'angular-three';

@Directive({
    selector: 'ngts-adaptive-dpr',
    standalone: true,
})
export class NgtsAdaptiveDpr {
    #pixelated = signal(false);
    @Input() set pixelated(pixelated: boolean) {
        this.#pixelated.set(pixelated);
    }

    constructor() {
        const store = inject(NgtStore);
        effect(
            (onCleanup) => {
                const domElement = store.get('gl', 'domElement');
                onCleanup(() => {
                    const active = store.get('internal', 'active');
                    const setDpr = store.get('setDpr');
                    const initialDpr = store.get('viewport', 'initialDpr');
                    if (active) setDpr(initialDpr);
                    if (untracked(this.#pixelated) && domElement) domElement.style.imageRendering = 'auto';
                });
            },
            { allowSignalWrites: true }
        );

        effect(
            () => {
                const performanceCurrent = store.select('performance', 'current');
                const { gl, viewport, setDpr } = store.get();
                setDpr(performanceCurrent() * viewport.initialDpr);
                if (untracked(this.#pixelated) && gl.domElement)
                    gl.domElement.style.imageRendering = performanceCurrent() === 1 ? 'auto' : 'pixelated';
            },
            { allowSignalWrites: true }
        );
    }
}
