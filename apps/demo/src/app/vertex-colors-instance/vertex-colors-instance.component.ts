import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, ViewChild } from '@angular/core';
import { NgtArgs, NgtCanvas, NgtStore } from 'angular-three';
// @ts-expect-error no type def for nice-color-palettes
import niceColors from 'nice-color-palettes';
import * as THREE from 'three';
import { DemoOrbitControls } from '../ui-orbit-controls/orbit-controls.component';
const niceColor = niceColors[Math.floor(Math.random() * niceColors.length)];

@Component({
    selector: 'demo-colors-instances',
    standalone: true,
    template: `
        <ngt-instanced-mesh #instanced *args="[undefined, undefined, length]">
            <ngt-box-geometry *args="[0.15, 0.15, 0.15]">
                <ngt-instanced-buffer-attribute attach="attributes.color" *args="[colors, 3]" />
            </ngt-box-geometry>
            <ngt-mesh-lambert-material [vertexColors]="true" [toneMapped]="false" />
        </ngt-instanced-mesh>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ColorsInstances {
    readonly length = 125000;

    private readonly o = new THREE.Object3D();
    private readonly c = new THREE.Color();
    private readonly colorsArr = Array.from({ length: this.length }, () => niceColor[Math.floor(Math.random() * 5)]);

    readonly colors = Float32Array.from(
        Array.from({ length: this.length }, (_, index) =>
            this.c.set(this.colorsArr[index]).convertSRGBToLinear().toArray()
        ).flat()
    );

    @ViewChild('instanced') set instanced({ nativeElement }: ElementRef<THREE.InstancedMesh>) {
        let i = 0;
        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                for (let z = 0; z < 50; z++) {
                    const id = i++;
                    this.o.position.set(25 - x, 25 - y, 25 - z);
                    this.o.updateMatrix();
                    nativeElement.setMatrixAt(id, this.o.matrix);
                }
            }
        }
    }
}

@Component({
    standalone: true,
    template: `
        <ngt-ambient-light />
        <ngt-directional-light [intensity]="0.55" [position]="150" />
        <demo-colors-instances />
        <demo-orbit-controls [autoRotate]="true" />
    `,
    imports: [NgtArgs, ColorsInstances, DemoOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
    private readonly store = inject(NgtStore);
    readonly camera = this.store.get('camera');
    readonly glDom = this.store.get('gl', 'domElement');
}

@Component({
    standalone: true,
    template: ` <ngt-canvas [sceneGraph]="SceneGraph" [camera]="{ position: [0, 0, 1] }" /> `,
    imports: [NgtCanvas],
})
export default class DemoVertexColorsInstances {
    readonly SceneGraph = Scene;
}
