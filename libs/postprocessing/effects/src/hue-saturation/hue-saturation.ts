import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { NgtpEffect } from 'angular-three-postprocessing';
import { HueSaturationEffect } from 'postprocessing';

extend({ HueSaturationEffect });

@Component({
    selector: 'ngtp-hue-saturation',
    standalone: true,
    template: `
        <ngt-hue-saturation-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
            <ng-content />
        </ngt-hue-saturation-effect>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpHueSaturation extends NgtpEffect<HueSaturationEffect> {}
