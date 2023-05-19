import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { NgtpEffect } from 'angular-three-postprocessing';
import { ColorDepthEffect } from 'postprocessing';

extend({ ColorDepthEffect });

@Component({
    selector: 'ngtp-color-depth',
    standalone: true,
    template: `
        <ngt-color-depth-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
            <ng-content />
        </ngt-color-depth-effect>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpColorDepth extends NgtpEffect<ColorDepthEffect> {}
