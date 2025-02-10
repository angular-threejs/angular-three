import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { gltfGenerator } from './gltf';

describe('gltf generator', () => {
	let tree: Tree;

	beforeEach(() => {
		tree = createTreeWithEmptyWorkspace();
	});

	it('should run successfully', async () => {
		await gltfGenerator(tree, {});
		expect(true).toBe(true);
	});
});
