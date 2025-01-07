import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { getLocalState, NgtVector3 } from 'angular-three';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsMeshTransmissionMaterial } from 'angular-three-soba/materials';
import { injectMask } from 'angular-three-soba/staging';
import { Group, Mesh } from 'three';
import { GLTF } from 'three-stdlib';

import shapesGLB from './shapes-transformed.glb';

interface ShapesGLTF extends GLTF {
	nodes: { Cube: Mesh };
}

@Component({
	selector: 'app-tank',
	template: `
		@if (gltf(); as gltf) {
			@let nodes = gltf.nodes;

			<ngt-group [position]="position()" [dispose]="null">
				<ngt-mesh [castShadow]="true" [scale]="[0.61 * 6, 0.8 * 6, 6]" [geometry]="nodes.Cube.geometry">
					<ngts-mesh-transmission-material
						[options]="{
							backside: true,
							samples: 4,
							thickness: 3,
							anisotropy: 0.1,
							iridescence: 1,
							iridescenceIOR: 1,
							iridescenceThicknessRange: [0, 1400],
						}"
					/>
				</ngt-mesh>
				<ngt-group #group>
					<ng-content />
				</ngt-group>
			</ngt-group>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsMeshTransmissionMaterial],
})
export class Tank {
	position = input<NgtVector3>([0, 0, 0]);

	private groupRef = viewChild<ElementRef<Group>>('group');

	protected gltf = injectGLTF<ShapesGLTF>(() => shapesGLB);

	private stencilParameters = injectMask(() => 1);

	constructor() {
		effect(() => {
			const gltf = this.gltf();
			if (!gltf) return;

			const group = this.groupRef()?.nativeElement;
			if (!group) return;

			const localState = getLocalState(group);
			if (!localState) return;

			// track all children
			localState.objects();

			// Apply stencil to all contents
			group.traverse((child) => {
				if (child instanceof Mesh) {
					Object.assign(child.material, { ...this.stencilParameters() });
				}
			});
		});
	}
}
