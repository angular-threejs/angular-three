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

        const performanceCurrent = store.select('performance', 'current');
        // TODO: mousemove event doesn't seem to trigger change detection. investigate later
        effect(
            () => {
                const current = performanceCurrent();
                const { gl, viewport, setDpr } = store.get();
                setDpr(current * viewport.initialDpr);
                if (untracked(this.#pixelated) && gl.domElement)
                    gl.domElement.style.imageRendering = current === 1 ? 'auto' : 'pixelated';
            },
            { allowSignalWrites: true }
        );
    }
}
