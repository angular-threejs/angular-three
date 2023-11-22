import { Directive, Input, computed } from '@angular/core';
import { injectNgtRef, signalStore } from 'angular-three-old';
import type { Points } from 'three';

export type NgtsPointsInstancesState = {
	limit: number;
	range?: number;
};

export type NgtsPointsBuffersState = {
	// a buffer containing all points position
	positions: Float32Array;
	colors?: Float32Array;
	sizes?: Float32Array;
	// The size of the points in the buffer
	stride: 2 | 3;
};

@Directive()
export abstract class NgtsPointsInput {
	protected inputs = signalStore<NgtsPointsBuffersState & NgtsPointsInstancesState>({
		stride: 3,
		limit: 1000,
	});

	@Input() pointsRef = injectNgtRef<Points>();

	@Input({ alias: 'range' }) set _range(range: number) {
		this.inputs.set({ range });
	}

	@Input({ alias: 'limit' }) set _limit(limit: number) {
		this.inputs.set({ limit });
	}

	@Input({ alias: 'positions' }) set _positions(positions: Float32Array) {
		this.inputs.set({ positions });
	}

	@Input({ alias: 'colors' }) set _colors(colors: Float32Array) {
		this.inputs.set({ colors });
	}

	@Input({ alias: 'sizes' }) set _sizes(sizes: Float32Array) {
		this.inputs.set({ sizes });
	}

	@Input({ alias: 'stride' }) set _stride(stride: 2 | 3) {
		this.inputs.set({ stride });
	}

	limit = this.inputs.select('limit');
	range = this.inputs.select('range');
	positions = this.inputs.select('positions');
	colors = this.inputs.select('colors');
	colorsLength = computed(() => this.colors()?.length || 0);
	sizes = this.inputs.select('sizes');
	sizesLength = computed(() => this.sizes()?.length || 0);
	stride = this.inputs.select('stride');
}
