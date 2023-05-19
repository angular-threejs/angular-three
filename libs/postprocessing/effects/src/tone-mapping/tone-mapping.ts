import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { NgtpEffect } from 'angular-three-postprocessing';
import { ToneMappingEffect } from 'postprocessing';

extend({ ToneMappingEffect });

@Component({
    selector: 'ngtp-tone-mapping',
    standalone: true,
    template: `
        <ngt-tone-mapping-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
            <ng-content />
        </ngt-tone-mapping-effect>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpToneMapping extends NgtpEffect<ToneMappingEffect> {}
