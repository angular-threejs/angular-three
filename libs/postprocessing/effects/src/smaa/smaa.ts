import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { NgtpEffect } from 'angular-three-postprocessing';
import { SMAAEffect } from 'postprocessing';

extend({ SMAAEffect });

@Component({
    selector: 'ngtp-SMAA',
    standalone: true,
    template: `
        <ngt-SMAA-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
            <ng-content />
        </ngt-SMAA-effect>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpSMAA extends NgtpEffect<SMAAEffect> {}
