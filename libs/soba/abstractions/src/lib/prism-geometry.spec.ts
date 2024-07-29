import { NgtTestBed } from 'angular-three/testing';
import { NgtsPrismGeometry } from './prism-geometry';

describe(NgtsPrismGeometry.name, () => {
	it('should render properly', async () => {
		const { scene } = NgtTestBed.create(NgtsPrismGeometry);

		expect(true).toBe(true);
	});
});
