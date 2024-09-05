import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, Signal } from '@angular/core';
import { injectGLTF } from 'angular-three-soba/loaders';
import { injectMask } from 'angular-three-soba/staging';
import { Mesh, MeshPhongMaterial, MeshStandardMaterial } from 'three';
import { GLTF } from 'three-stdlib';

type NxGLTF = GLTF & {
	nodes: { Curve004: Mesh; Curve005: Mesh; Curve006: Mesh; Curve007: Mesh; Curve008: Mesh; Curve009: Mesh };
	materials: { 'SVGMat.001': MeshStandardMaterial };
};

@Component({
	selector: 'app-nx',
	standalone: true,
	template: `
		@if (gltf(); as gltf) {
			<ngt-group [dispose]="null" [scale]="scale()" [position]="[-3, -3, 0]" [rotation]="[Math.PI / 2, 0, 0]">
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve004.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve005.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve006.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve007.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve008.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve009.geometry"
					[material]="material()"
				/>
			</ngt-group>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nx {
	protected readonly Math = Math;

	invert = input(false);
	scale = input(1);

	protected gltf = injectGLTF(() => './nx.glb') as Signal<NxGLTF | null>;
	protected stencilParameters = injectMask(() => 1, this.invert);

	protected material = computed(() => {
		const stencilParameters = this.stencilParameters();
		return new MeshPhongMaterial({ color: '#002f56', ...stencilParameters });
	});
}
