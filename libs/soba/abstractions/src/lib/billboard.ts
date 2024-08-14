import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { extend, injectBeforeRender, NgtGroup, omit } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Group, Quaternion } from 'three';

export interface NgtsBillboardOptions extends Partial<NgtGroup> {
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
	standalone: true,
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
	parameters = omit(this.options, ['follow', 'lockX', 'lockY', 'lockZ']);

	groupRef = viewChild.required<ElementRef<Group>>('group');
	innerRef = viewChild.required<ElementRef<Group>>('inner');

	constructor() {
		extend({ Group });

		const q = new Quaternion();
		injectBeforeRender(({ camera }) => {
			const [{ follow, lockX, lockY, lockZ }, group, inner] = [
				this.options(),
				this.groupRef().nativeElement,
				this.innerRef().nativeElement,
			];

			if (!follow || !group) return;

			// save previous rotation in case we're locking an axis
			const prevRotation = group.rotation.clone();

			// always face the camera
			group.updateMatrix();
			group.updateWorldMatrix(false, false);
			group.getWorldQuaternion(q);
			camera.getWorldQuaternion(inner.quaternion).premultiply(q.invert());

			// readjust any axis that is locked
			if (lockX) group.rotation.x = prevRotation.x;
			if (lockY) group.rotation.y = prevRotation.y;
			if (lockZ) group.rotation.z = prevRotation.z;
		});
	}
}
