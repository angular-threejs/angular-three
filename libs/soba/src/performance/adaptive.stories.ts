import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Signal } from '@angular/core';
import { Meta, StoryFn, moduleMetadata } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsGLTFLoader } from 'angular-three-soba/loaders';
import { NgtsAdaptiveDpr, NgtsAdaptiveEvents } from 'angular-three-soba/performance';
import type { Material, Mesh } from 'three';
import type { GLTF } from 'three-stdlib/loaders/GLTFLoader';
import { StorybookSetup, makeRenderFunction } from '../setup-canvas';

interface ArcherGLTF extends GLTF {
    materials: { material_0: Material };
    nodes: Record<'mesh_0' | 'mesh_1' | 'mesh_2', Mesh>;
}

@Component({
    selector: 'Archer',
    standalone: true,
    template: `
        <ngt-group>
            <ngt-group [rotation]="[-Math.PI / 2, 0, 0]">
                <ngt-group [position]="[0, 0, 2]" *ngIf="archer() as archer">
                    <ngt-mesh
                        [castShadow]="true"
                        [receiveShadow]="true"
                        [material]="archer.materials.material_0"
                        [geometry]="archer.nodes.mesh_0.geometry"
                    />
                    <ngt-mesh
                        [castShadow]="true"
                        [receiveShadow]="true"
                        [material]="archer.materials.material_0"
                        [geometry]="archer.nodes.mesh_1.geometry"
                    />
                    <ngt-mesh
                        [castShadow]="true"
                        [receiveShadow]="true"
                        [geometry]="archer.nodes.mesh_2.geometry"
                        [material]="archer.materials.material_0"
                    />
                </ngt-group>
            </ngt-group>
        </ngt-group>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [NgIf],
})
class Archer {
    readonly Math = Math;
    readonly archer = injectNgtsGLTFLoader(() => 'soba/archer.glb') as Signal<ArcherGLTF>;
}

@Component({
    standalone: true,
    template: `
        <Archer />
        <ngt-directional-light [intensity]="0.2" [position]="[10, 10, 5]" [castShadow]="true">
            <ngt-value rawValue="-0.001" attach="shadow.bias" />
            <ngt-vector2 *args="[64, 64]" attach="shadow.mapSize" />
        </ngt-directional-light>
        <ngts-adaptive-dpr [pixelated]="true" />
        <ngts-adaptive-events />
        <ngts-orbit-controls [regress]="true" />
    `,
    imports: [NgtsAdaptiveDpr, NgtsAdaptiveEvents, NgtsOrbitControls, Archer, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultAdaptiveStory {}

export default {
    title: 'Performance/Adaptive',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

export const Default: StoryFn = makeRenderFunction(DefaultAdaptiveStory, {
    camera: { position: [0, 0, 30], fov: 50 },
    controls: false,
    lights: false,
    performance: { min: 0.2 },
});
