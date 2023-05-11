import {
    assertInInjectionContext,
    ChangeDetectorRef,
    computed,
    DestroyRef,
    effect,
    inject,
    Injector,
    runInInjectionContext,
} from '@angular/core';
import { injectNgtRef, NgtStore, safeDetectChanges } from 'angular-three';
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
    assertInInjectionContext(injectNgtsFBO);

    if (!injector) {
        injector = inject(Injector);
    }

    return runInInjectionContext(injector, () => {
        const store = inject(NgtStore);
        const cdr = inject(ChangeDetectorRef);

        const targetRef = injectNgtRef<THREE.WebGLRenderTarget>();

        inject(DestroyRef).onDestroy(() => targetRef.untracked.dispose());

        const trigger = computed(() => {
            const size = store.select('size');
            const viewport = store.select('viewport');
            const { width, height, settings } = fboParams();
            return { size: size(), viewport: viewport(), width, height, settings };
        });

        effect(
            () => {
                const { size, width, height, settings, viewport } = trigger();
                const _width = typeof width === 'number' ? width : size.width * viewport.dpr;
                const _height = typeof height === 'number' ? height : size.height * viewport.dpr;
                const _settings = (typeof width === 'number' ? settings : (width as FBOSettings)) || {};
                const { samples = 0, depth, ...targetSettings } = _settings;

                if (!targetRef.untracked) {
                    const target = new THREE.WebGLRenderTarget(_width, _height, {
                        minFilter: THREE.LinearFilter,
                        magFilter: THREE.LinearFilter,
                        type: THREE.HalfFloatType,
                        ...targetSettings,
                    });
                    if (depth) target.depthTexture = new THREE.DepthTexture(_width, _height, THREE.FloatType);

                    target.samples = samples;
                    targetRef.nativeElement = target;
                }

                targetRef.untracked.setSize(_width, _height);
                if (samples) targetRef.nativeElement.samples = samples;
                safeDetectChanges(cdr);
            },
            { allowSignalWrites: true }
        );

        return targetRef;
    });
}
