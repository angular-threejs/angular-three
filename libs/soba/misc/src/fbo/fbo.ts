import {
    ChangeDetectorRef,
    computed,
    DestroyRef,
    effect,
    inject,
    Injector,
    runInInjectionContext,
} from '@angular/core';
import { assertInjectionContext, injectNgtRef, NgtStore, safeDetectChanges } from 'angular-three';
import * as THREE from 'three';

interface FBOSettings extends THREE.WebGLRenderTargetOptions {
    /** Defines the count of MSAA samples. Can only be used with WebGL 2. Default: 0 */
    samples?: number;
    /** If set, the scene depth will be rendered into buffer.depthTexture. Default: false */
    depth?: boolean;
}

export interface NgtsFBOParams {
    width?: number | FBOSettings;
    height?: number;
    settings?: FBOSettings;
}

export function injectNgtsFBO(fboParams: () => NgtsFBOParams, { injector }: { injector?: Injector } = {}) {
    injector = assertInjectionContext(injectNgtsFBO, injector);
    return runInInjectionContext(injector, () => {
        const store = inject(NgtStore);
        const cdr = inject(ChangeDetectorRef);

        const targetRef = injectNgtRef<THREE.WebGLRenderTarget>();

        inject(DestroyRef).onDestroy(() => targetRef.untracked.dispose());

        requestAnimationFrame(() => {
            const size = store.select('size');
            const dpr = store.select('viewport', 'dpr');
            const trigger = computed(() => {
                const { width, height, settings } = fboParams();
                const _width = typeof width === 'number' ? width : size().width * dpr();
                const _height = typeof height === 'number' ? height : size().height * dpr();
                const _settings = (typeof width === 'number' ? settings : (width as FBOSettings)) || {};

                return { width: _width, height: _height, settings: _settings };
            });

            effect(
                () => {
                    const { width, height, settings } = trigger();
                    const { samples = 0, depth, ...targetSettings } = settings;
                    if (!targetRef.untracked) {
                        const target = new THREE.WebGLRenderTarget(width, height, {
                            minFilter: THREE.LinearFilter,
                            magFilter: THREE.LinearFilter,
                            type: THREE.HalfFloatType,
                            ...targetSettings,
                        });
                        if (depth) target.depthTexture = new THREE.DepthTexture(width, height, THREE.FloatType);

                        target.samples = samples;
                        targetRef.nativeElement = target;
                    }

                    targetRef.untracked.setSize(width, height);
                    if (samples) targetRef.nativeElement.samples = samples;
                    safeDetectChanges(cdr);
                },
                { allowSignalWrites: true, injector }
            );
        });

        return targetRef;
    });
}
