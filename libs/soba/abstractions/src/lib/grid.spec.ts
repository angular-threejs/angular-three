import { NgtTestBed } from 'angular-three/testing';
import { NgtsGrid } from './grid';

describe(NgtsGrid.name, () => {
	it('should render properly', async () => {
		const { scene, fixture } = NgtTestBed.create(NgtsGrid);
		fixture.detectChanges();

		expect(scene.children.length).toEqual(1);
		expect(scene.toJSON()).toMatchSnapshot();
	});
});
