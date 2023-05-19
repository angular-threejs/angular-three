import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { NgtpEffect } from 'angular-three-postprocessing';
import { SepiaEffect } from 'postprocessing';

extend({ SepiaEffect });

@Component({
    selector: 'ngtp-sepia',
    standalone: true,
    template: `
        <ngt-sepia-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
            <ng-content />
        </ngt-sepia-effect>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpSepia extends NgtpEffect<SepiaEffect> {}
