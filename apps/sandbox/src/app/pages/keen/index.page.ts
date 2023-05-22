import { RouteMeta } from '@analogjs/router';
import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Signal } from '@angular/core';
import { NgtArgs, NgtBeforeRenderEvent, NgtCanvas } from 'angular-three';
import { NgtpEffectComposer } from 'angular-three-postprocessing';
import { NgtpBloom, NgtpDotScreen } from 'angular-three-postprocessing/effects';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsGLTFLoader } from 'angular-three-soba/loaders';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

export const routeMeta: RouteMeta = {
    title: 'Keen',
};

interface KeenGLTF extends GLTF {
    nodes: { mesh_0: THREE.Mesh };
    materials: { 'Scene_-_Root': THREE.MeshStandardMaterial };
}

@Component({
    standalone: true,
    templateUrl: 'scene.html',
    imports: [NgtpEffectComposer, NgtpBloom, NgtpDotScreen, NgIf, NgtArgs, NgtsOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class SceneGraph {
    readonly Math = Math;
    readonly keen = injectNgtsGLTFLoader(() => 'keen/scene.gltf') as Signal<KeenGLTF>;

    onBeforeRender({ object, state: { clock } }: NgtBeforeRenderEvent<THREE.Group>) {
        object.rotation.z = clock.elapsedTime;
    }
}

@Component({
    standalone: true,
    templateUrl: 'index.html',
    imports: [NgtCanvas],
})
export default class Keen {
    readonly scene = SceneGraph;
}
