import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { extend, injectBeforeRender, injectNgtRef, NgtArgs, NgtSignalStore, type NgtRenderState } from 'angular-three';
import { StarFieldMaterial } from 'angular-three-soba/shaders';
import * as THREE from 'three';
import { BufferAttribute, BufferGeometry, Points } from 'three';

extend({ Points, BufferGeometry, BufferAttribute });

const genStar = (r: number) => {
    return new THREE.Vector3().setFromSpherical(
        new THREE.Spherical(r, Math.acos(1 - Math.random() * 2), Math.random() * 2 * Math.PI)
    );
};

export interface NgtsStarsState {
    radius: number;
    depth: number;
    count: number;
    factor: number;
    saturation: number;
    fade: boolean;
    speed: number;
}

@Component({
    selector: 'ngts-stars',
    standalone: true,
    template: `
        <ngt-points [ref]="starsRef">
            <ngt-buffer-geometry>
                <ngt-buffer-attribute attach="attributes.position" *args="[bufferAttributes().positions, 3]" />
                <ngt-buffer-attribute attach="attributes.color" *args="[bufferAttributes().colors, 3]" />
                <ngt-buffer-attribute attach="attributes.size" *args="[bufferAttributes().sizes, 1]" />
            </ngt-buffer-geometry>
            <ngt-primitive
                *args="[material]"
                attach="material"
                [blending]="AdditiveBlending"
                [depthWrite]="false"
                [transparent]="true"
                [vertexColors]="true"
            >
                <ngt-value attach="uniforms.fade.value" [rawValue]="fade()" />
            </ngt-primitive>
        </ngt-points>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsStars extends NgtSignalStore<NgtsStarsState> {
    readonly AdditiveBlending = THREE.AdditiveBlending;
    readonly material = new StarFieldMaterial();

    @Input() starsRef = injectNgtRef<Points>();

    @Input() set radius(radius: number) {
        this.set({ radius });
    }

    @Input() set depth(depth: number) {
        this.set({ depth });
    }

    @Input() set count(count: number) {
        this.set({ count });
    }

    @Input() set factor(factor: number) {
        this.set({ factor });
    }

    @Input() set saturation(saturation: number) {
        this.set({ saturation });
    }

    @Input('fade') set starsFade(fade: boolean) {
        this.set({ fade });
    }

    @Input() set speed(speed: number) {
        this.set({ speed });
    }

    readonly #count = this.select('count');
    readonly #depth = this.select('depth');
    readonly #factor = this.select('factor');
    readonly #radius = this.select('radius');
    readonly #saturation = this.select('saturation');

    readonly fade = this.select('fade');
    readonly bufferAttributes = computed(() => {
        const positions: number[] = [];
        const colors: number[] = [];
        const sizes = Array.from({ length: this.#count() }, () => (0.5 + 0.5 * Math.random()) * this.#factor());
        const color = new THREE.Color();
        let r = this.#radius() + this.#depth();
        const increment = this.#depth() / this.#count();
        for (let i = 0; i < this.#count(); i++) {
            r -= increment * Math.random();
            positions.push(...genStar(r).toArray());
            color.setHSL(i / this.#count(), this.#saturation(), 0.9);
            colors.push(color.r, color.g, color.b);
        }
        return {
            positions: new Float32Array(positions),
            colors: new Float32Array(colors),
            sizes: new Float32Array(sizes),
        };
    });

    constructor() {
        super({
            radius: 100,
            depth: 50,
            count: 5000,
            saturation: 0,
            factor: 4,
            fade: false,
            speed: 1,
        });
        injectBeforeRender(this.#onBeforeRender.bind(this));
    }

    #onBeforeRender({ clock }: NgtRenderState) {
        this.material.uniforms['time'].value = clock.getElapsedTime() * this.get('speed');
    }
}
