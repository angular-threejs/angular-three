import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { NgtpEffect } from 'angular-three-postprocessing';
import { ShockWaveEffect } from 'postprocessing';

extend({ ShockWaveEffect });

@Component({
    selector: 'ngtp-noise',
    standalone: true,
    template: `
        <ngt-shock-wave-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
            <ng-content />
        </ngt-shock-wave-effect>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpShockWave extends NgtpEffect<ShockWaveEffect> {}
