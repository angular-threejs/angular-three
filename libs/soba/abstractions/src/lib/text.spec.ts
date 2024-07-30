import { NgtTestBed } from 'angular-three/testing';
import { NgtsText } from './text';

describe(NgtsText.name, () => {
	it('should render properly', async () => {
		const { scene, fixture, toGraph } = NgtTestBed.create(NgtsText);
		fixture.componentRef.setInput('text', 'hello');
		fixture.detectChanges();

		expect(scene.children.length).toEqual(1);
		expect(toGraph()).toMatchSnapshot();
	});
});
