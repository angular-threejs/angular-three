import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { NgtpEffect } from 'angular-three-postprocessing';
import { DepthEffect } from 'postprocessing';

extend({ DepthEffect });

@Component({
    selector: 'ngtp-depth',
    standalone: true,
    template: `
        <ngt-depth-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
            <ng-content />
        </ngt-depth-effect>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpDepth extends NgtpEffect<DepthEffect> {}
