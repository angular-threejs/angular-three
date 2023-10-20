import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import { extend, injectBeforeRender, injectNgtRef, signalStore, type NgtGroup } from 'angular-three';
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
		/**
		 * @extends ngt-group
		 */
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
export class NgtsBillboard {
	private inputs = signalStore<NgtsBillboardState>({ follow: true, lockX: false, lockY: false, lockZ: false });

	@Input() billboardRef = injectNgtRef<Group>();

	@Input({ alias: 'follow' }) set _follow(follow: boolean) {
		this.inputs.set({ follow });
	}

	@Input({ alias: 'lockX' }) set _lockX(lockX: boolean) {
		this.inputs.set({ lockX });
	}

	@Input({ alias: 'lockY' }) set _lockY(lockY: boolean) {
		this.inputs.set({ lockY });
	}

	@Input({ alias: 'lockZ' }) set _lockZ(lockZ: boolean) {
		this.inputs.set({ lockZ });
	}

	constructor() {
		injectBeforeRender(({ camera }) => {
			const ref = this.billboardRef.nativeElement;
			const { follow, lockX, lockY, lockZ } = this.inputs.get();
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
