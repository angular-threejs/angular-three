import { RouteMeta } from '@analogjs/router';
import { NgFor } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Input, Signal } from '@angular/core';
import { NgtArgs, NgtCanvas } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsGLTFLoader, NgtsLoader } from 'angular-three-soba/loaders';
import { NgtsBakeShadows } from 'angular-three-soba/misc';
import { NgtsDetailed, NgtsStats } from 'angular-three-soba/performance';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import { GLTF } from 'three-stdlib';

export const routeMeta: RouteMeta = {
    title: 'Level of Details',
};

const positions = [...Array(800)].map(() => ({
    position: [40 - Math.random() * 80, 40 - Math.random() * 80, 40 - Math.random() * 80],
    rotation: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
})) as Array<{ position: [number, number, number]; rotation: [number, number, number] }>;

interface BustGLTF extends GLTF {
    nodes: { Mesh_0001: THREE.Mesh };
    materials: { default: THREE.MeshStandardMaterial };
}

@Component({
    selector: 'lod-bust',
    standalone: true,
    templateUrl: 'lod-bust.html',
    imports: [NgtsDetailed, NgFor, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class LodBust {
    @Input() position: [number, number, number] = [0, 0, 0];
    @Input() rotation: [number, number, number] = [0, 0, 0];

    readonly #gltfs = injectNgtsGLTFLoader(() => [
        'bust-1-d.glb',
        'bust-2-d.glb',
        'bust-3-d.glb',
        'bust-4-d.glb',
        'bust-5-d.glb',
    ]) as Signal<BustGLTF[]>;
    readonly levels = computed(() => this.#gltfs() || []);
}

@Component({
    standalone: true,
    templateUrl: 'scene.html',
    imports: [LodBust, NgFor, NgtsOrbitControls, NgtsEnvironment, NgtsBakeShadows],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class SceneGraph {
    readonly positions = positions;
}

@Component({
    standalone: true,
    templateUrl: 'index.html',
    imports: [NgtCanvas, NgtsStats, NgtsLoader],
})
export default class LevelOfDetails {
    readonly scene = SceneGraph;
}
