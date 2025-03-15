import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	signal,
	viewChild,
} from '@angular/core';
import { extend, injectBeforeRender, injectLoader, injectStore } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import { TweakpaneCheckbox, TweakpaneColor, TweakpaneNumber, TweakpanePane } from 'angular-three-tweakpane';
import { GLTF, RGBELoader } from 'three-stdlib';
import * as THREE from 'three/webgpu';
import { DirectionalLight, MeshPhysicalNodeMaterial } from 'three/webgpu';
import { SliceMaterial } from './slice-material';

import gearsGLB from './gears.glb' with { loader: 'file' };
import royalHDR from './royal_esplanade_1k.hdr' with { loader: 'file' };

injectGLTF.preload(() => gearsGLB);

interface GearsGLB extends GLTF {
	nodes: { axle: THREE.Mesh; gears: THREE.Mesh; outerHull: THREE.Mesh };
}

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngts-perspective-camera [options]="{ makeDefault: true, position: [-5, 5, 5] }" />

		<ngt-directional-light
			castShadow
			[intensity]="4"
			[position]="[6.25, 3, 4]"
			[shadow.camera.near]="0.1"
			[shadow.camera.far]="30"
			[shadow.camera.left]="-8"
			[shadow.camera.right]="8"
			[shadow.camera.top]="8"
			[shadow.camera.bottom]="-8"
			[shadow.camera.normalBias]="0.05"
			[shadow.mapSize.x]="2048"
			[shadow.mapSize.y]="2048"
		/>

		<ng-template #mesh let-mesh>
			<ngt-mesh
				[geometry]="mesh.geometry"
				[scale]="mesh.scale"
				[position]="mesh.position"
				[rotation]="mesh.rotation"
				castShadow
				receiveShadow
			>
				<ngt-mesh-physical-material [parameters]="{ metalness, roughness, envMapIntensity, color }" />
			</ngt-mesh>
		</ng-template>

		<ngt-group #gears>
			@if (gltf(); as gltf) {
				@let gears = gltf.nodes.gears;
				@let axle = gltf.nodes.axle;
				@let outerHull = gltf.nodes.outerHull;

				<ng-container [ngTemplateOutlet]="mesh" [ngTemplateOutletContext]="{ $implicit: gears }" />
				<ng-container [ngTemplateOutlet]="mesh" [ngTemplateOutletContext]="{ $implicit: axle }" />

				<ngt-mesh
					[geometry]="outerHull.geometry"
					[scale]="outerHull.scale"
					[position]="outerHull.position"
					[rotation]="outerHull.rotation"
					castShadow
					receiveShadow
				>
					<ngt-mesh-physical-node-material
						slice
						[arcAngle]="arcAngle()"
						[startAngle]="startAngle()"
						[sliceColor]="sliceColor()"
						[parameters]="{ metalness, roughness, envMapIntensity, color }"
					/>
				</ngt-mesh>
			}
		</ngt-group>

		<ngt-mesh [position]="[-4, -3, -4]" [scale]="10" receiveShadow (updated)="$event.lookAt(0, 0, 0)">
			<ngt-plane-geometry />
			<ngt-mesh-standard-material color="#aaaaaa" />
		</ngt-mesh>

		<ngts-orbit-controls [options]="{ zoomSpeed: 0.2 }" />

		<tweakpane-pane title="Slice Material" left="8px">
			<tweakpane-checkbox [(value)]="rotate" label="rotate" />
			<tweakpane-color [(value)]="sliceColor" label="slice color" />
			<tweakpane-number
				[(value)]="startAngleDegrees"
				label="start angle degrees"
				debounce="0"
				[params]="{ min: 0, max: 360, step: 1 }"
			/>
			<tweakpane-number
				[(value)]="arcAngleDegrees"
				label="arc angle degrees"
				debounce="0"
				[params]="{ min: 0, max: 360, step: 1 }"
			/>
		</tweakpane-pane>
	`,
	imports: [
		NgtsPerspectiveCamera,
		NgtsOrbitControls,
		NgTemplateOutlet,
		SliceMaterial,
		TweakpanePane,
		TweakpaneColor,
		TweakpaneCheckbox,
		TweakpaneNumber,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SceneGraph {
	private gearsRef = viewChild.required<ElementRef<THREE.Group>>('gears');

	protected environmentMap = injectLoader(
		() => RGBELoader,
		() => royalHDR,
	);
	protected gltf = injectGLTF<GearsGLB>(() => gearsGLB);

	private store = injectStore();

	protected metalness = 0.5;
	protected roughness = 0.25;
	protected envMapIntensity = 0.5;
	protected color = '#858080';

	protected rotate = signal(true);
	protected sliceColor = signal('#9370DB');
	protected startAngleDegrees = signal(60);
	protected arcAngleDegrees = signal(90);

	protected arcAngle = computed(() => THREE.MathUtils.DEG2RAD * this.arcAngleDegrees());
	protected startAngle = computed(() => THREE.MathUtils.DEG2RAD * this.startAngleDegrees());

	constructor() {
		extend({ MeshPhysicalNodeMaterial, DirectionalLight });

		injectBeforeRender(({ delta }) => {
			if (!this.rotate()) return;
			this.gearsRef().nativeElement.rotation.y += 0.1 * delta;
		});

		effect((onCleanup) => {
			const environmentMap = this.environmentMap();
			if (!environmentMap) return;

			const scene = this.store.scene();

			const oldBackground = scene.background;
			const oldEnvironment = scene.environment;
			const blurriness = scene.backgroundBlurriness;

			environmentMap.mapping = THREE.EquirectangularReflectionMapping;

			scene.background = environmentMap;
			scene.backgroundBlurriness = 0.5;
			scene.environment = environmentMap;

			onCleanup(() => {
				scene.background = oldBackground;
				scene.environment = oldEnvironment;
				scene.backgroundBlurriness = blurriness;
			});
		});
	}
}
