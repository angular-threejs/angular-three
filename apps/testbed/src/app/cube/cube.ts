import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, Input, computed } from '@angular/core';
import { cdAwareSignal, type NgtBeforeRenderEvent } from 'angular-three';
import { WithTimeline, injectGsap } from './gsap';

@Component({
	selector: 'app-cube',
	standalone: true,
	templateUrl: './cube.html',
	template: `
		<ngt-mesh
			[withTimeline]="gsapTimeline.scale"
			[position]="position"
			(beforeRender)="onBeforeRender($event)"
			(pointerover)="hover.set(true)"
			(pointerout)="hover.set(false)"
			(click)="active.set(!active())"
		>
			<ngt-box-geometry />
			<ngt-mesh-standard-material [withTimeline]="gsapTimeline.color" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [WithTimeline],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cube {
	@Input() position = [0, 0, 0];

	protected hover = cdAwareSignal(false);
	protected active = cdAwareSignal(false);

	protected color = computed(() => (this.hover() ? '#FF69B4' : 'orange'));
	protected scale = computed(() => (this.active() ? 1.5 : 1));

	protected gsapTimeline = injectGsap({
		scale: { value: this.scale, ease: 'bounce.out' },
		color: { value: this.color },
	});

	onBeforeRender(event: NgtBeforeRenderEvent<THREE.Mesh>) {
		event.object.rotation.x += 0.01;
	}
}
