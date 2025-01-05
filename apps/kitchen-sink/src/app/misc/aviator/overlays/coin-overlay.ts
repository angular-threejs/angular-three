import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { GameStore } from '../game.store';

@Component({
	selector: 'app-coin-overlay',
	template: `
		<span class="font-mono text-lg text-[#ffd700] font-bold">{{ coinDisplay() }}</span>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'flex items-center' },
})
export class CoinOverlay {
	private gameStore = inject(GameStore);
	protected coinDisplay = computed(() => {
		const coins = this.gameStore.coins();
		const formattedCoins = coins.toString().padStart(4, '0');
		return formattedCoins.replace(/^(\d)(\d{3})$/, '$1,$2');
	});
}
