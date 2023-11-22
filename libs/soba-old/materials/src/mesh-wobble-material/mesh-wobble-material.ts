import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import {
	extend,
	injectBeforeRender,
	injectNgtRef,
	NgtArgs,
	signalStore,
	type NgtMeshStandardMaterial,
} from 'angular-three-old';
import { MeshWobbleMaterial } from 'angular-three-soba-old/shaders';

extend({ MeshWobbleMaterial });

export type NgtsMeshWobbleMaterialState = {
	time: number;
	factor: number;
	speed: number;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-mesh-standard-material
		 */
		'ngts-mesh-wobble-material': NgtsMeshWobbleMaterialState & NgtMeshStandardMaterial;
	}
}

@Component({
	selector: 'ngts-mesh-wobble-material',
	standalone: true,
	template: `
		<ngt-primitive
			*args="[material]"
			[ref]="materialRef"
			[time]="time()"
			[factor]="factor()"
			attach="material"
			ngtCompound
		/>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshWobbleMaterial {
	private inputs = signalStore<NgtsMeshWobbleMaterialState>({ speed: 1, time: 0, factor: 1 });

	@Input() materialRef = injectNgtRef<MeshWobbleMaterial>();

	@Input({ alias: 'time' }) set _time(time: number) {
		this.inputs.set({ time });
	}

	@Input({ alias: 'factor' }) set _factor(factor: number) {
		this.inputs.set({ factor });
	}

	@Input({ alias: 'speed' }) set _speed(speed: number) {
		this.inputs.set({ speed });
	}

	material = new MeshWobbleMaterial();
	time = this.inputs.select('time');
	factor = this.inputs.select('factor');

	constructor() {
		injectBeforeRender(({ clock }) => {
			this.material.time = clock.getElapsedTime() * this.inputs.get('speed');
		});
	}
}
