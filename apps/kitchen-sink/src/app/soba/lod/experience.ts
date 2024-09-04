import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, Signal } from '@angular/core';
import { NgtEuler, NgtVector3 } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsBakeShadows } from 'angular-three-soba/misc';
import { NgtsDetailed } from 'angular-three-soba/performances';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import { Mesh, MeshStandardMaterial } from 'three';
import { GLTF } from 'three-stdlib';

const positions = [...Array(800)].map(() => ({
	position: [40 - Math.random() * 80, 40 - Math.random() * 80, 40 - Math.random() * 80],
	rotation: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
})) as Array<{ position: [number, number, number]; rotation: [number, number, number] }>;

interface BustGLTF extends GLTF {
	nodes: { Mesh_0001: Mesh };
	materials: { default: MeshStandardMaterial };
}

@Component({
	selector: 'app-bust',
	standalone: true,
	template: `
		<ngts-detailed [distances]="[0, 15, 25, 35, 100]" [options]="{ position: position(), rotation: rotation() }">
			@for (level of gltfs() || []; track $index) {
				<ngt-mesh
					[receiveShadow]="true"
					[castShadow]="true"
					[geometry]="level.nodes.Mesh_0001.geometry"
					[material]="level.materials.default"
				>
					<ngt-value [rawValue]="0.25" attach="material.envMapIntensity" />
				</ngt-mesh>
			}
		</ngts-detailed>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsDetailed],
})
export class LODBust {
	position = input<NgtVector3>([0, 0, 0]);
	rotation = input<NgtEuler>([0, 0, 0]);

	protected gltfs = injectGLTF(() => [
		'./bust-1-d.glb',
		'./bust-2-d.glb',
		'./bust-3-d.glb',
		'./bust-4-d.glb',
		'./bust-5-d.glb',
	]) as Signal<BustGLTF[] | null>;
}

@Component({
	standalone: true,
	template: `
		@for (p of positions; track $index) {
			<app-bust [position]="p.position" [rotation]="p.rotation" />
		}
		<ngts-orbit-controls [options]="{ autoRotate: true, autoRotateSpeed: 0.5, zoomSpeed: 0.075 }" />
		<ngt-point-light [intensity]="0.5 * Math.PI" [decay]="0" />
		<ngt-spot-light [position]="50" [intensity]="1.5 * Math.PI" [castShadow]="true" [decay]="0" />
		<ngts-environment [options]="{ preset: 'city' }" />
		<ngts-bake-shadows />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsBakeShadows, NgtsEnvironment, NgtsOrbitControls, LODBust],
	host: { class: 'lod-soba-experience' },
})
export class Experience {
	protected Math = Math;
	protected positions = positions;
}
