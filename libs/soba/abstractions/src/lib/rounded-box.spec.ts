import { NgtTestBed } from 'angular-three/testing';
import { ExtrudeGeometry, Mesh } from 'three';
import { NgtsRoundedBox } from './rounded-box';

describe(NgtsRoundedBox.name, () => {
	it('should render properly', async () => {
		const { scene, fixture, toGraph } = NgtTestBed.create(NgtsRoundedBox);
		fixture.detectChanges();

		expect(scene.children.length).toEqual(1);
		const mesh = scene.children[0] as Mesh<ExtrudeGeometry>;
		expect(mesh.geometry).toBeInstanceOf(ExtrudeGeometry);
		expect(toGraph()).toMatchSnapshot();
	});
});
