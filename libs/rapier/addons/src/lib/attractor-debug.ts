import { computed, effect, inject, Injector } from '@angular/core';
import { beforeRender, injectStore, pick } from 'angular-three';
import { NgtrPhysics } from 'angular-three-rapier';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { VertexNormalsHelper } from 'three-stdlib';
import { NgtrAttactorOptions } from './attractor';

const _v3 = new THREE.Vector3();

export function injectAttractorDebug(object: THREE.Object3D, options: () => NgtrAttactorOptions, injector?: Injector) {
	return assertInjector(injectAttractorDebug, injector, () => {
		const physics = inject(NgtrPhysics);
		const store = injectStore();

		const strength = pick(options, 'strength');
		const range = pick(options, 'range');
		const color = computed(() => (strength() > 0 ? 0x0000ff : 0xff0000));

		let mesh: THREE.Mesh;
		let normalsHelper: VertexNormalsHelper;

		effect((onCleanup) => {
			if (!physics['debug']()) return;

			mesh = new THREE.Mesh(
				new THREE.SphereGeometry(0.2, 6, 6),
				new THREE.MeshBasicMaterial({ color: color(), wireframe: true }),
			);

			normalsHelper = new VertexNormalsHelper(mesh, range(), color());
			normalsHelper.frustumCulled = false;

			store.snapshot.scene.add(mesh);
			store.snapshot.scene.add(normalsHelper);

			onCleanup(() => {
				if (mesh) {
					store.snapshot.scene.remove(mesh);
				}

				if (normalsHelper) {
					store.snapshot.scene.remove(normalsHelper);
				}
			});
		});

		beforeRender(() => {
			if (!physics['debug']()) return;

			if (mesh) {
				const worldPosition = object.getWorldPosition(_v3);
				mesh.position.copy(worldPosition);
				normalsHelper?.update();
			}
		});
	});
}
