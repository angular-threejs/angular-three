import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, input } from '@angular/core';
import { applyProps, NgtArgs } from 'angular-three';
import { injectGLTF } from 'angular-three-soba/loaders';
import { Mesh } from 'three';
import { color } from './color';

@Component({
	selector: 'app-porsche',
	standalone: true,
	template: `
		<ngt-primitive *args="[model()]" [parameters]="{ position: position(), rotation: rotation(), scale: scale() }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class Model {
	position = input([0, 0, 0]);
	rotation = input([0, 0, 0]);
	scale = input(1);

	private gltf = injectGLTF(() => './911-transformed.glb');
	protected model = computed(() => {
		const gltf = this.gltf();
		if (!gltf) return null;
		const { scene, nodes, materials } = gltf;

		Object.values(nodes).forEach((node) => {
			if ((node as Mesh).isMesh) {
				node.receiveShadow = node.castShadow = true;
			}
		});

		applyProps(materials['rubber'], { color: '#222', roughness: 0.6, roughnessMap: null, normalScale: [4, 4] });
		applyProps(materials['window'], { color: 'black', roughness: 0, clearcoat: 0.1 });
		applyProps(materials['coat'], { envMapIntensity: 4, roughness: 0.5, metalness: 1 });
		applyProps(materials['paint'], { envMapIntensity: 2, roughness: 0.45, metalness: 0.8, color: color() });

		return scene;
	});

	constructor() {
		effect(() => {
			const gltf = this.gltf();
			if (!gltf) return;
			const { materials } = gltf;
			applyProps(materials['paint'], { color: color() });
		});
	}
}
