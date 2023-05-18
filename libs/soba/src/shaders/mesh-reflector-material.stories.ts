import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, Input } from '@angular/core';
import { Meta, moduleMetadata } from '@storybook/angular';
import { NgtArgs, NgtSignalStore } from 'angular-three';
import { injectNgtsTextureLoader } from 'angular-three-soba/loaders';
import { NgtsMeshReflectorMaterial } from 'angular-three-soba/materials';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import * as THREE from 'three';
import { makeStoryFunction, StorybookSetup } from '../setup-canvas';

interface State {
    blur: [number, number];
    depthScale: number;
    distortion: number;
    normalScale: number;
    reflectorOffset: number;
}

@Component({
    selector: 'default-scene',
    standalone: true,
    template: `
        <ngt-mesh [rotation]="[-Math.PI / 2, 0, Math.PI / 2]">
            <ngt-plane-geometry *args="[10, 10]" />
            <ngts-mesh-reflector-material
                color="#a0a0a0"
                [resolution]="1024"
                [mirror]="0.75"
                [mixBlur]="10"
                [mixStrength]="2"
                [blur]="sceneBlur() || [0, 0]"
                [minDepthThreshold]="0.8"
                [maxDepthThreshold]="1.2"
                [depthScale]="sceneDepthScale() || 0"
                [depthToBlurRatioBias]="0.2"
                [debug]="true"
                [distortion]="sceneDistortion() || 0"
                [distortionMap]="distortionMap()"
                [metalness]="0.5"
                [roughnessMap]="roughness()"
                [roughness]="1"
                [normalMap]="normal()"
                [normalScale]="normalScaleVector()"
                [reflectorOffset]="sceneReflectorOffset() || 0"
            />
        </ngt-mesh>
        <ngt-mesh [position]="[0, 1.6, -3]">
            <ngt-box-geometry *args="[2, 3, 0.2]" />
            <ngt-mesh-physical-material color="hotpink" />
        </ngt-mesh>
        <ngt-mesh [position]="[0, 1, 0]" (beforeRender)="onBeforeRender($event.object, $event.state.clock)">
            <ngt-torus-knot-geometry *args="[0.5, 0.2, 128, 32]" />
            <ngt-mesh-physical-material color="hotpink" />
        </ngt-mesh>
        <ngt-spot-light [position]="[10, 6, 10]" [penumbra]="1" [angle]="0.3" />
        <ngts-environment preset="city" />
    `,
    imports: [NgtsMeshReflectorMaterial, NgtsEnvironment, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Scene extends NgtSignalStore<State> {
    readonly Math = Math;

    @Input() set blur(blur: [number, number]) {
        this.set({ blur });
    }

    @Input() set depthScale(depthScale: number) {
        this.set({ depthScale });
    }

    @Input() set distortion(distortion: number) {
        this.set({ distortion });
    }

    @Input() set normalScale(normalScale: number) {
        this.set({ normalScale });
    }

    @Input() set reflectorOffset(reflectorOffset: number) {
        this.set({ reflectorOffset });
    }

    readonly roughness = injectNgtsTextureLoader(() => 'soba/roughness_floor.jpeg');
    readonly normal = injectNgtsTextureLoader(() => 'soba/NORM.jpg');
    readonly distortionMap = injectNgtsTextureLoader(() => 'soba/dist_map.jpeg');

    readonly sceneBlur = this.select('blur');
    readonly sceneReflectorOffset = this.select('reflectorOffset');
    readonly sceneDistortion = this.select('distortion');
    readonly sceneDepthScale = this.select('depthScale');

    readonly #normalScale = this.select('normalScale');

    readonly normalScaleVector = computed(() => new THREE.Vector2(this.#normalScale() || 0));

    constructor() {
        super();
        effect(() => {
            const distortionMap = this.distortionMap();
            if (!distortionMap) return;
            distortionMap.wrapS = distortionMap.wrapT = THREE.RepeatWrapping;
            distortionMap.repeat.set(4, 4);
        });
    }

    onBeforeRender(torus: THREE.Mesh, clock: THREE.Clock) {
        torus.position.y += Math.sin(clock.getElapsedTime()) / 25;
        torus.rotation.y = clock.getElapsedTime() / 2;
    }
}

@Component({
    standalone: true,
    template: ` <default-scene [reflectorOffset]="1" /> `,
    imports: [Scene],
})
class OffsetMeshReflectorMaterialStory {}

@Component({
    standalone: true,
    template: ` <default-scene [normalScale]="0.5" /> `,
    imports: [Scene],
})
class NormalMapMeshReflectorMaterialStory {}

@Component({
    standalone: true,
    template: ` <default-scene [distortion]="1" /> `,
    imports: [Scene],
})
class DistortionMeshReflectorMaterialStory {}

@Component({
    standalone: true,
    template: ` <default-scene [depthScale]="2" /> `,
    imports: [Scene],
})
class DepthMeshReflectorMaterialStory {}

@Component({
    standalone: true,
    template: ` <default-scene [blur]="[500, 500]" /> `,
    imports: [Scene],
})
class BlurMeshReflectorMaterialStory {}

@Component({
    standalone: true,
    template: ` <default-scene /> `,
    imports: [Scene],
})
class PlainMeshReflectorMaterialStory {}

@Component({
    standalone: true,
    template: ` <default-scene [blur]="[100, 500]" [depthScale]="2" [distortion]="0.3" [normalScale]="0.5" /> `,
    imports: [Scene],
})
class DefaultMeshReflectorMaterialStory {}

export default {
    title: 'Shaders/MeshReflectorMaterial',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

const canvasOptions = { camera: { fov: 20, position: [-6, 6, 15] } };

export const Default = makeStoryFunction(DefaultMeshReflectorMaterialStory, canvasOptions);
export const Plain = makeStoryFunction(PlainMeshReflectorMaterialStory, canvasOptions);
export const Blur = makeStoryFunction(BlurMeshReflectorMaterialStory, canvasOptions);
export const Depth = makeStoryFunction(DepthMeshReflectorMaterialStory, canvasOptions);
export const Distortion = makeStoryFunction(DistortionMeshReflectorMaterialStory, canvasOptions);
export const NormalMap = makeStoryFunction(NormalMapMeshReflectorMaterialStory, canvasOptions);
export const Offset = makeStoryFunction(OffsetMeshReflectorMaterialStory, canvasOptions);
