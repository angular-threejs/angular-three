import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { CollectiblesStore } from './collectible/collectibles.store';
import { Experience } from './experience';
import { GameStore } from './game.store';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="sceneGraph" [camera]="{ fov: 50, near: 0.1, far: 10000 }" [shadows]="true" />
		<span class="absolute top-4 right-4 font-mono text-lg text-[#ffd700] font-bold">
			Coins: {{ gameStore.coins() }}
		</span>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas],
	providers: [GameStore, CollectiblesStore],
	styles: `
		:host {
			display: block;
			height: 100%;
			width: 100%;
			background: linear-gradient(#101232, #101560);
		}
	`,
})
export default class Aviator {
	protected sceneGraph = Experience;
	protected gameStore = inject(GameStore);
}
