import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { NgtpEffect } from 'angular-three-postprocessing';
import { DotScreenEffect } from 'postprocessing';

extend({ DotScreenEffect });

@Component({
    selector: 'ngtp-dot-screen',
    standalone: true,
    template: `
        <ngt-dot-screen-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
            <ng-content />
        </ngt-dot-screen-effect>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpDotScreen extends NgtpEffect<DotScreenEffect> {}
