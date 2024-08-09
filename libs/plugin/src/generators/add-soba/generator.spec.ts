import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { initGenerator } from '../init/generator';

describe('add-soba generator', () => {
	let tree: Tree;

	beforeEach(() => {
		tree = createTreeWithEmptyWorkspace();
	});

	it('should run successfully', async () => {
		await initGenerator(tree, { skipGenerateExperience: true });
		expect(true).toBe(true);
	});
});
