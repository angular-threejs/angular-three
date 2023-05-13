import { Directive, computed, effect, inject } from '@angular/core';
import { NgtStore } from 'angular-three';
import { NgtsEnvironmentInput } from './environment-input';
import { injectNgtsEnvironment, setEnvProps } from './utils';

@Directive({
    selector: 'ngts-environment-cube',
    standalone: true,
})
export class NgtsEnvironmentCube extends NgtsEnvironmentInput {
    readonly #store = inject(NgtStore);
    readonly textureRef = injectNgtsEnvironment(this.environmentParams);

    constructor() {
        super();
        this.set({ background: false });
        this.#setEnvProps();
    }

    #setEnvProps() {
        const scene = this.#store.select('scene');
        const trigger = computed(() => ({
            defaultScene: scene(),
            scene: this.environmentScene(),
            background: this.environmentBackground(),
            blur: this.environmentBlur(),
            texture: this.textureRef.nativeElement,
        }));

        effect((onCleanup) => {
            const { background, defaultScene, scene, blur, texture } = trigger();
            if (!texture) return;
            onCleanup(setEnvProps(background, scene, defaultScene, texture, blur));
        });
    }
}
