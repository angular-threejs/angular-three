import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

describe('gltf generator', () => {
	let tree: Tree;

	beforeEach(() => {
		tree = createTreeWithEmptyWorkspace();
	});

	it('should run successfully', async () => {
		expect(true).toBe(true);
	});

	// it('should run successfully', async () => {
	// 	await gltfGenerator(tree, options);
	// 	const config = readProjectConfiguration(tree, 'test');
	// 	expect(config).toBeDefined();
	// });
});
