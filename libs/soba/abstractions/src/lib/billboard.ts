import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { beforeRender, extend, NgtThreeElements, omit } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group } from 'three';

export interface NgtsBillboardOptions extends Partial<NgtThreeElements['ngt-group']> {
	follow?: boolean;
	lockX?: boolean;
	lockY?: boolean;
	lockZ?: boolean;
}

const defaultOptions: NgtsBillboardOptions = {
	follow: true,
	lockX: false,
	lockY: false,
	lockZ: false,
};

@Component({
	selector: 'ngts-billboard',
	template: `
		<ngt-group #group [parameters]="parameters()">
			<ngt-group #inner>
				<ng-content />
			</ngt-group>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsBillboard {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['follow', 'lockX', 'lockY', 'lockZ']);

	groupRef = viewChild.required<ElementRef<Group>>('group');
	innerRef = viewChild.required<ElementRef<Group>>('inner');

	constructor() {
		extend({ Group });

		const q = new THREE.Quaternion();
		beforeRender(({ camera }) => {
			const [{ follow, lockX, lockY, lockZ }, group, inner] = [
				this.options(),
				this.groupRef().nativeElement,
				this.innerRef().nativeElement,
			];

			if (!follow || !group || !inner) return;

			// save previous rotation in case we're locking an axis
			const prevRotation = inner.rotation.clone();

			// always face the camera
			group.updateMatrix();
			group.updateWorldMatrix(false, false);
			group.getWorldQuaternion(q);
			camera.getWorldQuaternion(inner.quaternion).premultiply(q.invert());

			// readjust any axis that is locked
			if (lockX) inner.rotation.x = prevRotation.x;
			if (lockY) inner.rotation.y = prevRotation.y;
			if (lockZ) inner.rotation.z = prevRotation.z;
		});
	}
}
