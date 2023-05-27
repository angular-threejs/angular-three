import {
    CUSTOM_ELEMENTS_SCHEMA,
    Component,
    InjectionToken,
    Input,
    Signal,
    computed,
    effect,
    inject,
} from '@angular/core';
import {
    NgtSignalStore,
    NgtStore,
    extend,
    injectBeforeRender,
    injectNgtRef,
    requestAnimationFrameInInjectionContext,
} from 'angular-three';
import { DepthDownsamplingPass, EffectComposer, EffectPass, NormalPass, RenderPass } from 'postprocessing';
import * as THREE from 'three';
import { Group } from 'three';
import { isWebGL2Available } from 'three-stdlib';

extend({ Group });

export interface NgtpEffectComposerState {
    enabled: boolean;
    depthBuffer?: boolean;
    disableNormalPass?: boolean;
    stencilBuffer?: boolean;
    autoClear: boolean;
    resolutionScale?: number;
    multisampling: number;
    frameBufferType: THREE.TextureDataType;
    renderPriority: number;
    camera?: THREE.Camera;
    scene?: THREE.Scene;
}

export interface NgtpEffectComposerApi {
    composer: EffectComposer;
    normalPass: NormalPass | null;
    downSamplingPass: DepthDownsamplingPass | null;
    camera: THREE.Camera;
    scene: THREE.Scene;
    resolutionScale?: number;
}

export const NGTP_EFFECT_COMPOSER_API = new InjectionToken<Signal<NgtpEffectComposerApi>>('NgtpEffectComposer API');

@Component({
    selector: 'ngtp-effect-composer',
    standalone: true,
    template: `
        <ngt-group [ref]="composerRef">
            <ng-content />
        </ngt-group>
    `,
    providers: [
        {
            provide: NGTP_EFFECT_COMPOSER_API,
            useFactory: (composer: NgtpEffectComposer) => composer.api,
            deps: [NgtpEffectComposer],
        },
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpEffectComposer extends NgtSignalStore<NgtpEffectComposerState> {
    readonly composerRef = injectNgtRef<THREE.Group>();

    @Input() set enabled(enabled: boolean) {
        this.set({ enabled });
    }

    @Input() set depthBuffer(depthBuffer: boolean) {
        this.set({ depthBuffer });
    }

    @Input() set disableNormalPass(disableNormalPass: boolean) {
        this.set({ disableNormalPass });
    }

    @Input() set stencilBuffer(stencilBuffer: boolean) {
        this.set({ stencilBuffer });
    }

    @Input() set autoClear(autoClear: boolean) {
        this.set({ autoClear });
    }

    @Input() set resolutionScale(resolutionScale: number) {
        this.set({ resolutionScale });
    }

    @Input() set multisampling(multisampling: number) {
        this.set({ multisampling });
    }

    @Input() set frameBufferType(frameBufferType: THREE.TextureDataType) {
        this.set({ frameBufferType });
    }

    @Input() set renderPriority(renderPriority: number) {
        this.set({ renderPriority });
    }

    @Input() set camera(camera: THREE.Camera) {
        this.set({ camera });
    }

    @Input() set scene(scene: THREE.Scene) {
        this.set({ scene });
    }

    readonly #store = inject(NgtStore);
    readonly #gl = this.#store.select('gl');
    readonly #size = this.#store.select('size');
    readonly #defaultScene = this.#store.select('scene');
    readonly #defaultCamera = this.#store.select('camera');

    readonly #scene = this.select('scene');
    readonly #camera = this.select('camera');

    readonly #depthBuffer = this.select('depthBuffer');
    readonly #stencilBuffer = this.select('stencilBuffer');
    readonly #multisampling = this.select('multisampling');
    readonly #frameBufferType = this.select('frameBufferType');
    readonly #disableNormalPass = this.select('disableNormalPass');
    readonly #resolutionScale = this.select('resolutionScale');

    readonly #activeScene = computed(() => this.#scene() || this.#defaultScene());
    readonly #activeCamera = computed(() => this.#camera() || this.#defaultCamera());

    readonly #composerEntities = computed(() => {
        const gl = this.#gl();
        const camera = this.#activeCamera();
        const scene = this.#activeScene();
        const depthBuffer = this.#depthBuffer();
        const stencilBuffer = this.#stencilBuffer();
        const multisampling = this.#multisampling();
        const frameBufferType = this.#frameBufferType();
        const disableNormalPass = this.#disableNormalPass();
        const resolutionScale = this.#resolutionScale();

        const webGL2Available = isWebGL2Available();
        // Initialize composer
        const effectComposer = new EffectComposer(gl, {
            depthBuffer,
            stencilBuffer,
            multisampling: multisampling > 0 && webGL2Available ? multisampling : 0,
            frameBufferType,
        });

        // Add render pass
        effectComposer.addPass(new RenderPass(scene, camera));

        // Create normal pass
        let downSamplingPass = null;
        let normalPass = null;
        if (!disableNormalPass) {
            normalPass = new NormalPass(scene, camera);
            normalPass.enabled = false;
            effectComposer.addPass(normalPass);
            if (resolutionScale !== undefined && webGL2Available) {
                downSamplingPass = new DepthDownsamplingPass({ normalBuffer: normalPass.texture, resolutionScale });
                downSamplingPass.enabled = false;
                effectComposer.addPass(downSamplingPass);
            }
        }

        return { effectComposer, normalPass, downSamplingPass };
    });

    readonly api = computed(() => {
        const { effectComposer, normalPass, downSamplingPass } = this.#composerEntities();
        return {
            composer: effectComposer,
            normalPass,
            downSamplingPass,
            resolutionScale: this.#resolutionScale(),
            camera: this.#activeCamera(),
            scene: this.#activeScene(),
        };
    });

    constructor() {
        super({
            enabled: true,
            renderPriority: 1,
            autoClear: true,
            multisampling: 8,
            frameBufferType: THREE.HalfFloatType,
        });
        requestAnimationFrameInInjectionContext(() => {
            this.#setComposerSize();
            this.#updateEffectPasses();
            this.#setBeforeRender();
        });
    }

    #setComposerSize() {
        const trigger = computed(() => ({ composer: this.#composerEntities().effectComposer, size: this.#size() }));
        effect(() => {
            const { composer, size } = trigger();
            if (!composer) return;
            composer.setSize(size.width, size.height);
        });
    }

    #updateEffectPasses() {
        const trigger = computed(() => ({
            composerEntities: this.#composerEntities(),
            instance: this.composerRef.nativeElement,
            children: this.composerRef.children('nonObjects')(),
            camera: this.#activeCamera(),
        }));
        effect((onCleanup) => {
            const {
                composerEntities: { effectComposer, normalPass, downSamplingPass },
                instance,
                children,
                camera,
            } = trigger();

            let effectPass: EffectPass;
            if (instance && children.length && effectComposer) {
                effectPass = new EffectPass(camera, ...children);
                effectPass.renderToScreen = true;
                effectComposer.addPass(effectPass);
                if (normalPass) normalPass.enabled = true;
                if (downSamplingPass) downSamplingPass.enabled = true;
            }

            onCleanup(() => {
                if (effectPass) effectComposer?.removePass(effectPass);
                if (normalPass) normalPass.enabled = false;
                if (downSamplingPass) downSamplingPass.enabled = false;
            });
        });
    }

    #setBeforeRender() {
        injectBeforeRender(
            ({ delta }) => {
                const enabled = this.get('enabled');
                const autoClear = this.get('autoClear');
                const gl = this.#store.get('gl');
                const { effectComposer } = this.#composerEntities();
                if (enabled && effectComposer) {
                    gl.autoClear = autoClear;
                    effectComposer.render(delta);
                }
            },
            { priority: this.get('enabled') ? this.get('renderPriority') : 0 }
        );
    }
}
