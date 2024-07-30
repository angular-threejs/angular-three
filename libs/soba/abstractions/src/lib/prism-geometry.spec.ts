import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtTestBed } from 'angular-three/testing';
import { ExtrudeGeometry, Mesh } from 'three';
import { NgtsPrismGeometry } from './prism-geometry';

describe(NgtsPrismGeometry.name, () => {
	@Component({
		standalone: true,
		template: `
			<ngt-mesh>
				<ngts-prism-geometry
					[vertices]="[
						[0, 0, 0],
						[1, 0, 0],
						[0, 1, 0],
						[0, 0, 1],
					]"
				/>
			</ngt-mesh>
		`,
		schemas: [CUSTOM_ELEMENTS_SCHEMA],
		imports: [NgtsPrismGeometry],
	})
	class SceneGraph {}

	it('should render properly', async () => {
		const { scene, fixture, toGraph } = NgtTestBed.create(SceneGraph);
		fixture.detectChanges();

		expect(scene.children.length).toEqual(1);
		const mesh = scene.children[0] as Mesh<ExtrudeGeometry>;

		expect(mesh.geometry.type).toEqual('ExtrudeGeometry');
		expect(toGraph()).toMatchSnapshot();
	});
});
