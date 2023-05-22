import { CUSTOM_ELEMENTS_SCHEMA, Component, computed, inject } from '@angular/core';
import { NgtArgs, NgtCanvas, NgtStore } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsGLTFLoader } from 'angular-three-soba/loaders';
import { injectNgtsAnimations } from 'angular-three-soba/misc';
import { NgtsStats } from 'angular-three-soba/performance';
import * as THREE from 'three';
import { RoomEnvironment } from 'three-stdlib';

@Component({
    standalone: true,
    templateUrl: 'scene.html',
    imports: [NgtArgs, NgtsOrbitControls, NgtsStats],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class SceneGraph {
    readonly #gl = inject(NgtStore).get('gl');
    readonly #pmremGenerator = new THREE.PMREMGenerator(this.#gl);

    readonly statsDom = this.#gl.domElement.parentElement as HTMLElement;
    readonly texture = this.#pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    readonly #gltf = injectNgtsGLTFLoader(() => 'LittlestTokyo.glb');

    readonly model = computed(() => this.#gltf()?.scene || null);
    readonly animations = injectNgtsAnimations(() => this.#gltf()?.animations || []);
}

@Component({
    standalone: true,
    templateUrl: 'index.html',
    imports: [NgtCanvas],
})
export default class AnimationKeyframes {
    readonly scene = SceneGraph;
}
