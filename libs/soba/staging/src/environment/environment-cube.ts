import { Directive, Input, computed, effect, inject } from '@angular/core';
import { NgtStore, requestAnimationInInjectionContext } from 'angular-three';
import { NgtsEnvironmentInput } from './environment-input';
import { injectNgtsEnvironment, setEnvProps } from './utils';

@Directive({
    selector: 'ngts-environment-cube',
    standalone: true,
})
export class NgtsEnvironmentCube {
    protected readonly environmentInput = inject(NgtsEnvironmentInput);
    readonly #store = inject(NgtStore);
    readonly textureRef = injectNgtsEnvironment(this.environmentInput.environmentParams);

    @Input() set background(background: boolean) {
        this.environmentInput.set({ background });
    }

    constructor() {
        this.environmentInput.patch({ background: false });
        requestAnimationInInjectionContext(() => {
            this.#setEnvProps();
        });
    }

    #setEnvProps() {
        const scene = this.#store.select('scene');
        const trigger = computed(() => ({
            defaultScene: scene(),
            scene: this.environmentInput.environmentScene(),
            background: this.environmentInput.environmentBackground(),
            blur: this.environmentInput.environmentBlur(),
            texture: this.textureRef.nativeElement,
        }));

        effect((onCleanup) => {
            const { background, defaultScene, scene, blur, texture } = trigger();
            if (!texture) return;
            onCleanup(setEnvProps(background!, scene, defaultScene, texture, blur));
        });
    }
}
