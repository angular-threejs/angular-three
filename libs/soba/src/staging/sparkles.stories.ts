import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Input, signal } from '@angular/core';
import { Meta, moduleMetadata } from '@storybook/angular';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsSparkles } from 'angular-three-soba/staging';
import { makeStoryObject, number, StorybookSetup } from '../setup-canvas';

@Component({
    standalone: true,
    template: `
        <ngts-sparkles
            color="orange"
            [size]="sizes()"
            [count]="sparklesAmount()"
            [opacity]="opacity"
            [speed]="speed"
            [noise]="noise"
        />
        <ngts-orbit-controls />
        <ngt-axes-helper />
        <ngts-perspective-camera [position]="[2, 2, 2]" [makeDefault]="true" />
    `,
    imports: [NgtsSparkles, NgtsPerspectiveCamera, NgtsOrbitControls],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultSparklesStory {
    @Input() opacity = 1;
    @Input() speed = 0.3;
    @Input() noise = 1;

    readonly #random = signal(true);
    @Input() set random(random: boolean) {
        this.#random.set(random);
    }

    readonly #size = signal(5);
    @Input() set size(size: number) {
        this.#size.set(size);
    }

    readonly #amount = signal(100);
    @Input() set amount(amount: number) {
        this.#amount.set(amount);
    }

    readonly sparklesAmount = this.#amount.asReadonly();
    readonly sizes = computed(() => {
        if (this.#random())
            return new Float32Array(Array.from({ length: this.#amount() }, () => Math.random() * this.#size()));
        return this.#size();
    });
}

export default {
    title: 'Staging/Sparkles',
    decorators: [moduleMetadata({ imports: [StorybookSetup] })],
} as Meta;

export const Default = makeStoryObject(DefaultSparklesStory, {
    canvasOptions: { camera: { position: [1, 1, 1] }, controls: false },
    argsOptions: {
        random: true,
        amount: number(100, { range: true, max: 500, step: 1 }),
        noise: number(1, { range: true, min: 0, max: 1, step: 0.01 }),
        size: number(5, { range: true, min: 0, max: 10, step: 1 }),
        speed: number(0.3, { range: true, min: 0, max: 20, step: 0.1 }),
        opacity: number(1, { range: true, min: 0, max: 1, step: 0.01 }),
    },
});
