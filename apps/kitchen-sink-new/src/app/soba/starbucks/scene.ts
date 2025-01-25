import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { NgtArgs, NgtEuler, NgtVector3 } from 'angular-three';
import { NgtsOrthographicCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsPivotControls, OnDragParameters } from 'angular-three-soba/gizmos';
import { injectGLTF, injectTexture } from 'angular-three-soba/loaders';
import { NgtsDecal } from 'angular-three-soba/misc';
import { NgtsAccumulativeShadows, NgtsRandomizedLights } from 'angular-three-soba/staging';
import { Euler, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import { GLTF } from 'three-stdlib';

type CupGLTF = GLTF & {
	nodes: { coffee_cup_top_16oz: Mesh };
	materials: { ['13 - Default']: MeshStandardMaterial };
};
@Component({
	selector: 'app-cup',
	template: `
		@if (gltf(); as gltf) {
			<ngt-mesh
				castShadow
				[geometry]="gltf.nodes.coffee_cup_top_16oz.geometry"
				[material]="gltf.materials['13 - Default']"
				[dispose]="null"
				[position]="[0, -1, 0]"
				[scale]="2"
			>
				<ngt-value [rawValue]="1" attach="material.aoMapIntensity" />
				<ngt-group [position]="[0, 0.75, 0.5]">
					<ngts-pivot-controls
						[options]="{ activeAxes: [true, true, false], scale: 0.55 }"
						(dragged)="onDrag($event)"
					/>
				</ngt-group>
				<ngts-decal
					[options]="{ map: texture(), position: position(), rotation: rotation(), scale: scale(), depthTest: true }"
				/>
			</ngt-mesh>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsPivotControls, NgtsDecal],
})
export class Cup {
	protected position = signal<NgtVector3>([0, 0.75, 0.3]);
	protected rotation = signal<NgtEuler>([0, 0, 0]);
	protected scale = signal<NgtVector3>([0.6, 0.6, 0.6]);

	protected gltf = injectGLTF<CupGLTF>(() => './coffee-transformed.glb');
	protected texture = injectTexture(() => './1200px-Starbucks_Logo_ab_2011.svg.png');

	private p = new Vector3();
	private s = new Vector3();
	private q = new Quaternion();

	onDrag({ l }: OnDragParameters) {
		l.decompose(this.p, this.q, this.s);
		const rotation = new Euler().setFromQuaternion(this.q);
		this.position.set([this.p.x, this.p.y + 0.75, this.p.z + 0.3]);
		this.rotation.set([rotation.x, rotation.y, rotation.z]);
		this.scale.set([0.6 * this.s.x, 0.6 * this.s.y, 0.6 * this.s.z]);
	}
}

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngts-orthographic-camera [options]="{ makeDefault: true, position: [0, 10, 100], zoom: 140 }" />

		<ngt-color attach="background" *args="['#027946']" />

		<ngt-ambient-light [intensity]="0.5 * Math.PI" />
		<ngt-directional-light [intensity]="0.5 * Math.PI" [position]="[10, 10, 10]" />

		<app-cup />

		<ngts-accumulative-shadows
			[options]="{ temporal: true, frames: 100, alphaTest: 0.85, opacity: 1, scale: 25, position: [0, -1, 0] }"
		>
			<ngts-randomized-lights
				[options]="{ amount: 8, radius: 10, ambient: 0.7, position: [10, 10, -5], bias: 0.01, size: 10 }"
			/>
		</ngts-accumulative-shadows>

		<ngts-orbit-controls [options]="{ makeDefault: true }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsOrthographicCamera, NgtArgs, Cup, NgtsAccumulativeShadows, NgtsRandomizedLights, NgtsOrbitControls],
	host: { class: 'starbucks-soba-experience' },
})
export class SceneGraph {
	protected readonly Math = Math;
}
