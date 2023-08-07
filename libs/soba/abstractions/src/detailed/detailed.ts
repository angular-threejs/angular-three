import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, effect } from '@angular/core';
import { NgtBeforeRenderEvent, extend, injectNgtRef, signalStore, type NgtLOD } from 'angular-three';
import { LOD } from 'three';

extend({ LOD });

export type NgtsDetailedState = {
	hysteresis: number;
	distances: number[];
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-lOD
		 */
		'ngts-detailed': NgtsDetailedState & NgtLOD;
	}
}

@Component({
	selector: 'ngts-detailed',
	standalone: true,
	template: `
		<ngt-lOD ngtCompound [ref]="lodRef" (beforeRender)="onBeforeRender($event)">
			<ng-content />
		</ngt-lOD>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsDetailed {
	private inputs = signalStore<NgtsDetailedState>({ hysteresis: 0 });

	@Input() lodRef = injectNgtRef<LOD>();

	@Input({ required: true, alias: 'distances' }) set _distances(distances: number[]) {
		this.inputs.set({ distances });
	}

	@Input({ alias: 'hysteresis' }) set _hysteresis(hysteresis: number) {
		this.inputs.set({ hysteresis });
	}

	constructor() {
		this.updateChildren();
	}

	onBeforeRender({ object, state }: NgtBeforeRenderEvent<LOD>) {
		object.update(state.camera);
	}

	private updateChildren() {
		const lodChildren = this.lodRef.children();
		const _distances = this.inputs.select('distances');
		const _hysteresis = this.inputs.select('hysteresis');

		effect(() => {
			const lod = this.lodRef.nativeElement;
			if (!lod) return;
			const [distances, hysteresis, children] = [_distances(), _hysteresis(), lodChildren()];
			lod.levels.length = 0;
			children.forEach((child, index) => {
				lod.addLevel(child, distances[index], hysteresis);
			});
		});
	}
}
