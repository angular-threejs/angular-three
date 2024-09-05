import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, Signal } from '@angular/core';
import { injectGLTF } from 'angular-three-soba/loaders';
import { injectMask } from 'angular-three-soba/staging';
import { Mesh, MeshPhongMaterial, MeshStandardMaterial } from 'three';
import { GLTF } from 'three-stdlib';

type AngularGLTF = GLTF & {
	nodes: { Curve: Mesh; Curve001: Mesh; Curve002: Mesh; Curve003: Mesh };
	materials: { SVGMat: MeshStandardMaterial };
};

@Component({
	selector: 'app-angular',
	standalone: true,
	template: `
		@if (gltf(); as gltf) {
			<ngt-group [dispose]="null" [scale]="scale()" [position]="[-2.75, -3, 0]" [rotation]="[Math.PI / 2, 0, 0]">
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve001.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve002.geometry"
					[material]="material()"
				/>
				<ngt-mesh
					[castShadow]="true"
					[receiveShadow]="true"
					[geometry]="gltf.nodes.Curve003.geometry"
					[material]="material()"
				/>
			</ngt-group>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Angular {
	protected readonly Math = Math;

	invert = input(false);
	scale = input(1);

	protected gltf = injectGLTF(() => './angular.glb') as Signal<AngularGLTF | null>;
	protected stencilParameters = injectMask(() => 1, this.invert);

	protected material = computed(() => {
		const stencilParameters = this.stencilParameters();
		return new MeshPhongMaterial({ color: '#E72BAA', ...stencilParameters });
	});
}
