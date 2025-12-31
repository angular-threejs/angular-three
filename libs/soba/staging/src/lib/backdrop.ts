import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { checkUpdate, extend, NgtArgs, NgtThreeElements, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group, Mesh, PlaneGeometry } from 'three';

function easeInExpo(x: number) {
	return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}

/**
 * Configuration options for the NgtsBackdrop component.
 * Extends the standard ngt-group element options.
 */
export interface NgtsBackdropOptions extends Partial<NgtThreeElements['ngt-group']> {
	/**
	 * The floor extension factor. Controls how far the backdrop extends on the floor.
	 * @default 0.25
	 */
	floor: number;
	/**
	 * Number of segments for the backdrop geometry. Higher values create smoother curves.
	 * @default 20
	 */
	segments: number;
	/**
	 * Whether the backdrop should receive shadows from other objects.
	 * @default undefined
	 */
	receiveShadow?: boolean;
}

const defaultOptions: NgtsBackdropOptions = {
	floor: 0.25,
	segments: 20,
};

/**
 * A curved backdrop component that creates a seamless background surface.
 * The backdrop curves from vertical to horizontal using an exponential easing function,
 * creating a smooth transition perfect for product showcases or studio-like scenes.
 *
 * @example
 * ```html
 * <ngts-backdrop [options]="{ floor: 0.25, segments: 20, receiveShadow: true }">
 *   <ngt-mesh-standard-material color="#353540" />
 * </ngts-backdrop>
 * ```
 */
@Component({
	selector: 'ngts-backdrop',
	template: `
		<ngt-group #group [parameters]="parameters()">
			<ngt-mesh [receiveShadow]="receiveShadow()" [rotation]="[-Math.PI / 2, 0, Math.PI / 2]">
				<ngt-plane-geometry #plane *args="[1, 1, segments(), segments()]" />
				<ng-content />
			</ngt-mesh>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsBackdrop {
	protected readonly Math = Math;

	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['floor', 'segments', 'receiveShadow']);

	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');
	planeRef = viewChild<ElementRef<THREE.PlaneGeometry>>('plane');

	protected receiveShadow = pick(this.options, 'receiveShadow');
	protected segments = pick(this.options, 'segments');
	private floor = pick(this.options, 'floor');

	constructor() {
		extend({ Group, Mesh, PlaneGeometry });

		effect(() => {
			const plane = this.planeRef()?.nativeElement;
			if (!plane) return;

			const [segments, floor] = [this.segments(), this.floor()];

			let i = 0;
			const offset = segments / segments / 2;
			const position = plane.attributes['position'] as THREE.BufferAttribute;
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
