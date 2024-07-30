import { NgtTestBed } from 'angular-three/testing';
import { Line2, LineGeometry, LineSegments2, LineSegmentsGeometry } from 'three-stdlib';
import { NgtsLine } from './line';

describe(NgtsLine.name, () => {
	it('should render properly', async () => {
		const { scene, fixture, toGraph } = NgtTestBed.create(NgtsLine);
		fixture.detectChanges();

		expect(scene.children.length).toEqual(1);
		const line = scene.children[0] as Line2;
		expect(line).toBeInstanceOf(Line2);
		expect(line.geometry).toBeInstanceOf(LineGeometry);
		expect(toGraph()).toMatchSnapshot();
	});

	it('should render properly with segments', async () => {
		const { scene, fixture, toGraph } = NgtTestBed.create(NgtsLine);
		fixture.componentRef.setInput('segments', true);
		fixture.detectChanges();

		expect(scene.children.length).toEqual(1);
		const line = scene.children[0] as LineSegments2;
		expect(line).toBeInstanceOf(LineSegments2);
		expect(line.isLineSegments2).toEqual(true);
		expect(line.geometry).toBeInstanceOf(LineSegmentsGeometry);
		expect(toGraph()).toMatchSnapshot();
	});
});
