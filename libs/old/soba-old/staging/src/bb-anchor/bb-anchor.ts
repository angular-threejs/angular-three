import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed, effect } from '@angular/core';
import { extend, injectBeforeRender, injectNgtRef, signalStore, type NgtGroup } from 'angular-three-old';
import * as THREE from 'three';
import { Group } from 'three';

const boundingBox = new THREE.Box3();
const boundingBoxSize = new THREE.Vector3();

export type NgtsBBAnchorState = {
	anchor: THREE.Vector3 | [number, number, number];
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 */
		'ngts-bb-anchor': NgtsBBAnchorState & NgtGroup;
	}
}

extend({ Group });

@Component({
	selector: 'ngts-bb-anchor',
	standalone: true,
	template: `
		<ngt-group ngtCompound [ref]="groupRef">
			<ng-content />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsBBAnchor {
	private inputs = signalStore<NgtsBBAnchorState>();

	@Input({ required: true, alias: 'anchor' }) set _anchor(anchor: NgtsBBAnchorState['anchor']) {
		this.inputs.set({ anchor });
	}

	groupRef = injectNgtRef<Group>();
	private parentRef = injectNgtRef<THREE.Object3D | null>();
	private anchor = this.inputs.select('anchor');
	private xyz = computed(() => {
		const anchor = this.anchor();
		return Array.isArray(anchor) ? anchor : [anchor.x, anchor.y, anchor.z];
	});

	constructor() {
		this.reattachParent();
		this.beforeRender();
	}

	private reattachParent() {
		effect(() => {
			const group = this.groupRef.nativeElement;
			if (!group) return;
			if (group.parent?.parent) {
				this.parentRef.nativeElement = group.parent.parent;
				group.parent.parent.add(group);
			}
		});
	}

	private beforeRender() {
		injectBeforeRender(() => {
			const [parent, group, [x, y, z]] = [this.parentRef.nativeElement, this.groupRef.nativeElement, this.xyz()];

			if (parent) {
				boundingBox.setFromObject(parent);
				boundingBox.getSize(boundingBoxSize);

				group.position.set(
					parent.position.x + (boundingBoxSize.x * x) / 2,
					parent.position.y + (boundingBoxSize.y * y) / 2,
					parent.position.z + (boundingBoxSize.z * z) / 2,
				);
			}
		});
	}
}
