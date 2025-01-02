import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	viewChild,
	viewChildren,
} from '@angular/core';
import { injectBeforeRender } from 'angular-three';
import { Object3D } from 'three';
import { SEA_RADIUS } from '../constants';
import { GameStore } from '../game.store';
import { Cloud } from './cloud';

@Component({
    selector: 'app-sky',
    template: `
		<ngt-object3D #sky [position]="[0, -SEA_RADIUS, 0]">
			@for (i of count; track $index) {
				<app-cloud />
			}
		</ngt-object3D>
	`,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Cloud]
})
export class Sky {
	protected readonly SEA_RADIUS = SEA_RADIUS;

	protected count = Array.from({ length: 20 });
	private stepAngle = (Math.PI * 2) / this.count.length;
	private heightFactor = SEA_RADIUS + 150 + Math.random() * 200;

	private gameStore = inject(GameStore);
	private skyRef = viewChild.required<ElementRef<Object3D>>('sky');
	private clouds = viewChildren(Cloud);
	private cloudObjects = computed(() => {
		const objects: Object3D[] = [];
		for (const cloud of this.clouds()) {
			objects.push(cloud.cloudRef().nativeElement);
		}
		return objects;
	});

	constructor() {
		effect(() => {
			this.setCloudsMatrixEffect();
		});

		injectBeforeRender(({ delta }) => {
			const sky = this.skyRef().nativeElement;
			sky.rotation.z += this.gameStore.state.speed * delta * 1_000;
		});
	}

	private setCloudsMatrixEffect() {
		const clouds = this.cloudObjects();
		if (!clouds.length) return;

		for (let i = 0; i < clouds.length; i++) {
			const cloud = clouds[i];
			cloud.position.set(
				Math.cos(this.stepAngle * i) * this.heightFactor,
				Math.sin(this.stepAngle * i) * this.heightFactor,
				-300 - Math.random() * 500,
			);
			cloud.rotation.set(0, 0, this.stepAngle * i + Math.PI / 2);
			cloud.scale.setScalar(1 + Math.random() * 2);
		}
	}
}
