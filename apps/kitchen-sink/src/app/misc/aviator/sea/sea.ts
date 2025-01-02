import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { checkUpdate, injectBeforeRender, NgtArgs } from 'angular-three';
import { CylinderGeometry, Matrix4, Mesh } from 'three';
import {
	COLOR_SEA_LEVEL,
	SEA_LENGTH,
	SEA_RADIUS,
	WAVES_MAX_AMP,
	WAVES_MAX_SPEED,
	WAVES_MIN_AMP,
	WAVES_MIN_SPEED,
} from '../constants';
import { GameStore } from '../game.store';

@Component({
    selector: 'app-sea',
    template: `
		<ngt-mesh #mesh [receiveShadow]="true" [position]="[0, -SEA_RADIUS, 0]">
			<ngt-cylinder-geometry #cylinder *args="[SEA_RADIUS, SEA_RADIUS, SEA_LENGTH, 40, 10]" />
			<ngt-mesh-phong-material [color]="COLOR_SEA_LEVEL[0]" [transparent]="true" [opacity]="0.8" [flatShading]="true" />
		</ngt-mesh>
	`,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgtArgs]
})
export class Sea {
	protected readonly SEA_RADIUS = SEA_RADIUS;
	protected readonly SEA_LENGTH = SEA_LENGTH;
	protected readonly COLOR_SEA_LEVEL = COLOR_SEA_LEVEL;

	isStatic = input(false, { transform: booleanAttribute });

	private meshRef = viewChild.required<ElementRef<Mesh<CylinderGeometry>>>('mesh');
	private cylinderGeometryRef = viewChild<ElementRef<CylinderGeometry>>('cylinder');

	private gameStore = inject(GameStore);

	private waves: Array<{ x: number; y: number; z: number; ang: number; amp: number; speed: number }> = [];

	constructor() {
		effect(() => {
			this.createWavesEffect();
		});

		injectBeforeRender(({ delta }) => {
			const isStatic = this.isStatic();
			if (isStatic) return;

			const mesh = this.meshRef().nativeElement;

			mesh.rotation.z += this.gameStore.state.speed * delta * 1_000;
			if (mesh.rotation.z > 2 * Math.PI) {
				mesh.rotation.z -= 2 * Math.PI;
			}

			const positions = mesh.geometry.attributes['position'].array;
			for (let i = 0; i < positions.length / 3; i++) {
				const wave = this.waves[i];
				positions[i * 3] = wave.x + Math.cos(wave.ang) * wave.amp;
				positions[i * 3 + 1] = wave.y + Math.sin(wave.ang) * wave.amp;
				wave.ang += wave.speed * delta * 1_000;
			}
			checkUpdate(mesh.geometry.attributes['position']);
		});
	}

	private createWavesEffect() {
		const cylinderGeometry = this.cylinderGeometryRef()?.nativeElement;
		if (!cylinderGeometry) return;

		cylinderGeometry.applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2));
		const positions = cylinderGeometry.attributes['position'].array;

		for (let i = 0; i < positions.length / 3; i++) {
			this.waves.push({
				x: positions[i * 3],
				y: positions[i * 3 + 1],
				z: positions[i * 3 + 2],
				ang: Math.random() * Math.PI * 2,
				amp: WAVES_MIN_AMP + Math.random() * (WAVES_MAX_AMP - WAVES_MIN_AMP),
				speed: WAVES_MIN_SPEED + Math.random() * (WAVES_MAX_SPEED - WAVES_MIN_SPEED),
			});
		}
	}
}
