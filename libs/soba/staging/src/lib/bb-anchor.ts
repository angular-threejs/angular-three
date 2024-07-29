import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { NgtGroup, NgtVector3, extend, getLocalState, injectBeforeRender, omit, vector3 } from 'angular-three';
import { Box3, Group, Object3D, Vector3 } from 'three';

const boundingBox = new Box3();
const boundingBoxSize = new Vector3();

export interface NgtsBBAnchorOptions extends Partial<NgtGroup> {
	anchor: NgtVector3;
}

@Component({
	selector: 'ngts-bb-anchor',
	standalone: true,
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

	bbAnchorRef = viewChild.required<ElementRef<Group>>('bbAnchor');

	parent = signal<Object3D | null>(null);
	private anchor = vector3(this.options, 'anchor');

	constructor() {
		extend({ Group });

		// Reattach group created by this component to the parent's parent,
		// so it becomes a sibling of its initial parent.
		// We do that so the children have no impact on a bounding box of a parent.
		afterNextRender(() => {
			const bbAnchorLS = getLocalState(this.bbAnchorRef().nativeElement);
			const bbAnchorParent = bbAnchorLS?.parent();
			if (bbAnchorParent?.parent) {
				this.parent.set(bbAnchorParent);
				bbAnchorParent.parent.add(this.bbAnchorRef().nativeElement);
			}
		});

		injectBeforeRender(() => {
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
