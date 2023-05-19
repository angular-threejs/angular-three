import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { NgtpEffect } from 'angular-three-postprocessing';
import { BlendFunction, ScanlineEffect } from 'postprocessing';

extend({ ScanlineEffect });

@Component({
    selector: 'ngtp-scanline',
    standalone: true,
    template: `
        <ngt-scanline-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
            <ng-content />
        </ngt-scanline-effect>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpScanline extends NgtpEffect<ScanlineEffect> {
    override defaultBlendFunction = BlendFunction.OVERLAY;
}
