import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Meta, moduleMetadata } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsStars } from 'angular-three-soba/staging';
import { makeStoryFunction, StorybookSetup } from '../setup-canvas';

@Component({
    standalone: true,
    template: `
        <ngt-mesh [rotation]="[Math.PI / 2, 0, 0]">
            <ngt-plane-geometry *args="[100, 100, 4, 4]" />
            <ngt-mesh-basic-material color="white" [wireframe]="true" />
        </ngt-mesh>
        <ngt-axes-helper />
        <ngts-stars />
    `,
    imports: [NgtsStars, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultStarsStory {
    readonly Math = Math;
}

export default {
    title: 'Staging/Stars',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

export const Default = makeStoryFunction(DefaultStarsStory);
