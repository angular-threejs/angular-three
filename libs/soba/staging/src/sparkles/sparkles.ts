import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed, isSignal, type Signal } from '@angular/core';
import {
	NgtArgs,
	NgtKey,
	extend,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	signalStore,
	type NgtPoints,
} from 'angular-three';
import { SparklesMaterial, type NgtSparklesMaterialState } from 'angular-three-soba/shaders';
import * as THREE from 'three';
import { BufferAttribute, BufferGeometry, Points } from 'three';

extend({ SparklesMaterial, Points, BufferGeometry, BufferAttribute });

const isFloat32Array = (def: any): def is Float32Array => def && (def as Float32Array).constructor === Float32Array;

const expandColor = (v: THREE.Color) => [v.r, v.g, v.b];
const isVector = (v: any): v is THREE.Vector2 | THREE.Vector3 | THREE.Vector4 =>
	v instanceof THREE.Vector2 || v instanceof THREE.Vector3 || v instanceof THREE.Vector4;

const normalizeVector = (v: any): number[] => {
	if (Array.isArray(v)) return v;
	else if (isVector(v)) return v.toArray();
	return [v, v, v] as number[];
};

function usePropAsIsOrAsAttribute<T extends any>(
	count: number,
	prop?: T | Float32Array,
	setDefault?: (v: T) => number,
) {
	if (prop !== undefined) {
		if (isFloat32Array(prop)) {
			return prop as Float32Array;
		}

		if (prop instanceof THREE.Color) {
			const a = Array.from({ length: count * 3 }, () => expandColor(prop)).flat();
			return Float32Array.from(a);
		}

		if (isVector(prop) || Array.isArray(prop)) {
			const a = Array.from({ length: count * 3 }, () => normalizeVector(prop)).flat();
			return Float32Array.from(a);
		}

		return Float32Array.from({ length: count }, () => prop as number);
	}

	return Float32Array.from({ length: count }, setDefault!);
}

export type NgtsSparklesState = {
	/** Number of particles (default: 100) */
	count: number;
	/** Speed of particles (default: 1) */
	speed: number | Float32Array;
	/** Opacity of particles (default: 1) */
	opacity: number | Float32Array;
	/** Color of particles (default: 100) */
	color?: THREE.ColorRepresentation | Float32Array;
	/** Size of particles (default: randomized between 0 and 1) */
	size?: number | Float32Array;
	/** The space the particles occupy (default: 1) */
	scale: number | [number, number, number] | THREE.Vector3;
	/** Movement factor (default: 1) */
	noise: number | [number, number, number] | THREE.Vector3 | Float32Array;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-points
		 */
		'ngts-sparkles': NgtsSparklesState & NgtPoints;
	}
}

@Component({
	selector: 'ngts-sparkles',
	standalone: true,
	template: `
		<ngt-points *key="key()" ngtCompound [ref]="sparklesRef">
			<ngt-buffer-geometry>
				<ngt-buffer-attribute attach="attributes.position" *args="[positions(), 3]" />
				<ngt-buffer-attribute attach="attributes.size" *args="[sizes(), 1]" />
				<ngt-buffer-attribute attach="attributes.opacity" *args="[opacities(), 1]" />
				<ngt-buffer-attribute attach="attributes.speed" *args="[speeds(), 1]" />
				<ngt-buffer-attribute attach="attributes.color" *args="[colors(), 3]" />
				<ngt-buffer-attribute attach="attributes.noise" *args="[noises(), 3]" />
			</ngt-buffer-geometry>
			<ngt-sparkles-material [transparent]="true" [depthWrite]="false" [pixelRatio]="dpr()" />
		</ngt-points>
	`,
	imports: [NgtArgs, NgtKey],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSparkles {
	private inputs = signalStore<NgtsSparklesState>({
		noise: 1,
		count: 100,
		speed: 1,
		opacity: 1,
		scale: 1,
	});

	@Input() sparklesRef = injectNgtRef<Points>();

	/** Number of particles (default: 100) */
	@Input({ alias: 'count' }) set _count(count: number) {
		this.inputs.set({ count });
	}

	/** Speed of particles (default: 1) */
	@Input({ alias: 'speed' }) set _speed(speed: number | Float32Array) {
		this.inputs.set({ speed });
	}

	/** Opacity of particles (default: 1) */
	@Input({ alias: 'opacity' }) set _opacity(opacity: number | Float32Array) {
		this.inputs.set({ opacity });
	}

	/** Color of particles (default: 100) */
	@Input({ alias: 'color' }) set _color(color: THREE.ColorRepresentation | Float32Array) {
		this.inputs.set({ color });
	}

	/** Size of particles (default: randomized between 0 and 1) */
	@Input({ alias: 'size' }) set _size(size: number | Float32Array) {
		this.inputs.set({ size });
	}

	/** The space the particles occupy (default: 1) */
	@Input({ alias: 'scale' }) set _scale(scale: number | [number, number, number] | THREE.Vector3) {
		this.inputs.set({ scale });
	}

	/** Movement factor (default: 1) */
	@Input({ alias: 'noise' }) set _noise(noise: number | [number, number, number] | THREE.Vector3 | Float32Array) {
		this.inputs.set({ noise });
	}

	private store = injectNgtStore();

	dpr = this.store.select('viewport', 'dpr');

	private scale = this.inputs.select('scale');
	private count = this.inputs.select('count');
	private color = this.inputs.select('color');

	positions = computed(() =>
		Float32Array.from(
			Array.from({ length: this.count() }, () =>
				normalizeVector(this.scale()).map(THREE.MathUtils.randFloatSpread),
			).flat(),
		),
	);
	sizes = this.getComputed('size', this.count, Math.random);
	opacities = this.getComputed('opacity', this.count);
	speeds = this.getComputed('speed', this.count);
	noises = this.getComputed('noise', () => this.count() * 3);
	colors = this.getComputed(
		computed(() => {
			const color = this.color();
			return !isFloat32Array(color) ? new THREE.Color(color) : color;
		}),
		() => (this.color() === undefined ? this.count() * 3 : this.count()),
		() => 1,
	);
	key = computed(() => `particle-${this.count()}-${JSON.stringify(this.scale())}`);

	constructor() {
		this.beforeRender();
	}

	private beforeRender() {
		injectBeforeRender(({ clock }) => {
			const sparkles = this.sparklesRef.nativeElement;
			if (!sparkles || !sparkles.material) return;
			(sparkles.material as NgtSparklesMaterialState).time = clock.elapsedTime;
		});
	}

	private getComputed<TKey extends keyof NgtsSparklesState>(
		nameOrComputed: TKey | Signal<NgtsSparklesState[TKey]>,
		count: () => number,
		setDefault?: (value: NgtsSparklesState[TKey]) => number,
	) {
		const value =
			typeof nameOrComputed !== 'string' && isSignal(nameOrComputed)
				? nameOrComputed
				: this.inputs.select(nameOrComputed);
		return computed(() => usePropAsIsOrAsAttribute(count(), value(), setDefault));
	}
}
