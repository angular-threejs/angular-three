/* credit: https://codesandbox.io/p/sandbox/react-postprocessing-dof-blob-forked-7hj8w3?file=/src/App.js:29,15 */

import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	type ElementRef,
	input,
	viewChild,
	viewChildren,
} from '@angular/core';
import { extend, injectBeforeRender, injectLoader, NgtArgs, NgtCanvas } from 'angular-three';
import { NgtpBloom, NgtpDepthOfField, NgtpEffectComposer, NgtpVignette } from 'angular-three-postprocessing';
import { injectTexture, NgtsLoader } from 'angular-three-soba/loaders';
import { NgtsMeshDistortMaterial } from 'angular-three-soba/materials';
import * as THREE from 'three';
import { CubeTextureLoader, Material, MathUtils, type Mesh } from 'three';

extend(THREE);

@Component({
	selector: 'app-main-sphere',
	standalone: true,
	template: `
		<ngt-mesh #mesh [material]="material()">
			<ngt-icosahedron-geometry *args="[1, 4]" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class MainSphere {
	material = input.required<Material>();

	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		injectBeforeRender(({ clock, pointer }) => {
			const mesh = this.meshRef().nativeElement;
			mesh.rotation.z = clock.getElapsedTime();
			mesh.rotation.y = MathUtils.lerp(mesh.rotation.y, pointer.x * Math.PI, 0.1);
			mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, pointer.y * Math.PI, 0.1);
		});
	}
}

@Component({
	selector: 'app-sphere-instances',
	standalone: true,
	template: `
		<!-- we render the material with attach="none" so we can share it between instances -->
		<ngts-mesh-distort-material #distortMaterial attach="none" [options]="materialOptions()" />

		<app-main-sphere [material]="distortMaterial.material" />
		@for (position of initialPositions; track $index) {
			<ngt-mesh #mesh [material]="distortMaterial.material" [position]="position">
				<ngt-icosahedron-geometry *args="[1, 4]" />
			</ngt-mesh>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [MainSphere, NgtArgs, NgtsMeshDistortMaterial],
})
export class SphereInstances {
	private envMap = injectLoader(
		// @ts-expect-error - CubeTextureLoader is ok
		() => CubeTextureLoader,
		() => [['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']],
		{ extensions: (loader) => loader.setPath('/cube/') },
	);
	private bumpMap = injectTexture(() => '/bump.jpg');

	materialOptions = computed(() => ({
		envMap: this.envMap()?.[0],
		bumpMap: this.bumpMap(),
		emissive: '#010101',
		emissiveIntensity: 2,
		roughness: 0.1,
		metalness: 1,
		bumpScale: 0.005,
		clearcoat: 1,
		clearcoatRoughness: 1,
		radius: 1,
		distort: 0.4,
		toneMapped: false,
	}));

	initialPositions = [
		[-4, 20, -12],
		[-10, 12, -4],
		[-11, -12, -23],
		[-16, -6, -10],
		[12, -2, -3],
		[13, 4, -12],
		[14, -2, -23],
		[8, 10, -20],
	];

	private meshesRef = viewChildren<ElementRef<Mesh>>('mesh');

	constructor() {
		injectBeforeRender(() => {
			const meshes = this.meshesRef();
			meshes.forEach(({ nativeElement: mesh }) => {
				mesh.position.y += 0.02;
				if (mesh.position.y > 19) mesh.position.y = -18;
				mesh.rotation.x += 0.06;
				mesh.rotation.y += 0.06;
				mesh.rotation.z += 0.02;
			});
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['#050505']" />
		<ngt-fog attach="fog" *args="['#161616', 8, 30]" />

		<app-sphere-instances />

		<ngtp-effect-composer [options]="{ multisampling: 0, disableNormalPass: true }">
			<ngtp-depth-of-field [options]="{ focusDistance: 0, focalLength: 0.02, bokehScale: 2, height: 480 }" />
			<ngtp-bloom [options]="{ kernelSize: 3, luminanceThreshold: 0, luminanceSmoothing: 0.9, intensity: 1.5 }" />
			<ngtp-vignette [options]="{ eskil: false, offset: 0.1, darkness: 1.1 }" />
		</ngtp-effect-composer>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [SphereInstances, NgtArgs, NgtpEffectComposer, NgtpDepthOfField, NgtpBloom, NgtpVignette],
})
export class SceneGraph {}

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="sceneGraph" [camera]="{ position: [0, 0, 3] }" />
		<ngts-loader />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'postprocessing-sample' },
	imports: [NgtCanvas, NgtsLoader],
})
export default class PostprocessingSample {
	sceneGraph = SceneGraph;
}
