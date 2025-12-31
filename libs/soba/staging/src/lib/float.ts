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

/**
 * Configuration options for the NgtsFloat component.
 */
export interface NgtsFloatOptions extends Partial<NgtThreeElements['ngt-group']> {
	/**
	 * Whether the floating animation is enabled.
	 * @default true
	 */
	enabled: boolean;
	/**
	 * Animation speed multiplier.
	 * @default 1
	 */
	speed: number;
	/**
	 * Intensity of the rotation animation.
	 * @default 1
	 */
	rotationIntensity: number;
	/**
	 * Intensity of the floating (vertical movement) animation.
	 * @default 1
	 */
	floatIntensity: number;
	/**
	 * Range of the floating animation [min, max] in world units.
	 * @default [-0.1, 0.1]
	 */
	floatingRange: [number?, number?];
	/**
	 * Whether to call invalidate() on each frame for on-demand rendering.
	 * @default false
	 */
	autoInvalidate: boolean;
}

const defaultOptions: NgtsFloatOptions = {
	enabled: true,
	speed: 1,
	rotationIntensity: 1,
	floatIntensity: 1,
	floatingRange: [-0.1, 0.1],
	autoInvalidate: false,
};

/**
 * Component that makes its children float and rotate with a gentle animation.
 * Useful for creating dreamy, floating effects on 3D objects.
 *
 * @example
 * ```html
 * <ngts-float [options]="{ speed: 2, floatIntensity: 2 }">
 *   <ngt-mesh>
 *     <ngt-box-geometry />
 *     <ngt-mesh-standard-material />
 *   </ngt-mesh>
 * </ngts-float>
 * ```
 */
@Component({
	selector: 'ngts-float',
	template: `
		<ngt-group [parameters]="parameters()">
			<ngt-group #float [matrixAutoUpdate]="false">
				<ng-content />
			</ngt-group>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsFloat {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
		'enabled',
		'speed',
		'rotationIntensity',
		'floatIntensity',
		'floatingRange',
		'autoInvalidate',
	]);

	floatRef = viewChild.required<ElementRef<THREE.Group>>('float');

	constructor() {
		extend({ Group });

		const offset = Math.random() * 10000;
		beforeRender(({ clock, invalidate }) => {
			const [{ enabled, speed, rotationIntensity, floatingRange, floatIntensity, autoInvalidate }] = [
				this.options(),
			];
			if (!enabled || speed === 0) return;

			if (autoInvalidate) invalidate();

			const container = this.floatRef().nativeElement;

			const offsetTime = offset + clock.elapsedTime;
			container.rotation.x = (Math.cos((offsetTime / 4) * speed) / 8) * rotationIntensity;
			container.rotation.y = (Math.sin((offsetTime / 4) * speed) / 8) * rotationIntensity;
			container.rotation.z = (Math.sin((offsetTime / 4) * speed) / 20) * rotationIntensity;

			let yPosition = Math.sin((offsetTime / 4) * speed) / 10;
			yPosition = THREE.MathUtils.mapLinear(
				yPosition,
				-0.1,
				0.1,
				floatingRange[0] ?? -0.1,
				floatingRange[1] ?? 0.1,
			);
			container.position.y = yPosition * floatIntensity;
			container.updateMatrix();
		});
	}
}
