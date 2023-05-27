import { CUSTOM_ELEMENTS_SCHEMA, Component, effect, inject } from '@angular/core';
import { extend, injectNgtRef, requestAnimationFrameInInjectionContext } from 'angular-three';
import { NGTS_INSTANCES_API } from './instances';
import { PositionMesh } from './position-mesh';

extend({ PositionMesh });

@Component({
    selector: 'ngts-instance',
    standalone: true,
    template: `
        <ngt-position-mesh
            ngtCompound
            [ref]="positionMeshRef"
            [instanceKey]="positionMeshRef"
            [instance]="instancesApi().getParent()"
        >
            <ng-content />
        </ngt-position-mesh>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsInstance {
    protected readonly positionMeshRef = injectNgtRef<PositionMesh>();
    protected readonly instancesApi = inject(NGTS_INSTANCES_API);

    constructor() {
        requestAnimationFrameInInjectionContext(() => {
            effect((onCleanup) => {
                onCleanup(this.instancesApi().subscribe(this.positionMeshRef));
            });
        });
    }
}
