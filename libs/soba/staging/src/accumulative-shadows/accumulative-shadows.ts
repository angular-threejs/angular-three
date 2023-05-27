import {
    CUSTOM_ELEMENTS_SCHEMA,
    Component,
    InjectionToken,
    Input,
    Signal,
    computed,
    effect,
    inject,
    untracked,
} from '@angular/core';
import {
    NgtSignalStore,
    NgtStore,
    extend,
    getLocalState,
    injectBeforeRender,
    injectNgtRef,
    requestAnimationFrameInInjectionContext,
    type NgtGroup,
} from 'angular-three';
import { SoftShadowMaterial, SoftShadowMaterialInputs } from 'angular-three-soba/shaders';
import { Group, Mesh, PlaneGeometry } from 'three';
import { ProgressiveLightMap } from './progressive-light-map';

extend({ SoftShadowMaterial, Group, Mesh, PlaneGeometry });

export interface NgtsAccumulativeShadowsState {
    /** How many frames it can render, more yields cleaner results but takes more time, 40 */
    frames: number;
    /** If frames === Infinity blend controls the refresh ratio, 100 */
    blend: number;
    /** Can limit the amount of frames rendered if frames === Infinity, usually to get some performance back once a movable scene has settled, Infinity */
    limit: number;
    /** Scale of the plane,  */
    scale: number;
    /** Temporal accumulates shadows over time which is more performant but has a visual regression over instant results, false  */
    temporal: boolean;
    /** Opacity of the plane, 1 */
    opacity: number;
    /** Discards alpha pixels, 0.65 */
    alphaTest: number;
    /** Shadow color, black */
    color: string;
    /** Colorblend, how much colors turn to black, 0 is black, 2 */
    colorBlend: number;
    /** Buffer resolution, 1024 */
    resolution: number;
    /** Texture tonemapping */
    toneMapped: boolean;
}

export type NgtsAccumulativeShadowsLightApi = { update: () => void };

export interface NgtsAccumulativeShadowsApi {
    lights: Map<string, Signal<NgtsAccumulativeShadowsLightApi>>;
    temporal: boolean;
    frames: number;
    blend: number;
    count: number;
    getMesh: () => THREE.Mesh<THREE.PlaneGeometry, SoftShadowMaterialInputs & THREE.ShaderMaterial>;
    reset: () => void;
    update: (frames?: number) => void;
}

export const NGTS_ACCUMULATIVE_SHADOWS_API = new InjectionToken<Signal<NgtsAccumulativeShadowsApi>>(
    'NgtsAccumulativeShadows API'
);

declare global {
    interface HTMLElementTagNameMap {
        'ngts-accumulative-shadows': NgtGroup & NgtsAccumulativeShadowsState;
    }
}

@Component({
    selector: 'ngts-accumulative-shadows',
    standalone: true,
    template: `
        <ngt-group ngtCompound>
            <ngt-group [ref]="accumulativeShadowsRef" [traverse]="nullTraverse">
                <ng-content />
            </ngt-group>
            <ngt-mesh
                [ref]="meshRef"
                [receiveShadow]="true"
                [scale]="accumulativeShadowsScale()"
                [rotation]="[-Math.PI / 2, 0, 0]"
            >
                <ngt-plane-geometry />
                <ngt-soft-shadow-material
                    [transparent]="true"
                    [depthWrite]="false"
                    [toneMapped]="accumulativeShadowsToneMapped()"
                    [color]="accumulativeShadowsColor()"
                    [blend]="accumulativeShadowsColorBlend()"
                    [map]="pLM().progressiveLightMap2.texture"
                />
            </ngt-mesh>
        </ngt-group>
    `,
    providers: [
        {
            provide: NGTS_ACCUMULATIVE_SHADOWS_API,
            useFactory: (shadows: NgtsAccumulativeShadows) => shadows.api,
            deps: [NgtsAccumulativeShadows],
        },
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsAccumulativeShadows extends NgtSignalStore<NgtsAccumulativeShadowsState> {
    readonly nullTraverse = () => null;
    readonly Math = Math;

    /** How many frames it can render, more yields cleaner results but takes more time, 40 */
    @Input() set frames(frames: number) {
        this.set({ frames });
    }

    /** If frames === Infinity blend controls the refresh ratio, 100 */
    @Input() set blend(blend: number) {
        this.set({ blend });
    }

    /** Can limit the amount of frames rendered if frames === Infinity, usually to get some performance back once a movable scene has settled, Infinity */
    @Input() set limit(limit: number) {
        this.set({ limit });
    }

    /** Scale of the plane,  */
    @Input() set scale(scale: number) {
        this.set({ scale });
    }

    /** Temporal accumulates shadows over time which is more performant but has a visual regression over instant results, false  */
    @Input() set temporal(temporal: boolean) {
        this.set({ temporal });
    }

    /** Opacity of the plane, 1 */
    @Input() set opacity(opacity: number) {
        this.set({ opacity });
    }

    /** Discards alpha pixels, 0.65 */
    @Input() set alphaTest(alphaTest: number) {
        this.set({ alphaTest });
    }

    /** Shadow color, black */
    @Input() set color(color: string) {
        this.set({ color });
    }

    /** Colorblend, how much colors turn to black, 0 is black, 2 */
    @Input() set colorBlend(colorBlend: number) {
        this.set({ colorBlend });
    }

    /** Buffer resolution, 1024 */
    @Input() set resolution(resolution: number) {
        this.set({ resolution });
    }

    /** Texture tonemapping */
    @Input() set toneMapped(toneMapped: boolean) {
        this.set({ toneMapped });
    }

    readonly #store = inject(NgtStore);
    readonly #gl = this.#store.select('gl');
    readonly #scene = this.#store.select('scene');
    readonly #camera = this.#store.select('camera');

    readonly #resolution = this.select('resolution');
    readonly #temporal = this.select('temporal');
    readonly #blend = this.select('blend');
    readonly #frames = this.select('frames');
    readonly #opacity = this.select('opacity');
    readonly #alphaTest = this.select('alphaTest');

    readonly accumulativeShadowsScale = this.select('scale');
    readonly accumulativeShadowsToneMapped = this.select('toneMapped');
    readonly accumulativeShadowsColor = this.select('color');
    readonly accumulativeShadowsColorBlend = this.select('colorBlend');

    readonly meshRef = injectNgtRef<THREE.Mesh<THREE.PlaneGeometry, SoftShadowMaterialInputs & THREE.ShaderMaterial>>();
    readonly accumulativeShadowsRef = injectNgtRef<THREE.Group>();

    readonly pLM = computed(
        () => new ProgressiveLightMap(untracked(this.#gl), untracked(this.#scene), this.#resolution())
    );

    readonly api = computed(() => {
        const pLM = this.pLM();
        const alphaTest = this.#alphaTest();
        const opacity = this.#opacity();
        const camera = this.#camera();

        return {
            lights: new Map(),
            temporal: this.#temporal(),
            frames: Math.max(2, this.#frames()),
            blend: Math.max(2, this.#frames() === Infinity ? this.#blend() : this.#frames()),
            count: 0,
            getMesh: () => this.meshRef.nativeElement,
            reset: () => {
                if (!this.meshRef.nativeElement) return;
                // Clear buffers, reset opacities, set frame count to 0
                pLM.clear();
                const material = this.meshRef.nativeElement.material;
                material.opacity = 0;
                material.alphaTest = 0;
                this.api().count = 0;
            },
            update: (frames = 1) => {
                if (!this.meshRef.nativeElement) return;
                // Adapt the opacity-blend ratio to the number of frames
                const material = this.meshRef.nativeElement.material;
                if (!this.api().temporal) {
                    material.opacity = opacity;
                    material.alphaTest = alphaTest;
                } else {
                    material.opacity = Math.min(opacity, material.opacity + opacity / this.api().blend);
                    material.alphaTest = Math.min(alphaTest, material.alphaTest + alphaTest / this.api().blend);
                }

                // Switch accumulative lights on
                this.accumulativeShadowsRef.nativeElement.visible = true;
                // Collect scene lights and meshes
                pLM.prepare();

                // Update the lightmap and the accumulative lights
                for (let i = 0; i < frames; i++) {
                    this.api().lights.forEach((light) => light().update());
                    pLM.update(camera, this.api().blend);
                }
                // Switch lights off
                this.accumulativeShadowsRef.nativeElement.visible = false;
                // Restore lights and meshes
                pLM.finish();
            },
        };
    });

    constructor() {
        super({
            frames: 40,
            limit: Infinity,
            blend: 20,
            scale: 10,
            opacity: 1,
            alphaTest: 0.75,
            color: 'black',
            colorBlend: 2,
            resolution: 1024,
            toneMapped: true,
            temporal: false,
        });
        requestAnimationFrameInInjectionContext(() => {
            this.#configure();
            this.#resetAndUpdate();
        });
        injectBeforeRender(this.#onBeforeRender.bind(this));
    }

    #onBeforeRender() {
        const invalidate = this.#store.get('invalidate');
        const limit = this.get('limit');
        const api = this.api();
        if ((api.temporal || api.frames === Infinity) && api.count < api.frames && api.count < limit) {
            invalidate();
            api.update();
            api.count++;
        }
    }

    #configure() {
        const trigger = computed(() => ({ pLM: this.pLM(), mesh: this.meshRef.nativeElement }));
        effect(() => {
            const { pLM, mesh } = trigger();
            if (!mesh) return;
            pLM.configure(mesh);
        });
    }

    #resetAndUpdate() {
        const trigger = computed(() => ({
            state: this.state(),
            objects: getLocalState(this.#store.get('scene')).objects(),
            mesh: this.meshRef.nativeElement,
        }));

        effect(() => {
            const { mesh } = trigger();
            if (!mesh) return;
            const api = untracked(this.api);
            // Reset internals, buffers, ...
            api.reset();
            // Update lightmap
            if (!api.temporal && api.frames !== Infinity) api.update(api.blend);
        });
    }
}
