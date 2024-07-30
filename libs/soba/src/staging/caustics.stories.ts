import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	Signal,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectBeforeRender } from 'angular-three';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsMeshTransmissionMaterial } from 'angular-three-soba/materials';
import {
	NgtsAccumulativeShadows,
	NgtsCaustics,
	NgtsCenter,
	NgtsEnvironment,
	NgtsLightformer,
	NgtsRandomizedLights,
} from 'angular-three-soba/staging';
import { easing } from 'maath';
import { AdditiveBlending, Color, FrontSide, Group, MeshStandardMaterial } from 'three';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	selector: 'caustics-scene',
	standalone: true,
	template: `
		@if (gltf(); as gltf) {
			<ngt-group [dispose]="null">
				<ngts-center [options]="{ top: true, position: [-1, -0.01, -2], rotation: [0, -0.4, 0] }">
					<ngt-mesh
						[castShadow]="true"
						[scale]="1.2"
						[geometry]="gltf.nodes.flowers.geometry"
						[material]="gltf.materials['draifrawer_u1_v1.001']"
					/>
				</ngts-center>

				<ngts-caustics
					[options]="{
						backside: true,
						color,
						focus: [0, -1.2, 0],
						lightSource: [-1.2, 3, -2],
						intensity: 0.003,
						worldRadius: 0.26 / 10,
						ior: 0.9,
						backsideIOR: 1.26,
					}"
				>
					<ngt-mesh [castShadow]="true" [receiveShadow]="true" [geometry]="gltf.nodes.glass.geometry">
						<ngts-mesh-transmission-material
							[options]="{
								backside: true,
								backsideThickness: 0.1,
								thickness: 0.05,
								chromaticAberration: 0.05,
								anisotropicBlur: 1,
								clearcoat: 1,
								clearcoatRoughness: 1,
								envMapIntensity: 2,
							}"
						/>
					</ngt-mesh>
				</ngts-caustics>

				<ngt-mesh [scale]="[0.95, 1, 0.95]" [geometry]="gltf.nodes.glass_back.geometry" [material]="innerMaterial" />
				<ngt-mesh [geometry]="gltf.nodes.glass_inner.geometry" [material]="innerMaterial" />
			</ngt-group>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsCenter, NgtsCaustics, NgtsMeshTransmissionMaterial],
})
class Scene {
	gltf = injectGLTF(() => './glass-transformed.glb') as Signal<any>;
	color = new Color(1, 0.8, 0.8);
	innerMaterial = new MeshStandardMaterial({
		transparent: true,
		opacity: 1,
		color: 'black',
		roughness: 0,
		side: FrontSide,
		blending: AdditiveBlending,
		polygonOffset: true,
		polygonOffsetFactor: 1,
		envMapIntensity: 2,
	});
}

@Component({
	selector: 'caustics-env',
	standalone: true,
	template: `
		<ngts-environment [options]="{ frames: Infinity, preset: 'city', resolution: 256, background: true, blur: 0.8 }">
			<ng-template>
				<ngts-lightformer
					[options]="{ intensity: 4, rotation: [Math.PI / 2, 0, 0], position: [0, 5, -9], scale: [10, 10, 1] }"
				/>
				<ngts-lightformer
					[options]="{ intensity: 4, rotation: [Math.PI / 2, 0, 0], position: [0, 5, -9], scale: [10, 10, 1] }"
				/>
				<ngt-group [rotation]="[Math.PI / 2, 1, 0]">
					@for (positionX of positions; track $index) {
						<ngts-lightformer
							[options]="{
								intensity: 1,
								rotation: [Math.PI / 4, 0, 0],
								position: [positionX, 4, $index * 4],
								scale: [4, 1, 1],
							}"
						/>
					}

					<ngts-lightformer
						[options]="{ intensity: 0.5, rotation: [0, Math.PI / 2, 0], position: [-5, 1, -1], scale: [50, 2, 1] }"
					/>
					<ngts-lightformer
						[options]="{ intensity: 0.5, rotation: [0, Math.PI / 2, 0], position: [-5, -1, -1], scale: [50, 2, 1] }"
					/>
					<ngts-lightformer
						[options]="{ intensity: 0.5, rotation: [0, -Math.PI / 2, 0], position: [10, 1, 0], scale: [50, 2, 1] }"
					/>
				</ngt-group>
				<ngt-group #group>
					<ngts-lightformer
						[options]="{
							intensity: 5,
							form: 'ring',
							color: 'red',
							rotation: [0, Math.PI / 2, 0],
							position: [-5, 2, -1],
							scale: [10, 10, 1],
						}"
					/>
				</ngt-group>
			</ng-template>
		</ngts-environment>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsEnvironment, NgtsLightformer],
})
class Env {
	protected readonly Infinity = Infinity;
	protected readonly Math = Math;

	positions = [2, -2, 2, -4, 2, -5, 2, -9];

	groupRef = viewChild<ElementRef<Group>>('group');

	constructor() {
		injectBeforeRender(({ delta, clock, pointer, camera }) => {
			const group = this.groupRef()?.nativeElement;
			if (!group) return;

			easing.damp3(group.rotation as any, [Math.PI / 2, 0, clock.elapsedTime / 5 + pointer.x], 0.2, delta);
			easing.damp3(
				camera.position,
				[Math.sin(pointer.x / 4) * 9, 1.25 + pointer.y, Math.cos(pointer.x / 4) * 9],
				0.5,
				delta,
			);
			camera.lookAt(0, 0, 0);
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-group [position]="[0, -0.5, 0]" [rotation]="[0, -0.75, 0]">
			<caustics-scene />
			<ngts-accumulative-shadows
				[options]="{ frames: 100, alphaTest: 0.75, opacity: 0.8, color: 'red', scale: 20, position: [0, -0.005, 0] }"
			>
				<ngts-randomized-lights
					[options]="{ amount: 8, radius: 6, ambient: 0.5, position: [-1.5, 2.5, -2.5], bias: 0.001 }"
				/>
			</ngts-accumulative-shadows>
			<caustics-env />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsAccumulativeShadows, NgtsRandomizedLights, Env, Scene],
})
class DefaultCausticsStory {
	protected readonly Math = Math;
}

export default {
	title: 'Staging/Caustics',
	decorators: makeDecorators(),
} as Meta;

// https://codesandbox.io/p/sandbox/caustics-forked-tfvz8j?file=/src/App.js:42,13
export const Default = makeStoryFunction(DefaultCausticsStory, {
	camera: { position: [20, 0.9, 20], fov: 26 },
	background: '#f0f0f0',
	controls: false,
});
