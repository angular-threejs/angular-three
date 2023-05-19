import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { NgtpEffect } from 'angular-three-postprocessing';
import { BlendFunction, TiltShiftEffect } from 'postprocessing';

extend({ TiltShiftEffect });

@Component({
    selector: 'ngtp-tilt-shift',
    standalone: true,
    template: `
        <ngt-tilt-shift-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
            <ng-content />
        </ngt-tilt-shift-effect>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpTiltShift extends NgtpEffect<TiltShiftEffect> {
    override defaultBlendFunction = BlendFunction.ADD;
}
