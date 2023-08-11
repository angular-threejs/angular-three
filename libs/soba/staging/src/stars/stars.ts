import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed } from '@angular/core';
import { NgtArgs, NgtBeforeRenderEvent, extend, injectNgtRef, signalStore } from 'angular-three';
import { StarFieldMaterial } from 'angular-three-soba/shaders';
import * as THREE from 'three';
import { BufferAttribute, BufferGeometry, Points } from 'three';

extend({ Points, BufferGeometry, BufferAttribute });

export type NgtsStarsState = {
	radius: number;
	depth: number;
	count: number;
	factor: number;
	saturation: number;
	fade: boolean;
	speed: number;
};

declare global {
	interface HTMLElementTagNameMap {
		'ngts-stars': NgtsStarsState;
	}
}

const genStar = (r: number) =>
	new THREE.Vector3().setFromSpherical(
		new THREE.Spherical(r, Math.acos(1 - Math.random() * 2), Math.random() * 2 * Math.PI),
	);

@Component({
	selector: 'ngts-stars',
	standalone: true,
	template: `
		<ngt-points [ref]="starsRef">
			<ngt-buffer-geometry>
				<ngt-buffer-attribute attach="attributes.position" *args="[attributes().positions, 3]" />
				<ngt-buffer-attribute attach="attributes.color" *args="[attributes().colors, 3]" />
				<ngt-buffer-attribute attach="attributes.size" *args="[attributes().sizes, 1]" />
			</ngt-buffer-geometry>
			<ngt-primitive
				*args="[material]"
				attach="material"
				[blending]="AdditiveBlending"
				[depthWrite]="false"
				[transparent]="true"
				[vertexColors]="true"
				(beforeRender)="onBeforeRender($event)"
			>
				<ngt-value attach="uniforms.fade.value" [rawValue]="fade()" />
			</ngt-primitive>
		</ngt-points>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsStars {
	private inputs = signalStore<NgtsStarsState>({
		radius: 100,
		depth: 50,
		count: 5000,
		saturation: 0,
		factor: 4,
		fade: false,
		speed: 1,
	});
	AdditiveBlending = THREE.AdditiveBlending;
	material = new StarFieldMaterial();

	@Input() starsRef = injectNgtRef<Points>();

	@Input({ alias: 'radius' }) set _radius(radius: number) {
		this.inputs.set({ radius });
	}

	@Input({ alias: 'depth' }) set _depth(depth: number) {
		this.inputs.set({ depth });
	}

	@Input({ alias: 'count' }) set _count(count: number) {
		this.inputs.set({ count });
	}

	@Input({ alias: 'factor' }) set _factor(factor: number) {
		this.inputs.set({ factor });
	}

	@Input({ alias: 'saturation' }) set _saturation(saturation: number) {
		this.inputs.set({ saturation });
	}

	@Input('fade') set starsFade(fade: boolean) {
		this.inputs.set({ fade });
	}

	@Input({ alias: 'speed' }) set _speed(speed: number) {
		this.inputs.set({ speed });
	}

	private count = this.inputs.select('count');
	private depth = this.inputs.select('depth');
	private factor = this.inputs.select('factor');
	private radius = this.inputs.select('radius');
	private saturation = this.inputs.select('saturation');

	fade = this.inputs.select('fade');
	attributes = computed(() => {
		const positions: number[] = [];
		const colors: number[] = [];
		const sizes = Array.from({ length: this.count() }, () => (0.5 + 0.5 * Math.random()) * this.factor());
		const color = new THREE.Color();
		let r = this.radius() + this.depth();
		const increment = this.depth() / this.count();
		for (let i = 0; i < this.count(); i++) {
			r -= increment * Math.random();
			positions.push(...genStar(r).toArray());
			color.setHSL(i / this.count(), this.saturation(), 0.9);
			colors.push(color.r, color.g, color.b);
		}
		return {
			positions: new Float32Array(positions),
			colors: new Float32Array(colors),
			sizes: new Float32Array(sizes),
		};
	});

	onBeforeRender({ object, state }: NgtBeforeRenderEvent<InstanceType<typeof StarFieldMaterial>>) {
		object.uniforms['time'].value = state.clock.getElapsedTime() * this.inputs.get('speed');
	}
}
