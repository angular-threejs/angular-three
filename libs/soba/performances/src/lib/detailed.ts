import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { extend, getLocalState, injectBeforeRender, NgtLOD, omit, pick } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { LOD } from 'three';

export interface NgtsDetailedOptions extends Partial<NgtLOD> {
	hysteresis: number;
}

const defaultOptions: NgtsDetailedOptions = {
	hysteresis: 0,
};

@Component({
	selector: 'ngts-detailed',
	standalone: true,
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
	parameters = omit(this.options, ['hysteresis']);

	lodRef = viewChild.required<ElementRef<LOD>>('lod');
	private hysteresis = pick(this.options, 'hysteresis');

	constructor() {
		extend({ LOD });

		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const lod = this.lodRef().nativeElement;
				const localState = getLocalState(lod);
				if (!localState) return;
				const [, distances, hysteresis] = [localState.objects(), this.distances(), this.hysteresis()];
				lod.levels.length = 0;
				lod.children.forEach((object, index) => {
					lod.levels.push({ object, distance: distances[index], hysteresis });
				});
			});
		});

		injectBeforeRender(({ camera }) => {
			this.lodRef().nativeElement.update(camera);
		});
	}
}
