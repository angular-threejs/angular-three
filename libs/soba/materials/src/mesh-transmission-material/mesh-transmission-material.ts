import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import {
    extend,
    getLocalState,
    injectBeforeRender,
    injectNgtRef,
    NgtAnyRecord,
    NgtArgs,
    NgtSignalStore,
} from 'angular-three';
import { injectNgtsFBO } from 'angular-three-soba/misc';
import { DiscardMaterial, MeshTransmissionMaterial } from 'angular-three-soba/shaders';
import * as THREE from 'three';

extend({ MeshTransmissionMaterial });

export interface NgtsMeshTranmissionMaterialState {
    /** transmissionSampler, you can use the threejs transmission sampler texture that is
     *  generated once for all transmissive materials. The upside is that it can be faster if you
     *  use multiple MeshPhysical and Transmission materials, the downside is that transmissive materials
     *  using this can't see other transparent or transmissive objects, default: false */
    transmissionSampler: boolean;
    /** Render the backside of the material (more cost, better results), default: false */
    backside: boolean;
    /** Backside thickness (when backside is true), default: 0 */
    backsideThickness: number;
    /** Resolution of the local buffer, default: undefined (fullscreen) */
    resolution: number;
    /** Resolution of the local buffer for backfaces, default: undefined (fullscreen) */
    backsideResolution: number;
    /** Refraction samples, default: 10 */
    samples: number;
    /** Buffer scene background (can be a texture, a cubetexture or a color), default: null */
    background: THREE.Texture | THREE.Color;
    /* Transmission, default: 1 */
    transmission: number;
    /* Thickness (refraction), default: 0 */
    thickness: number;
    /* Roughness (blur), default: 0 */
    roughness: number;
    /* Chromatic aberration, default: 0.03 */
    chromaticAberration: number;
    /* Anisotropy, default: 0.1 */
    anisotropy: number;
    /* Distortion, default: 0 */
    distortion: number;
    /* Distortion scale, default: 0.5 */
    distortionScale: number;
    /* Temporal distortion (speed of movement), default: 0.0 */
    temporalDistortion: number;
    /** The scene rendered into a texture (use it to share a texture between materials), default: null  */
    buffer: THREE.Texture | null;
    /** Internals */
    time: number;
}

@Component({
    selector: 'ngts-mesh-transmission-material',
    standalone: true,
    template: `
        <ngt-mesh-transmission-material
            ngtCompound
            *args="[transmissionSamples(), transmissionTransmissionSampler()]"
            [ref]="materialRef"
            [buffer]="transmissionBuffer() || fboMainRef()?.texture"
            [_transmission]="transmissionTransmission()"
            [transmission]="transmissionTransmissionSampler() ? transmissionTransmission() : 0"
            [thickness]="transmissionThickness()"
            [side]="side"
            [anisotropy]="transmissionAnisotropy()"
            [roughness]="transmissionRoughness()"
            [chromaticAberration]="transmissionChromaticAberration()"
            [distortion]="transmissionDistortion()"
            [distortionScale]="transmissionDistortionScale()"
            [temporalDistortion]="transmissionTemporalDistortion()"
            [time]="transmissionTime()"
        />
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshTranmissionMaterial extends NgtSignalStore<NgtsMeshTranmissionMaterialState> {
    @Input() materialRef = injectNgtRef<MeshTransmissionMaterial & { time: number; buffer?: THREE.Texture }>();
    /** transmissionSampler, you can use the threejs transmission sampler texture that is
     *  generated once for all transmissive materials. The upside is that it can be faster if you
     *  use multiple MeshPhysical and Transmission materials, the downside is that transmissive materials
     *  using this can't see other transparent or transmissive objects, default: false */
    @Input() set transmissionSampler(transmissionSampler: boolean) {
        this.set({ transmissionSampler });
    }
    /** Render the backside of the material (more cost, better results), default: false */
    @Input() set backside(backside: boolean) {
        this.set({ backside });
    }
    /** Backside thickness (when backside is true), default: 0 */
    @Input() set backsideThickness(backsideThickness: number) {
        this.set({ backsideThickness });
    }
    /** Resolution of the local buffer, default: undefined (fullscreen) */
    @Input() set resolution(resolution: number) {
        this.set({ resolution });
    }
    /** Resolution of the local buffer for backfaces, default: undefined (fullscreen) */
    @Input() set backsideResolution(backsideResolution: number) {
        this.set({ backsideResolution });
    }
    /** Refraction samples, default: 10 */
    @Input() set samples(samples: number) {
        this.set({ samples });
    }
    /** Buffer scene background (can be a texture, a cubetexture or a color), default: null */
    @Input() set background(background: THREE.Texture | THREE.Color) {
        this.set({ background });
    }
    /* Transmission, default: 1 */
    @Input() set transmission(transmission: number) {
        this.set({ transmission });
    }
    /* Thickness (refraction), default: 0 */
    @Input() set thickness(thickness: number) {
        this.set({ thickness });
    }
    /* Roughness (blur), default: 0 */
    @Input() set roughness(roughness: number) {
        this.set({ roughness });
    }
    /* Chromatic aberration, default: 0.03 */
    @Input() set chromaticAberration(chromaticAberration: number) {
        this.set({ chromaticAberration });
    }
    /* Anisotropy, default: 0.1 */
    @Input() set anisotropy(anisotropy: number) {
        this.set({ anisotropy });
    }
    /* Distortion, default: 0 */
    @Input() set distortion(distortion: number) {
        this.set({ distortion });
    }
    /* Distortion scale, default: 0.5 */
    @Input() set distortionScale(distortionScale: number) {
        this.set({ distortionScale });
    }
    /* Temporal distortion (speed of movement), default: 0.0 */
    @Input() set temporalDistortion(temporalDistortion: number) {
        this.set({ temporalDistortion });
    }
    /** The scene rendered into a texture (use it to share a texture between materials), default: null  */
    @Input() set buffer(buffer: THREE.Texture) {
        this.set({ buffer });
    }
    /** Internals */
    @Input() set time(time: number) {
        this.set({ time });
    }

    readonly transmissionTransmissionSampler = this.select('transmissionSampler');
    readonly transmissionBackside = this.select('backside');
    readonly transmissionTransmission = this.select('transmission');
    readonly transmissionThickness = this.select('thickness');
    readonly transmissionBacksideThickness = this.select('backsideThickness');
    readonly transmissionSamples = this.select('samples');
    readonly transmissionRoughness = this.select('roughness');
    readonly transmissionAnisotropy = this.select('anisotropy');
    readonly transmissionChromaticAberration = this.select('chromaticAberration');
    readonly transmissionDistortion = this.select('distortion');
    readonly transmissionDistortionScale = this.select('distortionScale');
    readonly transmissionTemporalDistortion = this.select('temporalDistortion');
    readonly transmissionBuffer = this.select('buffer');
    readonly transmissionTime = this.select('time');

    readonly #discardMaterial = new DiscardMaterial();

    readonly #backsideResolution = this.select('backsideResolution');
    readonly #resolution = this.select('resolution');

    readonly #fboBackSettings = computed(() => ({ width: this.#backsideResolution() || this.#resolution() }));
    readonly #fboMainSettings = computed(() => ({ width: this.#resolution() }));

    readonly fboBackRef = injectNgtsFBO(this.#fboBackSettings);
    readonly fboMainRef = injectNgtsFBO(this.#fboMainSettings);

    readonly side = THREE.FrontSide;

    constructor() {
        super({
            transmissionSampler: false,
            backside: false,
            transmission: 1,
            thickness: 0,
            backsideThickness: 0,
            samples: 10,
            roughness: 0,
            anisotropy: 0.1,
            chromaticAberration: 0.03,
            distortion: 0,
            distortionScale: 0.5,
            temporalDistortion: 0.0,
            buffer: null,
        });
        let oldBg: THREE.Scene['background'];
        let oldTone: THREE.WebGLRenderer['toneMapping'];
        let parent: THREE.Object3D;

        injectBeforeRender((state) => {
            if (!this.materialRef.nativeElement) return;

            const { transmissionSampler, background, backside, backsideThickness, thickness } = this.get();

            this.materialRef.nativeElement.time = state.clock.getElapsedTime();
            // Render only if the buffer matches the built-in and no transmission sampler is set
            if (this.materialRef.nativeElement.buffer === this.fboMainRef().texture && !transmissionSampler) {
                parent = getLocalState(this.materialRef.nativeElement).parent?.value as THREE.Object3D;
                if (parent) {
                    // Save defaults
                    oldTone = state.gl.toneMapping;
                    oldBg = state.scene.background;

                    // Switch off tonemapping lest it double tone maps
                    // Save the current background and set the HDR as the new BG
                    // Use discardmaterial, the parent will be invisible, but it's shadows will still be cast
                    state.gl.toneMapping = THREE.NoToneMapping;
                    if (background) state.scene.background = background;
                    (parent as NgtAnyRecord)['material'] = this.#discardMaterial;

                    if (backside) {
                        // Render into the backside buffer
                        state.gl.setRenderTarget(this.fboBackRef());
                        state.gl.render(state.scene, state.camera);
                        // And now prepare the material for the main render using the backside buffer
                        (parent as NgtAnyRecord)['material'] = this.materialRef.nativeElement;
                        (parent as NgtAnyRecord)['material'].buffer = this.fboBackRef().texture;
                        (parent as NgtAnyRecord)['material'].thickness = backsideThickness;
                        (parent as NgtAnyRecord)['material'].side = THREE.BackSide;
                    }

                    // Render into the main buffer
                    state.gl.setRenderTarget(this.fboMainRef());
                    state.gl.render(state.scene, state.camera);

                    (parent as NgtAnyRecord)['material'].thickness = thickness;
                    (parent as NgtAnyRecord)['material'].side = this.side;
                    (parent as NgtAnyRecord)['material'].buffer = this.fboMainRef().texture;

                    // Set old state back
                    state.scene.background = oldBg;
                    state.gl.setRenderTarget(null);
                    (parent as NgtAnyRecord)['material'] = this.materialRef.nativeElement;
                    state.gl.toneMapping = oldTone;
                }
            }
        });
    }
}
