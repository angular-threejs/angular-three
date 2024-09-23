import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, viewChild } from '@angular/core';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { gsap, Power2 } from 'gsap';
import {
	Color,
	ColorRepresentation,
	CylinderGeometry,
	Mesh,
	MeshPhongMaterial,
	TetrahedronGeometry,
	Vector3,
} from 'three';
import { COIN_DISTANCE_TOLERANCE, COLOR_COINS } from '../constants';
import { Collectible } from './collectibles.store';

const coinGeometry = new CylinderGeometry(4, 4, 1, 10);
const coinMaterial = new MeshPhongMaterial({
	color: COLOR_COINS,
	shininess: 1,
	specular: 0xffffff,
	flatShading: true,
});

const particleGeometry = new TetrahedronGeometry(3, 0);
const particleMaterial = new MeshPhongMaterial({
	color: 0x009999,
	shininess: 0,
	specular: 0xffffff,
	flatShading: true,
});

@Component({
	selector: 'app-coin',
	standalone: true,
	template: `
		<ngt-mesh
			#coin
			[castShadow]="true"
			[geometry]="coinGeometry"
			[material]="coinMaterial"
			[position]="[positionX(), positionY(), 0]"
		/>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class Coin extends Collectible {
	protected coinGeometry = coinGeometry;
	protected coinMaterial = coinMaterial;

	private coinRef = viewChild.required<ElementRef<Mesh>>('coin');

	constructor() {
		super();
		injectBeforeRender(({ delta }) => {
			const coin = this.coinRef().nativeElement;
			if (!coin) return;

			this.rotateAroundSea(coin, delta);

			coin.rotation.x += Math.random() * 0.1;
			coin.rotation.y += Math.random() * 0.1;

			const airplane = this.gameStore.airplane();
			if (!airplane) return;

			if (this.collide(airplane, coin, COIN_DISTANCE_TOLERANCE)) {
				this.spawnParticles(coin.position.clone(), 5, COLOR_COINS, 0.8);
				this.gameStore.incrementCoin();
				this.state.set('collected');
			} else if (this.angle > Math.PI) {
				this.state.set('skipped');
			}
		});
	}

	// NOTE: we don't render the particles on the template because of performance
	//  If we were to render them on the template, we would need to use a Signal for the condition render.
	//  This would mean triggering CD.
	private spawnParticles(pos: Vector3, count: number, color: ColorRepresentation, scale: number) {
		for (let i = 0; i < count; i++) {
			const mesh = new Mesh(particleGeometry, particleMaterial);
			this.store.snapshot.scene.add(mesh);

			mesh.visible = true;
			mesh.position.copy(pos);
			mesh.material.color = new Color(color);
			mesh.material.needsUpdate = true;
			mesh.scale.set(scale, scale, scale);
			const targetX = pos.x + (-1 + Math.random() * 2) * 50;
			const targetY = pos.y + (-1 + Math.random() * 2) * 50;
			const targetZ = pos.z + (-1 + Math.random() * 2) * 50;
			const speed = 0.6 + Math.random() * 0.2;
			gsap.to(mesh.rotation, {
				duration: speed,
				x: Math.random() * 12,
				y: Math.random() * 12,
			});
			gsap.to(mesh.scale, { duration: speed, x: 0.1, y: 0.1, z: 0.1 });
			gsap.to(mesh.position, {
				duration: speed,
				x: targetX,
				y: targetY,
				z: targetZ,
				delay: Math.random() * 0.1,
				ease: Power2.easeOut,
				onComplete: () => {
					this.store.snapshot.scene.remove(mesh);
				},
			});
		}
	}
}
