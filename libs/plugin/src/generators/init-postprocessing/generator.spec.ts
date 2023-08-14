import { readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { ANGULAR_THREE_VERSION, POSTPROCESSING_VERSION } from '../versions';
import init from './generator';

describe('init generator', () => {
	let appTree: Tree;

	beforeEach(() => {
		appTree = createTreeWithEmptyWorkspace();
	});

	it('should add three dependencies', async () => {
		await init(appTree);

		const packageJson = readJson(appTree, 'package.json');

		expect(packageJson.dependencies['angular-three-postprocessing']).toEqual(ANGULAR_THREE_VERSION);
		expect(packageJson.dependencies['postprocessing']).toEqual(POSTPROCESSING_VERSION);
	});
});
