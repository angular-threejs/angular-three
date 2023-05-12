import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Input, isSignal, Signal } from '@angular/core';
import {
    extend,
    injectBeforeRender,
    injectNgtRef,
    NgtArgs,
    NgtSignalStore,
    NgtStore,
    type NgtRenderState,
} from 'angular-three';
import { SparklesMaterial } from 'angular-three-soba/shaders';
import * as THREE from 'three';
import { BufferAttribute, BufferGeometry, Color, MathUtils, Points, Vector2, Vector3, Vector4 } from 'three';

extend({ SparklesMaterial, Points, BufferGeometry, BufferAttribute });

const isFloat32Array = (def: any): def is Float32Array => def && (def as Float32Array).constructor === Float32Array;
const expandColor = (v: THREE.Color) => [v.r, v.g, v.b];
const isVector = (v: any): v is THREE.Vector2 | THREE.Vector3 | THREE.Vector4 =>
    v instanceof Vector2 || v instanceof Vector3 || v instanceof Vector4;
const normalizeVector = (v: any): number[] => {
    if (Array.isArray(v)) return v;
    else if (isVector(v)) return v.toArray();
    return [v, v, v] as number[];
};

function usePropAsIsOrAsAttribute<T = any>(count: number, prop?: T | Float32Array, setDefault?: (v: T) => number) {
    if (prop !== undefined) {
        if (isFloat32Array(prop)) {
            return prop as Float32Array;
        } else {
            if (prop instanceof Color) {
                const a = Array.from({ length: count * 3 }, () => expandColor(prop)).flat();
                return Float32Array.from(a);
            } else if (isVector(prop) || Array.isArray(prop)) {
                const a = Array.from({ length: count * 3 }, () => normalizeVector(prop)).flat();
                return Float32Array.from(a);
            }
            return Float32Array.from({ length: count }, () => prop as unknown as number);
        }
    }
    return Float32Array.from({ length: count }, setDefault!);
}

export interface NgtsSparklesState {
    /** Number of particles (default: 100) */
    count: number;
    /** Speed of particles (default: 1) */
    speed: number | Float32Array;
    /** Opacity of particles (default: 1) */
    opacity: number | Float32Array;
    /** Color of particles (default: 100) */
    color?: THREE.ColorRepresentation | Float32Array;
    /** Size of particles (default: randomized between 0 and 1) */
    size?: number | Float32Array;
    /** The space the particles occupy (default: 1) */
    scale: number | [number, number, number] | THREE.Vector3;
    /** Movement factor (default: 1) */
    noise: number | [number, number, number] | THREE.Vector3 | Float32Array;
}

@Component({
    selector: 'ngts-sparkles',
    standalone: true,
    template: `
        <ngt-points ngtCompount [ref]="pointsRef">
            <ngt-buffer-geometry>
                <ngt-buffer-attribute *args="[positions(), 3]" attach="attributes.position" />
                <ngt-buffer-attribute *args="[sizes(), 1]" attach="attributes.size" />
                <ngt-buffer-attribute *args="[opacities(), 1]" attach="attributes.opacity" />
                <ngt-buffer-attribute *args="[speeds(), 1]" attach="attributes.speed" />
                <ngt-buffer-attribute *args="[colors(), 3]" attach="attributes.color" />
                <ngt-buffer-attribute *args="[noises(), 3]" attach="attributes.noise" />
            </ngt-buffer-geometry>
            <ngt-sparkles-material [ref]="materialRef" [transparent]="true" [depthWrite]="false" [pixelRatio]="dpr()" />
        </ngt-points>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSparkles extends NgtSignalStore<NgtsSparklesState> {
    @Input() pointsRef = injectNgtRef<Points>();

    /** Number of particles (default: 100) */
    @Input() set count(count: number) {
        this.set({ count });
    }

    /** Speed of particles (default: 1) */
    @Input() set speed(speed: number | Float32Array) {
        this.set({ speed });
    }

    /** Opacity of particles (default: 1) */
    @Input() set opacity(opacity: number | Float32Array) {
        this.set({ opacity });
    }

    /** Color of particles (default: 100) */
    @Input() set color(color: THREE.ColorRepresentation | Float32Array) {
        this.set({ color });
    }

    /** Size of particles (default: randomized between 0 and 1) */
    @Input() set size(size: number | Float32Array) {
        this.set({ size });
    }

    /** The space the particles occupy (default: 1) */
    @Input() set scale(scale: number | [number, number, number] | THREE.Vector3) {
        this.set({ scale });
    }

    /** Movement factor (default: 1) */
    @Input() set noise(noise: number | [number, number, number] | THREE.Vector3 | Float32Array) {
        this.set({ noise });
    }

    readonly #store = inject(NgtStore);

    readonly #count = this.select('count');
    readonly #scale = this.select('scale');
    readonly #color = this.select('color');

    readonly materialRef = injectNgtRef<InstanceType<typeof SparklesMaterial>>();

    readonly dpr = this.#store.select('viewport', 'dpr');
    readonly positions = computed(() =>
        Float32Array.from(
            Array.from({ length: this.#count() }, () =>
                normalizeVector(this.#scale()).map(MathUtils.randFloatSpread)
            ).flat()
        )
    );

    readonly sizes = this.#getComputed('size', this.#count, Math.random);
    readonly opacities = this.#getComputed('opacity', this.#count);
    readonly speeds = this.#getComputed('speed', this.#count);
    readonly noises = this.#getComputed('noise', () => this.#count() * 3);
    readonly colors = this.#getComputed(
        computed(() => {
            const color = this.#color();
            return !isFloat32Array(color) ? new THREE.Color(color) : color;
        }),
        () => (this.#color() === undefined ? this.#count() * 3 : this.#count()),
        () => 1
    );

    #getComputed<TKey extends keyof NgtsSparklesState>(
        nameOrComputed: TKey | Signal<NgtsSparklesState[TKey]>,
        count: () => number,
        setDefault?: (value: NgtsSparklesState[TKey]) => number
    ) {
        const value =
            typeof nameOrComputed !== 'string' && isSignal(nameOrComputed)
                ? nameOrComputed
                : this.select(nameOrComputed);
        return computed(() => usePropAsIsOrAsAttribute(count(), value(), setDefault));
    }

    constructor() {
        super({
            noise: 1,
            count: 100,
            speed: 1,
            opacity: 1,
            scale: 1,
        });
        injectBeforeRender(this.#onBeforeRender.bind(this));
    }

    #onBeforeRender({ clock }: NgtRenderState) {
        if (!this.materialRef.nativeElement) return;
        this.materialRef.nativeElement.uniforms['time'].value = clock.elapsedTime;
    }
}
