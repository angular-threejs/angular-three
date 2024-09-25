import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { NgtsText3D } from 'angular-three-soba/abstractions';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsMeshTransmissionMaterial } from 'angular-three-soba/materials';
import { Color, Mesh, SphereGeometry } from 'three';
import { COLOR_POWER_UPS, POWER_UP_DISTANCE_TOLERANCE } from '../constants';
import { GameStore } from '../game.store';
import { Spawnable, SPAWNABLE_DISTANCE_TOLERANCE, SPAWNABLE_PARTICLE_COLOR } from '../spawnable/spawnables.store';
import { Collectible, PowerUpType } from './collectibles.store';

injectGLTF.preload(() => ['./dragon_chestplate.glb', './magnet.glb']);

const powerUpGeometry = new SphereGeometry(1, 32, 32);
const background = new Color('white');

@Component({
	selector: 'app-collectible-power-up',
	standalone: true,
	template: `
		<ngt-mesh
			#power
			[geometry]="powerUpGeometry"
			[castShadow]="true"
			[scale]="6"
			[position]="[spawnable.positionX(), spawnable.positionY(), 0]"
		>
			<ngts-mesh-transmission-material [options]="{ thickness: 0.5, transmission: 1, roughness: 0, background }" />

			@switch (powerUp()) {
				@case ('armor') {
					<ngt-primitive *args="[armor()]" [parameters]="{ position: [0, -1.25, 0] }" />
				}
				@case ('magnet') {
					<ngt-primitive *args="[magnet()]" [parameters]="{ scale: 0.35 }" />
				}
				@case ('doubleCoin') {
					<ngts-text-3d
						text="x2"
						font="helvetiker_regular.typeface.json"
						[options]="{ position: [-0.5, -0.35, 0], size: 0.75, letterSpacing: -0.1 }"
					>
						<ngt-mesh-standard-material color="black" />
					</ngts-text-3d>
				}
			}
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsMeshTransmissionMaterial, NgtArgs, NgtsText3D],
	hostDirectives: [{ directive: Collectible, inputs: ['state'], outputs: ['stateChange'] }],
	providers: [
		{ provide: SPAWNABLE_DISTANCE_TOLERANCE, useValue: POWER_UP_DISTANCE_TOLERANCE },
		{ provide: SPAWNABLE_PARTICLE_COLOR, useValue: COLOR_POWER_UPS },
	],
})
export class CollectiblePowerUp {
	powerUp = input.required<PowerUpType>();

	protected powerUpGeometry = powerUpGeometry;
	protected background = background;

	// https://sketchfab.com/tonicarre35
	private armorGLTF = injectGLTF(() => './dragon_chestplate.glb');
	protected armor = computed(() => {
		const gltf = this.armorGLTF();
		if (!gltf) return null;
		return gltf.scene.clone();
	});

	// https://sketchfab.com/AlienDev
	private magnetGLTF = injectGLTF(() => './magnet.glb');
	protected magnet = computed(() => {
		const gltf = this.magnetGLTF();
		if (!gltf) return null;
		return gltf.scene.clone();
	});

	private powerRef = viewChild.required<ElementRef<Mesh>>('power');
	private gameStore = inject(GameStore);
	protected spawnable = inject(Spawnable, { host: true });

	constructor() {
		this.spawnable.assignSpawnable(this.powerRef);
		// this.spawnable.onCollide(() => {
		// 	this.gameStore.acquirePowerUp(this.powerUp());
		// });

		injectBeforeRender(() => {
			const power = this.powerRef().nativeElement;
			power.rotation.y += 0.05;
		});
	}
}
