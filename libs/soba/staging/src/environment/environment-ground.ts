import { Component, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
        <ngts-environment-map
            [background]="environmentBackground()"
            [blur]="environmentBlur()"
            [scene]="environmentScene()"
            [map]="texture()"
        />
        <ngt-ground-projected-env *args="groundArgs()" [scale]="scale()" [height]="height()" [radius]="radius()" />
    `,
    imports: [NgtsEnvironmentMap, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsEnvironmentGround extends NgtsEnvironmentInput {
    readonly #defaultTexture = injectNgtsEnvironment(this.environmentParams);

    readonly texture = computed(() => {
        const defaultTexture = this.#defaultTexture.nativeElement;
        return this.environmentMap() || defaultTexture;
    });

    readonly groundArgs = computed(() => (this.texture() ? [this.texture()] : []));
    readonly height = computed(() => (this.environmentGround() as any)?.height);
    readonly radius = computed(() => (this.environmentGround() as any)?.radius);
    readonly scale = computed(() => (this.environmentGround() as any)?.scale ?? 1000);
}
