import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { Meta, moduleMetadata } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { ngtsEnvironmentPresetsObj, NgtsStage } from 'angular-three-soba/staging';
import { makeStoryObject, number, select, StorybookSetup } from '../setup-canvas';

enum presets {
    rembrant = 'rembrandt',
    portrait = 'portrait',
    upfront = 'upfront',
    soft = 'soft',
}

@Component({
    standalone: true,
    template: `
        <ngt-color attach="background" *args="['white']" />
        <ngts-stage [intensity]="intensity" [environment]="envPreset" [preset]="preset">
            <ngt-mesh>
                <ngt-sphere-geometry *args="[1, 64, 64]" />
                <ngt-mesh-standard-material roughness="0" color="royalblue" />
            </ngt-mesh>
        </ngts-stage>
    `,
    imports: [NgtsStage, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultStageStory {
    @Input() intensity = 1;
    @Input() envPreset = Object.keys(ngtsEnvironmentPresetsObj)[0];
    @Input() preset = Object.keys(presets)[0];
}

export default {
    title: 'Staging/Stage',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

export const Default = makeStoryObject(DefaultStageStory, {
    canvasOptions: { camera: { position: [0, 0, 3] } },
    argsOptions: {
        intensity: number(1),
        envPreset: select(Object.keys(ngtsEnvironmentPresetsObj)[0], {
            options: Object.keys(ngtsEnvironmentPresetsObj),
        }),
        preset: select(Object.keys(presets)[0], { options: Object.keys(presets) }),
    },
});
