import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	viewChild,
} from '@angular/core';
import { injectBeforeRender } from 'angular-three';
import { CylinderGeometry, Mesh, MeshPhongMaterial } from 'three';
import { COIN_DISTANCE_TOLERANCE, COLOR_COINS } from '../constants';
import { GameStore } from '../game.store';
import {
	Spawnable,
	SPAWNABLE_ATTRACTABLE,
	SPAWNABLE_DISTANCE_TOLERANCE,
	SPAWNABLE_PARTICLE_COLOR,
} from '../spawnable/spawnables.store';
import { Collectible } from './collectibles.store';

const coinGeometry = new CylinderGeometry(4, 4, 1, 10);
const coinMaterial = new MeshPhongMaterial({
	color: COLOR_COINS,
	shininess: 1,
	specular: 0xffffff,
	flatShading: true,
});

@Component({
	selector: 'app-collectible-coin',
	template: `
		<ngt-mesh
			#coin
			[castShadow]="true"
			[geometry]="coinGeometry"
			[material]="coinMaterial"
			[position]="[spawnable.positionX(), spawnable.positionY(), 0]"
		/>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	hostDirectives: [{ directive: Collectible, inputs: ['state'], outputs: ['stateChange'] }],
	providers: [
		{ provide: SPAWNABLE_DISTANCE_TOLERANCE, useValue: COIN_DISTANCE_TOLERANCE },
		{ provide: SPAWNABLE_PARTICLE_COLOR, useValue: COLOR_COINS },
		{ provide: SPAWNABLE_ATTRACTABLE, useValue: true },
	],
})
export class CollectibleCoin {
	protected coinGeometry = coinGeometry;
	protected coinMaterial = coinMaterial;

	private coinRef = viewChild.required<ElementRef<Mesh>>('coin');

	private gameStore = inject(GameStore);
	protected spawnable = inject(Spawnable, { host: true });

	constructor() {
		this.spawnable.assignSpawnable(this.coinRef);
		this.spawnable.onCollide(() => this.gameStore.incrementCoin());

		injectBeforeRender(() => {
			const coin = this.coinRef().nativeElement;
			coin.rotation.x += Math.random() * 0.1;
			coin.rotation.y += Math.random() * 0.1;
		});
	}
}
