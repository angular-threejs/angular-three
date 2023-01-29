import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input } from '@angular/core';
import { NgtArgs, NgtStore } from 'angular-three';

@Component({
    selector: 'demo-orbit-controls',
    standalone: true,
    template: `
        <ngt-orbit-controls
            *args="[camera, glDom]"
            [enableDamping]="true"
            [enablePan]="enablePan"
            [autoRotate]="autoRotate"
            [target]="target"
            (beforeRender)="$any($event).object.update()"
        />
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DemoOrbitControls {
    private readonly store = inject(NgtStore);
    readonly camera = this.store.get('camera');
    readonly glDom = this.store.get('gl', 'domElement');

    @Input() enablePan = true;
    @Input() autoRotate = false;
    @Input() target = [0, 0, 0];
}
