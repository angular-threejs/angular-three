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

export interface NgtsDetailedOptions extends Partial<NgtThreeElements['ngt-lOD']> {
	hysteresis: number;
}

const defaultOptions: NgtsDetailedOptions = {
	hysteresis: 0,
};

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
	distances = input.required<number[]>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['hysteresis']);

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
