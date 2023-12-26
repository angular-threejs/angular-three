import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, effect } from '@angular/core';
import { NgtArgs, checkUpdate, extend, injectNgtRef, signalStore, type NgtGroup } from 'angular-three-old';
import { Group, Mesh, PlaneGeometry, type BufferAttribute } from 'three';

const easeInExpo = (x: number) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10));

export type NgtsBackdropState = {
	floor: number;
	segments: number;
	receiveShadow: boolean;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 */
		'ngts-backdrop': NgtsBackdropState & NgtGroup;
	}
}

extend({ Group, Mesh, PlaneGeometry });

@Component({
	selector: 'ngts-backdrop',
	standalone: true,
	template: `
		<ngt-group ngtCompound>
			<ngt-mesh [receiveShadow]="receiveShadow()" [rotation]="[-Math.PI / 2, 0, Math.PI / 2]">
				<ngt-plane-geometry [ref]="planeRef" *args="[1, 1, segments(), segments()]" />
				<ng-content />
			</ngt-mesh>
		</ngt-group>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsBackdrop {
	Math = Math;

	private inputs = signalStore<NgtsBackdropState>({ floor: 0.25, segments: 20, receiveShadow: false });

	@Input({ alias: 'floor' }) set _floor(floor: number) {
		this.inputs.set({ floor });
	}

	@Input({ alias: 'segments' }) set _segments(segments: number) {
		this.inputs.set({ segments });
	}

	@Input({ alias: 'receiveShadow' }) set _receiveShadow(receiveShadow: boolean) {
		this.inputs.set({ receiveShadow });
	}

	private floor = this.inputs.select('floor');

	planeRef = injectNgtRef<PlaneGeometry>();
	segments = this.inputs.select('segments');
	receiveShadow = this.inputs.select('receiveShadow');

	constructor() {
		effect(() => {
			const plane = this.planeRef.nativeElement;
			if (!plane) return;
			const [segments, floor] = [this.segments(), this.floor()];
			const offset = segments / segments / 2;
			const position = plane.attributes['position'] as BufferAttribute;
			let i = 0;
			for (let x = 0; x < segments + 1; x++) {
				for (let y = 0; y < segments + 1; y++) {
					position.setXYZ(
						i++,
						x / segments - offset + (x === 0 ? -floor : 0),
						y / segments - offset,
						easeInExpo(x / segments),
					);
				}
			}

			checkUpdate(position);
			plane.computeVertexNormals();
		});
	}
}
