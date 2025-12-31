import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { beforeRender, extend, getInstanceState, NgtThreeElements, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { LOD } from 'three';

/**
 * Configuration options for the NgtsDetailed LOD component.
 */
export interface NgtsDetailedOptions extends Partial<NgtThreeElements['ngt-lOD']> {
	/**
	 * The hysteresis value for LOD level transitions.
	 * This value prevents rapid switching between LOD levels when the camera
	 * is near a distance threshold. A higher value means more resistance to switching.
	 * @default 0
	 */
	hysteresis: number;
}

const defaultOptions: NgtsDetailedOptions = {
	hysteresis: 0,
};

/**
 * A component that implements Level of Detail (LOD) rendering for performance optimization.
 *
 * This component automatically switches between different detail levels of child objects
 * based on the camera distance. Child objects are associated with distance thresholds
 * where closer distances use higher-detail meshes.
 *
 * @example
 * ```html
 * <ngts-detailed [distances]="[0, 50, 100]">
 *   <ngt-mesh><!-- High detail --></ngt-mesh>
 *   <ngt-mesh><!-- Medium detail --></ngt-mesh>
 *   <ngt-mesh><!-- Low detail --></ngt-mesh>
 * </ngts-detailed>
 * ```
 */
@Component({
	selector: 'ngts-detailed',
	template: `
		<ngt-lOD #lod [parameters]="parameters()">
			<ng-content />
		</ngt-lOD>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsDetailed {
	/**
	 * Array of distance thresholds for each LOD level.
	 * The first distance corresponds to the first child (highest detail),
	 * and subsequent distances correspond to lower detail children.
	 */
	distances = input.required<number[]>();
	/**
	 * Configuration options for the LOD behavior.
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	/** @internal */
	protected parameters = omit(this.options, ['hysteresis']);

	/**
	 * Reference to the underlying THREE.LOD element.
	 */
	lodRef = viewChild.required<ElementRef<THREE.LOD>>('lod');
	private hysteresis = pick(this.options, 'hysteresis');

	constructor() {
		extend({ LOD });

		effect(() => {
			const lod = this.lodRef().nativeElement;
			const instanceState = getInstanceState(lod);
			if (!instanceState) return;
			const [, distances, hysteresis] = [instanceState.objects(), this.distances(), this.hysteresis()];
			lod.levels.length = 0;
			lod.children.forEach((object, index) => {
				lod.levels.push({ object, distance: distances[index], hysteresis });
			});
		});

		beforeRender(({ camera }) => {
			this.lodRef().nativeElement.update(camera);
		});
	}
}
