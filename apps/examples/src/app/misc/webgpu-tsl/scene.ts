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
import { extend, injectBeforeRender, injectStore } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import * as THREE from 'three/webgpu';

import { NgTemplateOutlet } from '@angular/common';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import { NgtTweakCheckbox, NgtTweakColor, NgtTweakNumber, NgtTweakPane } from 'angular-three-tweakpane';
import { GLTF } from 'three-stdlib';
import gearsGLB from './gears.glb' with { loader: 'file' };
import { SliceMaterial } from './slice-material';

injectGLTF.preload(() => gearsGLB);

interface GearsGLB extends GLTF {
	nodes: {
		axle: THREE.Mesh;
		gears: THREE.Mesh;
		outerHull: THREE.Mesh;
	};
}

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngts-perspective-camera [options]="{ makeDefault: true, position: [-5, 5, 12] }" />

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

		<ngt-group #gears [position]="gearsPosition">
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
						[parameters]="{ metalness, roughness, envMapIntensity, color, side: DoubleSide }"
					/>
				</ngt-mesh>
			}
		</ngt-group>

		<ngt-mesh #plane [position]="[-4, -3, -4]" [scale]="10" receiveShadow>
			<ngt-plane-geometry />
			<ngt-mesh-standard-material color="#aaaaaa" />
		</ngt-mesh>

		<ngts-environment [options]="{ preset: 'warehouse', background: true, blur: 0.5 }" />
		<ngts-orbit-controls />

		<ngt-tweak-pane title="Slice Material" left="8px">
			<ngt-tweak-checkbox [(value)]="rotate" label="rotate" />
			<ngt-tweak-color [(value)]="sliceColor" label="slice color" />
			<ngt-tweak-number
				[(value)]="startAngleDegrees"
				label="start angle degrees"
				debounce="0"
				[params]="{ min: 0, max: 360, step: 1 }"
			/>
			<ngt-tweak-number
				[(value)]="arcAngleDegrees"
				label="arc angle degrees"
				debounce="0"
				[params]="{ min: 0, max: 360, step: 1 }"
			/>
		</ngt-tweak-pane>
	`,
	imports: [
		NgtsPerspectiveCamera,
		NgtsOrbitControls,
		NgtsEnvironment,
		NgTemplateOutlet,
		SliceMaterial,
		NgtTweakPane,
		NgtTweakColor,
		NgtTweakCheckbox,
		NgtTweakNumber,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SceneGraph {
	protected readonly DoubleSide = THREE.DoubleSide;

	private gearsRef = viewChild.required<ElementRef<THREE.Group>>('gears');
	private planeRef = viewChild.required<ElementRef<THREE.Mesh>>('plane');

	protected gltf = injectGLTF<GearsGLB>(() => gearsGLB);
	private store = injectStore();

	protected metalness = 0.5;
	protected roughness = 0.25;
	protected envMapIntensity = 0.5;
	protected color = '#858080';

	protected gearsPosition = new THREE.Vector3();

	protected rotate = signal(true);
	protected sliceColor = signal('#9370DB');
	protected startAngleDegrees = signal(60);
	protected arcAngleDegrees = signal(90);

	protected arcAngle = computed(() => THREE.MathUtils.DEG2RAD * this.arcAngleDegrees());
	protected startAngle = computed(() => THREE.MathUtils.DEG2RAD * this.startAngleDegrees());

	constructor() {
		extend(THREE);

		injectBeforeRender(({ delta }) => {
			const [gears, plane] = [this.gearsRef().nativeElement, this.planeRef().nativeElement];
			plane.lookAt(gears.position);

			if (!this.rotate()) return;

			gears.rotation.y += 0.1 * delta;
		});

		effect((onCleanup) => {
			const [scene, gl] = [this.store.scene(), this.store.gl()];

			const blurriness = scene.backgroundBlurriness;
			const lastToneMapping = gl.toneMapping;

			scene.backgroundBlurriness = 0.5;
			gl.toneMapping = THREE.ACESFilmicToneMapping;

			onCleanup(() => {
				scene.backgroundBlurriness = blurriness;
				gl.toneMapping = lastToneMapping;
			});
		});
	}
}
