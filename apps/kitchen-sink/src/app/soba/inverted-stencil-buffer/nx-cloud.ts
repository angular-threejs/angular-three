import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, Signal } from '@angular/core';
import { injectGLTF } from 'angular-three-soba/loaders';
import { injectMask } from 'angular-three-soba/staging';
import { Mesh, MeshPhongMaterial, MeshStandardMaterial } from 'three';
import { GLTF } from 'three-stdlib';

type NxCloudGLTF = GLTF & {
	nodes: {
		Curve012: Mesh;
		Curve013: Mesh;
		Curve014: Mesh;
		Curve015: Mesh;
		Curve016: Mesh;
		Curve017: Mesh;
		Curve018: Mesh;
		Curve019: Mesh;
	};
	materials: { 'SVGMat.007': MeshStandardMaterial };
};
@Component({
	selector: 'app-nx-cloud',
	standalone: true,
	template: `
		@if (gltf(); as gltf) {
			<ngt-group [dispose]="null" [scale]="scale()" [position]="[-3, -0.5, 0]" [rotation]="[Math.PI / 2, 0, 0]">
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve012.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve013.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve014.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve015.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve016.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve017.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve018.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve019.geometry"
					[material]="material()"
				/>
			</ngt-group>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NxCloud {
	protected readonly Math = Math;

	invert = input(false);
	scale = input(1);

	protected gltf = injectGLTF(() => './nx-cloud.glb') as Signal<NxCloudGLTF | null>;
	protected stencilParameters = injectMask(() => 1, this.invert);

	protected material = computed(() => {
		const stencilParameters = this.stencilParameters();
		return new MeshPhongMaterial({ color: '#002f56', ...stencilParameters });
	});
}
