import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	input,
	output,
	signal,
	Signal,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, NgtVector3, NON_ROOT } from 'angular-three';
import { NgtrRigidBody } from 'angular-three-rapier';
import { injectGLTF } from 'angular-three-soba/loaders';
import { Mesh, Vector3Like } from 'three';
import { GLTF } from 'three-stdlib';
import { injectSuzanne } from '../suzanne';

@Component({
	selector: 'app-monkey',
	standalone: true,
	template: `
		@if (gltf(); as gltf) {
			<ngt-object3D ngtrRigidBody [position]="position()">
				<ngt-mesh [geometry]="gltf.nodes.Suzanne.geometry" [castShadow]="true" [receiveShadow]="true">
					<ngt-mesh-physical-material [roughness]="0" [transmission]="0" [thickness]="0.2" [ior]="1.5" color="orange" />
				</ngt-mesh>
			</ngt-object3D>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrRigidBody],
})
export class Monkey {
	position = input<NgtVector3 | undefined>([0, 0, 0]);

	dead = output<Vector3Like>();

	protected gltf = injectSuzanne();
	private rigidBody = viewChild(NgtrRigidBody);

	constructor() {
		injectBeforeRender(() => {
			const rigidBody = this.rigidBody()?.rigidBody();
			if (!rigidBody) return;
			if (rigidBody.translation().y < -10) {
				this.dead.emit(rigidBody.translation());
			}
		});
	}
}

@Component({
	selector: 'app-monkey-swarm',
	standalone: true,
	template: `
		<ngt-group [position]="[0, 4, 0]" [scale]="0.3">
			@for (monkey of monkeys(); track monkey.key) {
				<app-monkey [position]="monkey.position" (dead)="onDead(monkey.key)" />
			}
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [Monkey],
})
export class MonkeySwarm {
	protected monkeys = signal<Array<{ key: number; position: [number, number, number] }>>([]);

	constructor() {
		effect((onCleanup) => {
			const id = setInterval(() => {
				this.monkeys.update((prev) => [
					...prev,
					{
						key: Math.random() + Date.now(),
						position: [Math.random() * 10 - 5, Math.random(), Math.random() * 10 - 5] as [number, number, number],
					},
				]);
			}, 50);
			onCleanup(() => {
				clearInterval(id);
			});
		});
	}

	onDead(dead: number) {
		this.monkeys.update((prev) => prev.filter((monkey) => monkey.key !== dead));
	}
}

type BendyGLTF = GLTF & {
	nodes: { BezierCurve: Mesh };
};

@Component({
	selector: 'app-bendy',
	standalone: true,
	template: `
		<ngt-group [position]="position()" [scale]="scale()">
			@if (gltf(); as gltf) {
				<ngt-object3D ngtrRigidBody="fixed" [options]="{ colliders: 'trimesh' }">
					<ngt-mesh [geometry]="gltf.nodes.BezierCurve.geometry" [castShadow]="true">
						<ngt-mesh-physical-material [transmission]="0.99" [thickness]="2" [roughness]="0" [ior]="1.5" />
					</ngt-mesh>
				</ngt-object3D>
			}
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrRigidBody],
})
export class Bendy {
	position = input<NgtVector3>([0, 0, 0]);
	scale = input<NgtVector3>([1, 1, 1]);

	protected gltf = injectGLTF(() => './bendy.glb') as Signal<BendyGLTF | null>;
}

@Component({
	standalone: true,
	template: `
		<ngt-group>
			<app-bendy />
			<app-bendy [position]="[0, 0, 4]" [scale]="0.5" />
			<app-bendy [position]="[-3, 0, 2]" [scale]="0.5" />

			<app-monkey-swarm />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'performance-rapier' },
	imports: [Bendy, MonkeySwarm],
})
export class PerformanceExample {
	static [NON_ROOT] = true;
}
