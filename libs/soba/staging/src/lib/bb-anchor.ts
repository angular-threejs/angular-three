import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	effect,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { NgtThreeElements, NgtVector3, beforeRender, extend, getInstanceState, omit, vector3 } from 'angular-three';
import * as THREE from 'three';
import { Group } from 'three';

const boundingBox = new THREE.Box3();
const boundingBoxSize = new THREE.Vector3();

export interface NgtsBBAnchorOptions extends Partial<NgtThreeElements['ngt-group']> {
	anchor: NgtVector3;
}

@Component({
	selector: 'ngts-bb-anchor',
	template: `
		<ngt-group #bbAnchor [parameters]="parameters()">
			<ng-content />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsBBAnchor {
	options = input.required<NgtsBBAnchorOptions>();
	parameters = omit(this.options, ['anchor']);

	bbAnchorRef = viewChild.required<ElementRef<THREE.Group>>('bbAnchor');

	private parent = signal<THREE.Object3D | null>(null);
	private anchor = vector3(this.options, 'anchor');

	constructor() {
		extend({ Group });

		// Reattach group created by this component to the parent's parent,
		// so it becomes a sibling of its initial parent.
		// We do that so the children have no impact on a bounding box of a parent.
		effect(() => {
			const bbAnchorInstanceState = getInstanceState(this.bbAnchorRef().nativeElement);
			const bbAnchorParent = bbAnchorInstanceState?.parent();
			if (bbAnchorParent && 'parent' in bbAnchorParent) {
				this.parent.set(bbAnchorParent as unknown as THREE.Object3D);
				bbAnchorParent['parent'].add(this.bbAnchorRef().nativeElement);
			}
		});

		beforeRender(() => {
			const parent = this.parent();
			if (parent) {
				boundingBox.setFromObject(parent);
				boundingBox.getSize(boundingBoxSize);

				const anchor = this.anchor();
				const bbAnchor = this.bbAnchorRef().nativeElement;

				bbAnchor.position.set(
					parent.position.x + (boundingBoxSize.x * anchor.x) / 2,
					parent.position.y + (boundingBoxSize.y * anchor.y) / 2,
					parent.position.z + (boundingBoxSize.z * anchor.z) / 2,
				);
			}
		});
	}
}
