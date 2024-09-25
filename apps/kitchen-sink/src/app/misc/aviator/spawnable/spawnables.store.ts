import {
	DestroyRef,
	Directive,
	effect,
	ElementRef,
	inject,
	Injectable,
	InjectionToken,
	input,
	Signal,
} from '@angular/core';
import { injectBeforeRender, injectStore } from 'angular-three';
import { injectIntersect } from 'angular-three-soba/misc';
import { gsap, Power2 } from 'gsap';
import { expo } from 'maath/easing';
import { ColorRepresentation, Mesh, MeshPhongMaterial, Object3D, TetrahedronGeometry, Vector3 } from 'three';
import { ATTRACTION_FACTOR, SEA_RADIUS, SPAWNABLES_SPEED } from '../constants';
import { GameStore } from '../game.store';

const particleGeometry = new TetrahedronGeometry(3, 0);
const particleMaterial = new MeshPhongMaterial({ shininess: 0, specular: 0xffffff, flatShading: true });

export const SPAWNABLE_DISTANCE_TOLERANCE = new InjectionToken<number>('SPAWNABLE_DISTANCE_TOLERANCE');
export const SPAWNABLE_PARTICLE_COLOR = new InjectionToken<ColorRepresentation>('SPAWNABLE_PARTICLE_COLOR');
export const SPAWNABLE_ATTRACTABLE = new InjectionToken<boolean>('SPAWNABLE_ATTRACTABLE', { factory: () => false });

@Directive({ standalone: true })
export class Spawnable {
	initialAngle = input(0);
	initialDistance = input(0);
	positionX = input(0);
	positionY = input(0);

	private angle = 0;
	private distance = 0;

	private destroyRef = inject(DestroyRef);
	private gameStore = inject(GameStore);
	private store = injectStore();

	private distanceTolerance = inject(SPAWNABLE_DISTANCE_TOLERANCE);
	private particleColor = inject(SPAWNABLE_PARTICLE_COLOR);
	private attractable = inject(SPAWNABLE_ATTRACTABLE);

	// TODO: is there a better way to do this?
	//  We need the actual Object3D here and usually this will be the viewChild on the bottom-most of the composition hierarchy.
	//  We can't exactly use InjectionToken because of circular dependency.
	private spawnable?: Signal<ElementRef<Object3D> | undefined>;
	private onCollides: Array<() => void> = [];
	private onSkips: Array<() => void> = [];

	private isIntersect = injectIntersect(() => this.spawnable?.()?.nativeElement);

	private tempVector = new Vector3();

	constructor() {
		effect(() => {
			this.angle = this.initialAngle();
			this.distance = this.initialDistance();
		});

		injectBeforeRender(({ delta, clock }) => {
			const spawnable = this.spawnable?.()?.nativeElement;
			if (!spawnable) return;

			const airplane = this.gameStore.airplaneRef?.()?.nativeElement;
			if (!airplane) return;

			this.rotateAroundSea(spawnable, delta);

			const magnetValue = this.gameStore.magnet();

			if (this.attractable && magnetValue > 0 && this.angle > Math.PI / 2.1 && this.isIntersect()) {
				this.attractToAirplane(spawnable, airplane, clock.elapsedTime);
			}

			if (this.collide()) {
				this.spawnParticles(5, 0.8);
				this.onCollides.forEach((onCollide) => onCollide());
			} else if (this.angle > Math.PI) {
				this.onSkips.forEach((onSkip) => onSkip());
			}
		});

		this.destroyRef.onDestroy(() => {});
	}

	assignSpawnable(spawnable: Signal<ElementRef<Object3D> | undefined>) {
		this.spawnable = spawnable;
	}

	onCollide(callback: () => void) {
		this.onCollides.push(callback);
	}

	onSkip(callback: () => void) {
		this.onSkips.push(callback);
	}

	private rotateAroundSea(object: Object3D, deltaTime: number) {
		this.angle += deltaTime * 1_000 * this.gameStore.state.speed * SPAWNABLES_SPEED;
		if (this.angle > Math.PI * 2) {
			this.angle -= Math.PI * 2;
		}
		object.position.x = Math.cos(this.angle) * (this.distance ?? 1);
		object.position.y = -SEA_RADIUS + Math.sin(this.angle) * (this.distance ?? 1);
	}

	private collide() {
		const spawnable = this.spawnable?.()?.nativeElement;
		if (!spawnable) return false;

		const airplane = this.gameStore.airplaneRef?.()?.nativeElement;
		if (!airplane) return false;

		const diffPos = airplane.position.clone().sub(spawnable.position.clone());
		const d = diffPos.length();
		return d < this.distanceTolerance;
	}

	// NOTE: we don't render the particles on the template because of performance
	//  If we were to render them on the template, we would need to use a Signal for the condition render.
	//  This would mean triggering CD.
	private spawnParticles(count: number, scale: number) {
		const pos = this.spawnable?.()?.nativeElement.position.clone();
		if (!pos) return;

		for (let i = 0; i < count; i++) {
			const mesh = new Mesh(particleGeometry, particleMaterial);
			this.store.snapshot.scene.add(mesh);

			mesh.visible = true;

			mesh.position.copy(pos);
			mesh.scale.setScalar(scale);

			mesh.material.color.set(this.particleColor);
			mesh.material.needsUpdate = true;

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

	// TODO: make this better. This sucks!
	private attractToAirplane(spawnable: Object3D, airplane: Object3D, elapsedTime: number) {
		this.tempVector.subVectors(airplane.position, spawnable.position);
		const easeFactor = expo.out((Math.sin(elapsedTime * 2) + 1) / 2);
		spawnable.position.add(this.tempVector.multiplyScalar(easeFactor * ATTRACTION_FACTOR));
	}
}

@Injectable()
export class SpawnablesStore {}
