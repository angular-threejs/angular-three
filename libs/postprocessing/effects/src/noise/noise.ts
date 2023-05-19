import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { NgtpEffect } from 'angular-three-postprocessing';
import { BlendFunction, NoiseEffect } from 'postprocessing';

extend({ NoiseEffect });

@Component({
    selector: 'ngtp-noise',
    standalone: true,
    template: `
        <ngt-noise-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
            <ng-content />
        </ngt-noise-effect>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpNoise extends NgtpEffect<NoiseEffect> {
    override defaultBlendFunction = BlendFunction.COLOR_DODGE;
}
