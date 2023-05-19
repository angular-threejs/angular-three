import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { NgtpEffect } from 'angular-three-postprocessing';
import { VignetteEffect } from 'postprocessing';

extend({ VignetteEffect });

@Component({
    selector: 'ngtp-vignette',
    standalone: true,
    template: `
        <ngt-vignette-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
            <ng-content />
        </ngt-vignette-effect>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpVignette extends NgtpEffect<VignetteEffect> {}
