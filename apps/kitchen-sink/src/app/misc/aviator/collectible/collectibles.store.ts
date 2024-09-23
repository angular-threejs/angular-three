import { DestroyRef, Directive, effect, inject, input, model, signal, WritableSignal } from '@angular/core';
import { injectStore } from 'angular-three';
import { Object3D } from 'three';
import { COLLECTIBLES_SPEED, PLANE_AMP_HEIGHT, PLANE_DEFAULT_HEIGHT, SEA_RADIUS } from '../constants';
import { GameStore } from '../game.store';

@Directive()
export class Collectible {
	initialAngle = input(0);
	initialDistance = input(0);
	positionX = input(0);
	positionY = input(0);
	state = model.required<'spawned' | 'collected' | 'skipped'>();

	protected angle = 0;
	protected distance = 0;

	protected gameStore = inject(GameStore);
	protected collectiblesStore = inject(CollectiblesStore);
	protected store = injectStore();

	protected constructor() {
		this.collectiblesStore.collectibles.add(this);

		effect(() => {
			this.angle = this.initialAngle();
			this.distance = this.initialDistance();
		});

		inject(DestroyRef).onDestroy(() => {
			this.collectiblesStore.collectibles.delete(this);
		});
	}

	protected rotateAroundSea(object: Object3D, deltaTime: number) {
		this.angle += deltaTime * 1_000 * this.gameStore.state.speed * COLLECTIBLES_SPEED;
		if (this.angle > Math.PI * 2) {
			this.angle -= Math.PI * 2;
		}
		object.position.x = Math.cos(this.angle) * (this.distance ?? 1);
		object.position.y = -SEA_RADIUS + Math.sin(this.angle) * (this.distance ?? 1);
	}

	protected collide(a: Object3D, b: Object3D, tolerance: number) {
		const diffPos = a.position.clone().sub(b.position.clone());
		const d = diffPos.length();
		return d < tolerance;
	}
}

export class CollectiblesStore {
	collectibles = new Set<Collectible>();

	private gameStore = inject(GameStore);

	coins = signal<
		Array<{
			key: number;
			state: WritableSignal<'spawned' | 'collected' | 'skipped'>;
			angle: number;
			distance: number;
			positionY: number;
			positionX: number;
		}>
	>([]);

	spawnCoins() {
		const nCoins = 1 + Math.floor(Math.random() * 10);
		const d = SEA_RADIUS + PLANE_DEFAULT_HEIGHT + this.randomFromRange(-1, 1) * (PLANE_AMP_HEIGHT - 20);
		const amplitude = 10 + Math.round(Math.random() * 10);

		this.coins.update((prev) => [
			...prev,
			...Array.from({ length: nCoins }).map((_, index) => {
				const angle = -(index * 0.02);
				const distance = d + Math.cos(index * 0.5) * amplitude;

				return {
					key: this.gameStore.statistics.coinsSpawned + index,
					state: signal<'spawned' | 'collected' | 'skipped'>('spawned'),
					angle,
					distance,
					positionY: -SEA_RADIUS + Math.sin(angle) * distance,
					positionX: Math.cos(angle) * distance,
				};
			}),
		]);
		this.gameStore.statistics.coinsSpawned += nCoins;
	}

	private randomFromRange(min: number, max: number) {
		return min + Math.random() * (max - min);
	}
}
