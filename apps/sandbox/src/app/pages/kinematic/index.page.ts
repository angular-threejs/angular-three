import { RouteMeta } from '@analogjs/router';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, Input } from '@angular/core';
import { Triplet } from '@pmndrs/cannon-worker-api';
import { injectBeforeRender, NgtArgs, NgtCanvas, NgtSignalStore } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { injectBox, injectPlane, injectSphere } from 'angular-three-cannon/services';
import { NgtsStats } from 'angular-three-soba/performance';
// @ts-ignore
import niceColors from 'nice-color-palettes';
import * as THREE from 'three';

const niceColor = niceColors[Math.floor(Math.random() * niceColors.length)];

export const routeMeta: RouteMeta = {
    title: 'Kinematic Cube',
};

@Component({
    selector: 'kinematic-spheres',
    standalone: true,
    templateUrl: 'kinematic-spheres.html',
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Spheres extends NgtSignalStore<{ count: number }> {
    @Input() set count(count: number) {
        this.set({ count });
    }

    readonly sphereCount = this.select('count');
    readonly colors = computed(() => new Float32Array(this.sphereCount() * 3));

    readonly radius = 1;
    readonly sphereBody = injectSphere<THREE.InstancedMesh>((index) => ({
        args: [this.radius],
        mass: 1,
        position: [Math.random() - 0.5, Math.random() - 0.5, index * 2],
    }));

    constructor() {
        super({ count: 100 });
        effect(() => {
            const kinematicCount = this.sphereCount();
            const colors = this.colors();
            const color = new THREE.Color();
            for (let i = 0; i < kinematicCount; i++) {
                color
                    .set(niceColor[Math.floor(Math.random() * 5)])
                    .convertSRGBToLinear()
                    .toArray(colors, i * 3);
            }
        });
    }
}

@Component({
    selector: 'kinematic-box',
    standalone: true,
    templateUrl: 'kinematic-box.html',
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Box {
    readonly boxSize = [4, 4, 4] as Triplet;
    readonly boxBody = injectBox<THREE.Mesh>(() => ({
        mass: 1,
        type: 'Kinematic',
        args: this.boxSize,
    }));

    constructor() {
        injectBeforeRender(({ clock }) => {
            const t = clock.getElapsedTime();
            this.boxBody.api().position.set(Math.sin(t * 2) * 5, Math.cos(t * 2) * 5, 3);
            this.boxBody.api().rotation.set(Math.sin(t * 6), Math.cos(t * 6), 0);
        });
    }
}

@Component({
    selector: 'kinematic-plane',
    standalone: true,
    templateUrl: 'kinematic-plane.html',
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Plane extends NgtSignalStore<{ color: THREE.ColorRepresentation; position: Triplet; rotation: Triplet }> {
    @Input({ required: true }) set color(color: THREE.ColorRepresentation) {
        this.set({ color });
    }

    @Input() set position(position: Triplet) {
        this.set({ position });
    }

    @Input() set rotation(rotation: Triplet) {
        this.set({ rotation });
    }

    readonly planeColor = this.select('color');
    readonly #position = this.select('position');
    readonly #rotation = this.select('rotation');

    readonly args = [1000, 1000];
    readonly planeBody = injectPlane<THREE.Mesh>(() => ({
        args: this.args,
        position: this.#position(),
        rotation: this.#rotation(),
    }));

    constructor() {
        super({ position: [0, 0, 0], rotation: [0, 0, 0] });
    }
}

@Component({
    standalone: true,
    templateUrl: 'scene.html',
    imports: [NgtArgs, NgtcPhysics, Plane, Box, Spheres],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class SceneGraph {
    readonly niceColor = niceColor;
}

@Component({
    standalone: true,
    templateUrl: 'index.html',
    imports: [NgtCanvas, NgtsStats],
})
export default class KinematicCube {
    readonly scene = SceneGraph;
}
