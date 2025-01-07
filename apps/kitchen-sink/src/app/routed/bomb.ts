import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsMeshTransmissionMaterial } from 'angular-three-soba/materials';
import { Mesh } from 'three';
import { GLTF } from 'three-stdlib';

import bombUrl from './bomb-gp.glb';

interface BombGLTF extends GLTF {
	nodes: {
		Little_Boy_Little_Boy_Material_0: Mesh;
	};
}

@Component({
	selector: 'app-bomb',
	template: `
		@if (gltf(); as gltf) {
			<ngt-mesh
				[receiveShadow]="true"
				[castShadow]="true"
				[scale]="0.7"
				[geometry]="gltf.nodes.Little_Boy_Little_Boy_Material_0.geometry"
			>
				<ngts-mesh-transmission-material [options]="{ backside: true, thickness: 5, backsideThickness: 10 }" />
			</ngt-mesh>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsMeshTransmissionMaterial],
})
export default class Bomb {
	protected gltf = injectGLTF<BombGLTF>(() => bombUrl);
}
