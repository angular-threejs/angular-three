import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { extend, NgtArgs } from 'angular-three';
import { GroundProjectedEnv } from 'three-stdlib';
import { NgtsEnvironmentInput } from './environment-input';
import { NgtsEnvironmentMap } from './environment-map';
import { injectNgtsEnvironment } from './utils';

extend({ GroundProjectedEnv });

@Component({
    selector: 'ngts-environment-ground',
    standalone: true,
    template: `
        <ngts-environment-map [map]="texture()" [background]="environmentInput.environmentBackground()" />
        <ngt-ground-projected-env *args="groundArgs()" [scale]="scale()" [height]="height()" [radius]="radius()" />
    `,
    imports: [NgtsEnvironmentMap, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsEnvironmentGround {
    protected readonly environmentInput = inject(NgtsEnvironmentInput);
    readonly #defaultTexture = injectNgtsEnvironment(this.environmentInput.environmentParams);

    readonly texture = computed(() => {
        const defaultTexture = this.#defaultTexture.nativeElement;
        return this.environmentInput.environmentMap() || defaultTexture;
    });

    readonly groundArgs = computed(() => (this.texture() ? [this.texture()] : []));
    readonly height = computed(() => (this.environmentInput.environmentGround() as any)?.height);
    readonly radius = computed(() => (this.environmentInput.environmentGround() as any)?.radius);
    readonly scale = computed(() => (this.environmentInput.environmentGround() as any)?.scale ?? 1000);
}
