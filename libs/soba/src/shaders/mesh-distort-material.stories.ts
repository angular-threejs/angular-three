import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { Meta, moduleMetadata } from '@storybook/angular';
import { injectBeforeRender, injectNgtRef, NgtArgs } from 'angular-three';
import { NgtsMeshDistortMaterial } from 'angular-three-soba/materials';
import { MeshDistortMaterial, provideNgtsMeshDistortMaterialShader } from 'angular-three-soba/shaders';
import { makeStoryFunction, makeStoryObject, number, StorybookSetup } from '../setup-canvas';
// @ts-ignore
import distort from '../../shaders/assets/distort.vert.glsl';

@Component({
    standalone: true,
    template: `
        <ngt-mesh>
            <ngts-mesh-distort-material color="#f25042" [materialRef]="ref" />
            <ngt-icosahedron-geometry *args="[1, 4]" />
        </ngt-mesh>
    `,
    imports: [NgtsMeshDistortMaterial, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class RefMeshDistortMaterialStory {
    readonly ref = injectNgtRef<InstanceType<MeshDistortMaterial>>();

    constructor() {
        injectBeforeRender(({ clock }) => {
            if (this.ref.nativeElement) {
                this.ref.nativeElement.distort = Math.sin(clock.getElapsedTime());
            }
        });
    }
}

@Component({
    standalone: true,
    template: `
        <ngt-mesh>
            <ngts-mesh-distort-material color="#f25042" [speed]="speed" [distort]="distort" [radius]="radius" />
            <ngt-icosahedron-geometry *args="[1, 4]" />
        </ngt-mesh>
    `,
    imports: [NgtsMeshDistortMaterial, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultMeshDistortMaterialStory {
    @Input() speed = 1;
    @Input() distort = 0.6;
    @Input() radius = 1;
}

export default {
    title: 'Shaders/MeshDistortMaterial',
    decorators: [
        moduleMetadata({ imports: [StorybookSetup], providers: [provideNgtsMeshDistortMaterialShader(distort)] }),
    ],
} as Meta;

export const Default = makeStoryObject(DefaultMeshDistortMaterialStory, {
    argsOptions: {
        speed: number(1, { range: true, max: 10, step: 0.1 }),
        distort: number(0.6, { range: true, max: 1, step: 0.1 }),
        radius: number(1, { range: true, max: 1, step: 0.1 }),
    },
});

export const Ref = makeStoryFunction(RefMeshDistortMaterialStory);
