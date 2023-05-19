import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { NgtpEffect } from 'angular-three-postprocessing';
import { BrightnessContrastEffect } from 'postprocessing';

extend({ BrightnessContrastEffect });

@Component({
    selector: 'ngtp-brightness-contrast',
    standalone: true,
    template: `
        <ngt-brightness-contrast-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
            <ng-content />
        </ngt-brightness-contrast-effect>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpBrightnessContrast extends NgtpEffect<BrightnessContrastEffect> {}
