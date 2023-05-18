import { effect, inject, Injector, runInInjectionContext, type Signal } from '@angular/core';
import { assertInjectionContext, injectNgtLoader, NgtStore, type NgtLoaderResults } from 'angular-three';
import * as THREE from 'three';

export function injectNgtsTextureLoader<TInput extends string[] | string | Record<string, string>>(
    input: () => TInput,
    {
        onLoad,
        injector,
    }: {
        onLoad?: (texture: THREE.Texture | THREE.Texture[]) => void;
        injector?: Injector;
    } = {}
): Signal<NgtLoaderResults<TInput, THREE.Texture>> {
    injector = assertInjectionContext(injectNgtsTextureLoader, injector);
    return runInInjectionContext(injector, () => {
        const store = inject(NgtStore);
        const result = injectNgtLoader(() => THREE.TextureLoader, input, { injector });

        effect(() => {
            const textures = result();
            if (!textures) return;
            const array = Array.isArray(textures)
                ? textures
                : textures instanceof THREE.Texture
                ? [textures]
                : Object.values(textures);
            if (onLoad) onLoad(array);
            array.forEach(store.get('gl').initTexture);
        });

        return result;
    });
}

injectNgtsTextureLoader['preload'] = <TInput extends string[] | string | Record<string, string>>(
    input: () => TInput
) => {
    (injectNgtLoader as any).preload(() => THREE.TextureLoader, input);
};
