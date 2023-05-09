import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import { NgtGroup, NgtSignalStore, extend, injectBeforeRender, injectNgtRef } from 'angular-three';
import { Group } from 'three';

extend({ Group });

export type NgtsBillboardState = {
    follow?: boolean;
    lockX?: boolean;
    lockY?: boolean;
    lockZ?: boolean;
};

declare global {
    interface HTMLElementTagNameMap {
        'ngts-billboard': NgtsBillboardState & NgtGroup;
    }
}

@Component({
    selector: 'ngts-billboard',
    standalone: true,
    template: `
        <ngt-group ngtCompound [ref]="billboardRef">
            <ng-content />
        </ngt-group>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsBillboard extends NgtSignalStore<NgtsBillboardState> {
    @Input() billboardRef = injectNgtRef<Group>();

    @Input() set follow(follow: boolean) {
        this.set({ follow });
    }
    @Input() set lockX(lockX: boolean) {
        this.set({ lockX });
    }
    @Input() set lockY(lockY: boolean) {
        this.set({ lockY });
    }
    @Input() set lockZ(lockZ: boolean) {
        this.set({ lockZ });
    }

    constructor() {
        super({ follow: true, lockX: false, lockY: false, lockZ: false });
        injectBeforeRender(({ camera }) => {
            const ref = this.billboardRef.untracked;
            const { follow, lockX, lockY, lockZ } = this.get();
            if (!ref || !follow) return;
            // save previous rotation in case we're locking an axis
            const prevRotation = ref.rotation.clone();

            // always face the camera
            camera.getWorldQuaternion(ref.quaternion);

            // re-adjust any axis that is locked
            if (lockX) ref.rotation.x = prevRotation.x;
            if (lockY) ref.rotation.y = prevRotation.y;
            if (lockZ) ref.rotation.z = prevRotation.z;
        });
    }
}
