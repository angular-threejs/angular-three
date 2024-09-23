import { DestroyRef, Directive, inject, model, signal, untracked, WritableSignal } from '@angular/core';
import { PLANE_AMP_HEIGHT, PLANE_DEFAULT_HEIGHT, SEA_RADIUS } from '../constants';
import { GameStore } from '../game.store';
import { Spawnable } from '../spawnable/spawnables.store';

export type CollectibleState = 'spawned' | 'collected' | 'skipped';

@Directive({
	standalone: true,
	hostDirectives: [{ directive: Spawnable, inputs: ['initialAngle', 'initialDistance', 'positionX', 'positionY'] }],
})
export class Collectible {
	state = model.required<CollectibleState>();

	private destroyRef = inject(DestroyRef);
	private collectiblesStore = inject(CollectiblesStore);
	private spawnable = inject(Spawnable, { host: true });

	constructor() {
		this.spawnable.onCollide(() => this.state.set('collected'));
		this.spawnable.onSkip(() => this.state.set('skipped'));

		this.collectiblesStore.collectibles.add(this);
		this.destroyRef.onDestroy(() => {
			this.collectiblesStore.collectibles.delete(this);
		});
	}
}

export class CollectiblesStore {
	collectibles = new Set<Collectible>();

	private gameStore = inject(GameStore);

	coins = signal<
		Array<{
			key: number;
			state: WritableSignal<CollectibleState>;
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
			// NOTE: we filter out all the coins that are already collected or skipped
			...prev.filter((coin) => untracked(coin.state) === 'spawned'),
			...Array.from({ length: nCoins }).map((_, index) => {
				const angle = -(index * 0.02);
				const distance = d + Math.cos(index * 0.5) * amplitude;

				return {
					key: this.gameStore.statistics.coinsSpawned + index,
					state: signal<CollectibleState>('spawned'),
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
