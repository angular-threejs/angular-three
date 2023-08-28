import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { injectBeforeRender, injectNgtRef, NgtArgs, signalStore, type NgtMeshPhysicalMaterial } from 'angular-three';
import { injectNgtsMeshDistortMaterial, type MeshDistortMaterial } from 'angular-three-soba/shaders';

export type NgtsMeshDistortMaterialState = {
	time: number;
	distort: number;
	radius: number;
	speed: number;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-mesh-physical-material
		 */
		'ngts-mesh-distort-material': NgtsMeshDistortMaterialState & NgtMeshPhysicalMaterial;
	}
}

@Component({
	selector: 'ngts-mesh-distort-material',
	standalone: true,
	template: `
		<ngt-primitive
			*args="[material]"
			[ref]="materialRef"
			[time]="time()"
			[distort]="distort()"
			[radius]="radius()"
			ngtCompound
			attach="material"
		/>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshDistortMaterial {
	private inputs = signalStore<NgtsMeshDistortMaterialState>({
		speed: 1,
		time: 0,
		distort: 0.4,
		radius: 1,
	});

	@Input() materialRef = injectNgtRef<InstanceType<MeshDistortMaterial>>();

	@Input({ alias: 'time' }) set _time(time: number) {
		this.inputs.set({ time });
	}

	@Input({ alias: 'distort' }) set _distort(distort: number) {
		this.inputs.set({ distort });
	}

	@Input({ alias: 'radius' }) set _radius(radius: number) {
		this.inputs.set({ radius });
	}

	@Input({ alias: 'speed' }) set _speed(speed: number) {
		this.inputs.set({ speed });
	}

	private MeshDistortMaterial = injectNgtsMeshDistortMaterial();
	material = new this.MeshDistortMaterial();

	time = this.inputs.select('time');
	distort = this.inputs.select('distort');
	radius = this.inputs.select('radius');

	constructor() {
		injectBeforeRender(({ clock }) => {
			this.material.time = clock.getElapsedTime() * this.inputs.get('speed');
		});
	}
}
