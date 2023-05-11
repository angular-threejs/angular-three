import { Directive, inject, Input, TemplateRef } from '@angular/core';
import * as THREE from 'three';

@Directive({ selector: 'ng-template[ngtsCameraContent]', standalone: true })
export class NgtsCameraContent {
    readonly template = inject(TemplateRef);
    @Input() ngtsCameraContent: true | '' = '';

    static ngTemplateContextGuard(
        _: NgtsCameraContent,
        ctx: unknown
    ): ctx is { fbo: THREE.WebGLRenderTarget; group?: THREE.Group } {
        return true;
    }
}
