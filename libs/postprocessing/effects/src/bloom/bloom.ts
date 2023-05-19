import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { NgtpEffect } from 'angular-three-postprocessing';
import { BlendFunction, BloomEffect } from 'postprocessing';

extend({ BloomEffect });

@Component({
    selector: 'ngtp-bloom',
    standalone: true,
    template: `
        <ngt-bloom-effect ngtCompound *args="args()" [ref]="effectRef" [camera]="camera()">
            <ng-content />
        </ngt-bloom-effect>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpBloom extends NgtpEffect<BloomEffect> {
    override defaultBlendFunction = BlendFunction.ADD;
}
