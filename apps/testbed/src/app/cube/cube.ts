import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	Input,
	afterNextRender,
	computed,
} from '@angular/core';
import { NgtArgs, cdAwareSignal, type NgtBeforeRenderEvent } from 'angular-three';
import { WithTimeline, injectGsap } from './gsap';

@Component({
	selector: 'app-cube',
	standalone: true,
	template: `
		<ngt-mesh
			[withTimeline]="gsapTimeline.mesh"
			[position]="position"
			(beforeRender)="onBeforeRender($event)"
			(pointerover)="hover.set(true)"
			(pointerout)="hover.set(false)"
			(click)="active.set(!active())"
		>
			<ngt-box-geometry *args="[1.5, 1.5, 1.5]" />
			<ngt-mesh-standard-material [withTimeline]="gsapTimeline.material" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [WithTimeline, NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cube {
	@Input() position = [0, 0, 0];

	protected hover = cdAwareSignal(false);
	protected active = cdAwareSignal(false);

	protected color = computed(() => (this.hover() ? '#FF69B4' : 'orange'));
	protected scale = computed(() => (this.active() ? 1.5 : 1));

	protected gsapTimeline = injectGsap({
		mesh: { value: () => ({ scale: this.scale() }), ease: 'bounce.out' },
		material: { value: () => ({ color: this.color() }) },
	});

	constructor() {
		afterNextRender(() => {
			console.log(this.gsapTimeline);
		});
	}

	onBeforeRender(event: NgtBeforeRenderEvent<THREE.Mesh>) {
		event.object.rotation.x += 0.01;
	}
}
