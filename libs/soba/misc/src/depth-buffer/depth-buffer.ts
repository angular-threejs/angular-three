import { ChangeDetectorRef, computed, effect, inject, Injector, runInInjectionContext } from '@angular/core';
import { assertInjectionContext, injectBeforeRender, injectNgtRef, NgtStore, safeDetectChanges } from 'angular-three';
import * as THREE from 'three';
import { injectNgtsFBO } from '../fbo/fbo';

export interface NgtsDepthBufferParams {
    size: number;
    frames: number;
}

export function injectNgtsDepthBuffer(
    paramsFactory: () => Partial<NgtsDepthBufferParams> = () => ({}),
    { injector }: { injector?: Injector } = {}
) {
    injector = assertInjectionContext(injectNgtsDepthBuffer, injector);
    return runInInjectionContext(injector, () => {
        const depthBufferRef = injectNgtRef<THREE.DepthTexture>();
        const store = inject(NgtStore);
        const cdr = inject(ChangeDetectorRef);

        const size = store.select('size');
        const dpr = store.select('viewport', 'dpr');

        requestAnimationFrame(() => {
            const fboParams = computed(() => {
                const params = { size: 256, frames: Infinity, ...paramsFactory() };
                const width = params.size || size().width * dpr();
                const height = params.size || size().height * dpr();
                const depthTexture = new THREE.DepthTexture(width, height);
                depthTexture.format = THREE.DepthFormat;
                depthTexture.type = THREE.UnsignedShortType;
                return { width, height, settings: { depthTexture } };
            });

            const fboRef = injectNgtsFBO(fboParams, { injector });

            effect(
                () => {
                    const fbo = fboRef.nativeElement;
                    if (fbo) {
                        depthBufferRef.nativeElement = fbo.depthTexture;
                        safeDetectChanges(cdr);
                    }
                },
                { allowSignalWrites: true, injector }
            );

            let count = 0;
            injectBeforeRender(
                ({ gl, scene, camera }) => {
                    const params = { size: 256, frames: Infinity, ...paramsFactory() };
                    if ((params.frames === Infinity || count < params.frames) && fboRef.untracked) {
                        gl.setRenderTarget(fboRef.untracked);
                        gl.render(scene, camera);
                        gl.setRenderTarget(null);
                        count++;
                    }
                },
                { injector }
            );
        });

        return depthBufferRef;
    });
}
